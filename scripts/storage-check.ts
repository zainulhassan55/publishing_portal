/**
 * Confirms object storage is set up the way the editorial forms need it.
 *
 *   npm run storage:check
 *
 * For each bucket it walks the real path a file takes: a presigned PUT (what
 * the browser does), a HEAD and a ranged read (what verification does), a
 * presigned GET (what an admin download does), and a CORS preflight from the
 * site's origin (without which the browser upload is blocked even though every
 * server-side step works). The test object is deleted at the end.
 *
 * Exits non-zero on the first failure, naming the step, so it is safe to run
 * on the server after editing ~/portal/.env.
 */
import { existsSync } from 'node:fs'
import { loadLocalEnv } from './env.ts'

loadLocalEnv()

// In the repository the module is in src/lib; in a release bundle deploy.sh copies it to scripts/lib.
const local = new URL('./lib/storage.ts', import.meta.url)
const storage = await import(existsSync(local) ? local.href : '../src/lib/storage.ts')

if (!storage.storageConfigured()) {
  console.error('Storage is not configured. Set S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY,')
  console.error('S3_BUCKET_SUBMISSIONS and S3_BUCKET_PUBLICATIONS (see .env.example).')
  process.exit(1)
}

const origin = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.nextgeniqpress.com').replace(/\/$/, '')
const body = `%PDF-1.4\n% storage check ${new Date().toISOString()}\n`
let failed = false

async function step(name: string, fn: () => Promise<void>) {
  try {
    await fn()
    console.log(`  ok    ${name}`)
  } catch (error) {
    failed = true
    console.error(`  FAIL  ${name}: ${error instanceof Error ? error.message : error}`)
    throw error
  }
}

for (const bucket of ['submissions', 'publications'] as const) {
  const key = `healthcheck/${Date.now()}.pdf`
  console.log(`\n${bucket} bucket`)
  try {
    let putUrl = ''
    await step('presigned upload (browser path)', async () => {
      putUrl = await storage.presignUpload(bucket, key, 'application/pdf', 120)
      const res = await fetch(putUrl, { method: 'PUT', headers: { 'Content-Type': 'application/pdf' }, body })
      if (!res.ok) throw new Error(`HTTP ${res.status} ${await res.text()}`)
    })
    await step('object exists with the right size', async () => {
      const info = await storage.headObject(bucket, key)
      if (!info) throw new Error('not found after upload')
      if (info.size !== Buffer.byteLength(body)) throw new Error(`size ${info.size}, expected ${Buffer.byteLength(body)}`)
    })
    await step('ranged read of the first bytes', async () => {
      const head = await storage.readHead(bucket, key, 5)
      if (new TextDecoder().decode(head) !== '%PDF-') throw new Error('unexpected bytes')
    })
    await step('presigned download (admin path)', async () => {
      const res = await fetch(await storage.presignDownload(bucket, key, 'check.pdf', 60))
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      if ((await res.text()) !== body) throw new Error('downloaded content differs')
    })
    await step(`CORS preflight from ${origin}`, async () => {
      const res = await fetch(putUrl, {
        method: 'OPTIONS',
        headers: { Origin: origin, 'Access-Control-Request-Method': 'PUT', 'Access-Control-Request-Headers': 'content-type' },
      })
      const allowed = res.headers.get('access-control-allow-origin')
      if (!res.ok || (allowed !== origin && allowed !== '*')) {
        throw new Error(`not allowed (HTTP ${res.status}, allow-origin: ${allowed ?? 'none'}). Add ${origin} to the bucket's CORS policy.`)
      }
    })
  } catch {
    // Reported by step(); carry on to clean up and check the other bucket.
  } finally {
    await storage.deleteObject(bucket, key).catch(() => undefined)
  }
}

console.log(failed ? '\nStorage check FAILED.' : '\nStorage check passed.')
process.exit(failed ? 1 : 0)
