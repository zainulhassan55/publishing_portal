/**
 * Verifies that the built site actually serves content in its HTML.
 *
 * Audit finding F-01: every URL on the old client-rendered site returned the
 * same 983-byte empty shell, so Google Scholar — which does not execute
 * JavaScript — could not see a single word of any journal page. This check is
 * the regression test for that, and it runs in CI on every push.
 *
 * It starts the production server, fetches a handful of representative routes,
 * and asserts that each one contains text that only exists in its content.
 */
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const PORT = process.env.SSR_CHECK_PORT || '3123'
const base = `http://127.0.0.1:${PORT}`

/** Each route must contain every string listed for it. */
const checks = [
  { path: '/', must: ['NextGenIQ Press', 'application/ld+json', '<h1'] },
  { path: '/journals', must: ['International Journal of Digital Health', 'IJQT'] },
  {
    path: '/journals/ijdh',
    must: ['International Journal of Digital Health', 'application/ld+json', 'Periodical'],
  },
  {
    path: '/journals/ijdh/peer-review-process',
    // Real prose from the data layer, so a shell would fail this.
    must: ['double-blind', 'Peer Review'],
  },
  { path: '/authors', must: ['Research Article', 'Short Communication'] },
  { path: '/about', must: ['NextGenIQ Press'] },
]

const server = spawn('npm', ['run', 'start', '--', '--port', PORT], {
  env: { ...process.env, NODE_ENV: 'production' },
  stdio: ['ignore', 'pipe', 'pipe'],
})

let serverLog = ''
server.stdout.on('data', (d) => {
  serverLog += d.toString()
})
server.stderr.on('data', (d) => {
  serverLog += d.toString()
})

const stop = () => {
  if (!server.killed) server.kill('SIGTERM')
}

process.on('exit', stop)

// Wait for the server to accept connections.
let ready = false
for (let attempt = 0; attempt < 60; attempt += 1) {
  try {
    const response = await fetch(base, { signal: AbortSignal.timeout(2000) })
    if (response.status < 500) {
      ready = true
      break
    }
  } catch {
    // Not listening yet.
  }
  await sleep(500)
}

if (!ready) {
  console.error('Server did not start within 30s.\n')
  console.error(serverLog)
  stop()
  process.exit(1)
}

let failures = 0

for (const check of checks) {
  const response = await fetch(`${base}${check.path}`)
  const html = await response.text()

  if (!response.ok) {
    console.error(`FAIL ${check.path} → HTTP ${response.status}`)
    failures += 1
    continue
  }

  const missing = check.must.filter((needle) => !html.includes(needle))

  if (missing.length > 0) {
    console.error(`FAIL ${check.path} → missing from server HTML: ${missing.join(', ')}`)
    failures += 1
    continue
  }

  // A JS shell is a couple of kilobytes. Real content is far more.
  if (html.length < 8000) {
    console.error(`FAIL ${check.path} → only ${html.length} bytes; looks like a shell, not a page`)
    failures += 1
    continue
  }

  console.log(`ok   ${check.path} (${(html.length / 1024).toFixed(1)} kB)`)
}

// An unknown URL must 404, not soft-redirect to the homepage with a 200 —
// audit finding F-08.
const notFound = await fetch(`${base}/this-route-does-not-exist`)
if (notFound.status !== 404) {
  console.error(`FAIL unknown URL → HTTP ${notFound.status}, expected 404`)
  failures += 1
} else {
  console.log('ok   unknown URL returns 404')
}

stop()

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`)
  process.exit(1)
}

console.log('\nAll server-rendering checks passed.')
