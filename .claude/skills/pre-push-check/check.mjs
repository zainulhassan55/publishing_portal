#!/usr/bin/env node
/**
 * Pre-push check for the NextGenIQ Press portal.
 *
 *   node .claude/skills/pre-push-check/check.mjs              full check (verify, build, SSR, live OJS)
 *   node .claude/skills/pre-push-check/check.mjs --no-build   skip the production build and SSR check
 *   node .claude/skills/pre-push-check/check.mjs --offline    skip the live OJS path check
 *
 * Compares your branch (committed + uncommitted + untracked) with origin/main.
 * Exit code 1 means at least one CRITICAL finding: do not push.
 *
 * Every critical check here exists because that exact mistake has broken
 * production before. Keep this list short and real.
 */

import { execSync, spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'

const args = new Set(process.argv.slice(2))
const SITE = 'https://www.nextgeniqpress.com'
const root = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim()
process.chdir(root)

const critical = []
const major = []
const notes = [] // manual steps for whoever deploys
const add = (list, title, detail = '') => list.push({ title, detail })

const sh = (cmd) => {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return ''
  }
}
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '')
const step = (s) => console.log(`\n▶ ${s}`)

/* ------------------------------------------------------------ what changed */

step('Comparing with origin/main')
sh('git fetch -q origin main')
const base = sh('git merge-base HEAD origin/main') || 'origin/main'
const branch = sh('git branch --show-current')

const changed = new Map() // path -> status letter (A, M, D, R)
for (const line of sh(`git diff --name-status ${base}`).split('\n').filter(Boolean)) {
  const [status, ...paths] = line.split('\t')
  changed.set(paths.at(-1), status[0])
}
for (const p of sh('git ls-files --others --exclude-standard').split('\n').filter(Boolean)) changed.set(p, 'A')
const files = [...changed.keys()]
const touched = (re) => files.filter((f) => re.test(f))
const addedLines = (path) =>
  sh(`git diff ${base} -- "${path}"`)
    .split('\n')
    .filter((l) => l.startsWith('+') && !l.startsWith('+++'))
    .map((l) => l.slice(1))
const newContent = (path) => (changed.get(path) === 'A' && !sh(`git ls-files "${path}"`) ? read(path).split('\n') : addedLines(path))

console.log(`  branch: ${branch || '(detached)'} · ${files.length} file(s) changed vs ${base.slice(0, 7)}`)
if (files.length === 0) {
  console.log('  Nothing to check.')
  process.exit(0)
}

/* ------------------------------------------------- C1: branch and pipeline */

if (branch === 'main') {
  add(critical, 'You are on main', 'A push to main deploys to production immediately. Create a branch (git switch -c my-change), push that, and open a PR.')
}

step('npm run verify (typecheck, lint, tests)')
const verify = spawnSync('npm', ['run', 'verify'], { encoding: 'utf8' })
if (verify.status !== 0) {
  const out = (verify.stdout + verify.stderr).split('\n')
  const reasons = out.filter((l) => /error TS\d|^\s*\d+:\d+\s+error\b|^✖ (?!\d+ problems? \(0 errors)|AssertionError|ℹ fail [1-9]/.test(l))
  add(critical, 'npm run verify fails', (reasons.length ? reasons : out.slice(-15)).slice(0, 15).join('\n') + '\nRun `npm run verify` to see the full output.')
} else console.log('  ok')

if (!args.has('--no-build')) {
  step('npm run build + SSR check (what CI and the deploy run)')
  if (!existsSync('content/harvest.json')) spawnSync('npm', ['run', 'harvest'], { encoding: 'utf8' })
  const build = spawnSync('npm', ['run', 'build'], { encoding: 'utf8' })
  if (build.status !== 0) {
    add(critical, 'Production build fails', (build.stdout + build.stderr).split('\n').filter((l) => /error|failed/i.test(l)).slice(0, 15).join('\n'))
  } else {
    const ssr = spawnSync('node', ['scripts/check-ssr.mjs'], { encoding: 'utf8' })
    if (ssr.status !== 0) add(critical, 'SSR check fails: a public page no longer serves real HTML', (ssr.stdout + ssr.stderr).split('\n').slice(-15).join('\n'))
    else console.log('  ok')
  }
}

/* ----------------------- C2: scripts that run on the server can import all */
/*
 * deploy.sh copies only a few files into a release (no src/, no node_modules
 * except what it installs). The cron harvest and the migration runner execute
 * there. An import of a file deploy.sh does not ship works on your laptop and
 * crashes on the server — this broke the harvest on 2026-10-31.
 */

step('Server scripts: every import is shipped by deploy.sh')
{
  const stage = mkdtempSync(join(tmpdir(), 'ngiq-release-'))
  const copyLines = read('scripts/deploy.sh')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /^(cp|mkdir -p) /.test(l) && /"\$STAGE\/(scripts|src|deploy)/.test(l))
  const run = spawnSync('bash', ['-c', `set -e\n${copyLines.join('\n')}`], { env: { ...process.env, STAGE: stage }, encoding: 'utf8' })
  if (run.status !== 0) {
    add(critical, 'deploy.sh copies a file that does not exist', run.stderr.trim())
  } else {
    const walk = (dir) => readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? (n === 'node_modules' ? [] : walk(join(dir, n))) : [join(dir, n)]))
    const missing = []
    for (const file of walk(stage).filter((f) => /\.(ts|mjs|js)$/.test(f))) {
      // Static imports only. A dynamic import() with an existsSync fallback
      // (scripts/storage-check.ts) is deliberate and safe.
      for (const m of readFileSync(file, 'utf8').matchAll(/^\s*(?:import|export)\s[^'"]*?from\s+['"](\.{1,2}\/[^'"]+)['"]|^\s*import\s+['"](\.{1,2}\/[^'"]+)['"]/gm)) {
        const spec = m[1] ?? m[2]
        const target = resolve(dirname(file), spec)
        if (!existsSync(target)) missing.push(`${relative(stage, file)} imports ${spec}  →  not in the release`)
      }
    }
    if (missing.length) {
      add(critical, 'A server-side script imports a file the deploy does not ship', `${missing.join('\n')}\nFix: add a cp line for it in scripts/deploy.sh next to the contexts.ts one (same relative path).`)
    } else console.log('  ok')
  }
  rmSync(stage, { recursive: true, force: true })
}

/* ------------------------------------------------------ C3: migrations */

step('Migrations')
{
  for (const f of touched(/^migrations\//)) {
    const status = changed.get(f)
    if (status !== 'A') {
      add(critical, `Existing migration changed (${status}): ${f}`, 'Production already ran it; edits never re-run and deleting/renaming breaks the ledger. Revert it and add a NEW numbered migration instead.')
      continue
    }
    const sql = read(f)
    if (/\b(DROP\s+(TABLE|COLUMN|INDEX)|RENAME\s+(TABLE|COLUMN|TO)|CHANGE\s+COLUMN|MODIFY\s+COLUMN|TRUNCATE|DELETE\s+FROM)\b/i.test(sql)) {
      add(critical, `Destructive migration: ${f}`, 'Migrations run BEFORE the new code goes live and are never rolled back. The running release (and any rollback) still uses the old schema. Only add tables/columns; get the owner to sign off on anything that drops, renames or deletes.')
    }
    notes.push(`Migration ${f} applies automatically during the deploy and cannot be rolled back.`)
  }
  console.log('  done')
}

/* --------------------------------------------------------- C4: secrets */

step('Secrets')
{
  for (const f of files) {
    if (/(^|\/)\.env(\.|$)/.test(f) && !f.endsWith('.env.example') && changed.get(f) !== 'D') {
      add(critical, `Environment file in the change: ${f}`, 'Never commit .env files. Remove it from the commit (git rm --cached) — it is gitignored for a reason.')
    }
  }
  const secretValue = /\b(OJS_API_KEY|S3_SECRET_ACCESS_KEY|S3_ACCESS_KEY_ID|TURNSTILE_SECRET_KEY|SMTP_PASSWORD|PORTAL_REVALIDATE_SECRET|OJS_SPIKE_PASS|MYSQL_ROOT_PASSWORD)\s*=\s*['"]?[A-Za-z0-9_\-/+]{8,}/
  for (const f of files.filter((p) => changed.get(p) !== 'D' && !/\.env\.example$|\.md$|pre-push-check\//.test(p))) {
    for (const line of newContent(f)) {
      if (/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(line) || secretValue.test(line)) add(critical, `Looks like a real secret in ${f}`, line.trim().slice(0, 120))
      if (/NEXT_PUBLIC_\w*(SECRET|PASSWORD|PRIVATE|API_KEY)\b/.test(line)) add(critical, `Secret given a NEXT_PUBLIC_ name in ${f}`, `${line.trim().slice(0, 120)}\nNEXT_PUBLIC_ values are baked into the JavaScript every visitor downloads.`)
    }
  }
  const ojsPath = read('deploy/build-env.production').match(/^NEXT_PUBLIC_OJS_PATH=(.*)$/m)?.[1]?.trim()
  if (ojsPath && !ojsPath.startsWith('/')) {
    add(critical, 'NEXT_PUBLIC_OJS_PATH in build-env.production is not relative', `It is "${ojsPath}". It must be /ojs, or the shared sign-in with OJS silently stops working.`)
  }
  console.log('  done')
}

/* ---------------------- C5: every title is wired to OJS, nginx and harvest */
/*
 * A journal exists in four places that must agree: its src/data file (portal
 * slug), src/lib/ojs/contexts.ts (OJS path, if different), the OJS path lists
 * in deploy/cloudpanel-vhost.conf, and JOURNAL_SLUGS in scripts/harvest.ts.
 * Renaming in one place only is what produced the old-OJS-screen incident.
 */

step('Titles ↔ OJS paths ↔ nginx ↔ harvest')
{
  const contexts = Object.fromEntries([...read('src/lib/ojs/contexts.ts').matchAll(/^\s*([a-z0-9]+):\s*'([^']+)'/gm)].map((m) => [m[1], m[2]]))
  const slugs = ['src/data/journals', 'src/data/magazines']
    .filter(existsSync)
    .flatMap((d) => readdirSync(d).map((f) => read(join(d, f)).match(/^const slug = '([a-z0-9-]+)'/m)?.[1]))
    .filter(Boolean)
  const vhost = read('deploy/cloudpanel-vhost.conf')
  const loginList = (vhost.match(/\^\/ojs\/index\\\.php\/\(([^)]+)\)\/login/) ?? [])[1]?.toLowerCase().split('|') ?? []
  const harvestList = (read('scripts/harvest.ts').match(/JOURNAL_SLUGS\s*=\s*\[([^\]]*)\]/)?.[1] ?? '').match(/[a-z0-9-]+/g) ?? []

  const live = !args.has('--offline')
  for (const slug of slugs) {
    const ctx = contexts[slug] ?? slug
    if (!loginList.includes(ctx.toLowerCase())) {
      add(critical, `${slug}: OJS path "${ctx}" is missing from deploy/cloudpanel-vhost.conf`, 'Its OJS pages will show the old OJS screen instead of redirecting to the portal. Add it to every journal list in the vhost (and magazines to the magazine rules), then paste the vhost into CloudPanel.')
    }
    if (!harvestList.includes(slug)) {
      add(critical, `${slug}: not in JOURNAL_SLUGS in scripts/harvest.ts`, 'Papers published in this journal will never reach the site.')
    }
    if (live) {
      const status = sh(`curl -s -o /dev/null -m 10 -w "%{http_code}" "${SITE}/ojs/index.php/${ctx}/api/v1/issues"`)
      if (status === '404') {
        add(critical, `${slug}: OJS has no journal at path "${ctx}"`, `${SITE}/ojs/index.php/${ctx} returns 404. Either the journal was not created/renamed in OJS yet, or src/lib/ojs/contexts.ts names the wrong path. Submit links and the harvest for this title will break.`)
      } else if (!status || status === '000') {
        console.log(`  (could not reach OJS to check "${ctx}"; run again online)`)
      }
    }
  }
  console.log(`  checked ${slugs.length} title(s)${live ? ' against live OJS' : ''}`)
}

/* -------------------------------------------- C6: guards and server render */

step('Admin guards and server-rendered pages')
{
  for (const f of touched(/^src\/app\/api\/admin\/.*route\.ts$/)) {
    if (changed.get(f) === 'D') continue
    if (!/requireAdminApi\(/.test(read(f))) add(critical, `Admin API route without requireAdminApi: ${f}`, 'Anyone on the internet could call it. Copy the guard pattern from a neighbouring admin route.')
  }
  for (const f of touched(/^src\/app\/(articles|journals|magazines|series|policies|news)\/.*page\.tsx$|^src\/app\/page\.tsx$/)) {
    if (changed.get(f) === 'D') continue
    if (/^\s*['"]use client['"]/.test(read(f))) add(critical, `Public page turned into a client component: ${f}`, 'Google Scholar cannot index client-rendered pages. Keep page.tsx a server component; put interactivity in a child component marked "use client".')
  }
  console.log('  done')
}

/* ------------------------------------------- MAJOR hints and deploy notes */

if (touched(/^deploy\/cloudpanel-vhost\.conf$/).length) {
  notes.push('deploy/cloudpanel-vhost.conf changed → after merging, paste it into CloudPanel → Sites → www.nextgeniqpress.com → Vhost (keep a copy of the old one). The deploy does NOT update nginx. Not doing this is CRITICAL.')
}
if (touched(/^deploy\/harvest\.sh$/).length) {
  notes.push('deploy/harvest.sh changed → on the server: cp ~/portal/current/deploy/harvest.sh ~/portal/harvest.sh (cron runs the copy).')
}
if (touched(/^ojs\//).length) notes.push('ojs/ theme changed → it is not deployed automatically; copy it into OJS plugins/themes/ and clear the template cache.')
if (touched(/^src\/lib\/ojs\/contexts\.ts$/).length) {
  notes.push('OJS path map changed → the matching journal path must be renamed in OJS (Administration → Hosted Journals) at the same time as this deploy, and the vhost updated and pasted.')
}

const exampleVars = new Set([...read('.env.example').matchAll(/^([A-Z0-9_]+)=/gm)].map((m) => m[1]))
const newVars = new Set()
for (const f of files.filter((p) => /\.(ts|tsx|mjs)$/.test(p) && changed.get(p) !== 'D')) {
  for (const line of newContent(f)) for (const m of line.matchAll(/process\.env\.([A-Z0-9_]+)/g)) if (!exampleVars.has(m[1]) && m[1] !== 'NODE_ENV' && m[1] !== 'PORT') newVars.add(m[1])
}
for (const v of newVars) {
  add(major, `New environment variable ${v} is not in .env.example`, `Add it to .env.example, and to ~/portal/.env on the server before deploying${v.startsWith('NEXT_PUBLIC_') ? ' — and to deploy/build-env.production, since NEXT_PUBLIC_ values are fixed at build time' : ''}.`)
}

if (touched(/^public\/templates\//).length && !touched(/^scripts\/templates\//).length) {
  add(major, 'public/templates changed by hand', 'These files are generated. Change scripts/templates/build.ts or scripts/templates/latex/* and run npm run templates, or the next rebuild erases your edit.')
}
if (touched(/^src\/data\/(journals|magazines|series)\//).some((f) => changed.get(f) === 'A')) {
  add(major, 'New title added: check the full checklist', 'docs/DEVELOPMENT.md → "Add a journal": registry, subjects.ts, images, scripts/templates/build.ts + npm run templates, next.config.ts regexes, OJS journal with the same path, harvest list, vhost lists.')
}

/* ----------------------------------------------------------------- report */

const print = (label, list) => {
  console.log(`\n${label} (${list.length})`)
  for (const [i, f] of list.entries()) {
    console.log(`  ${i + 1}. ${f.title}`)
    if (f.detail) console.log(f.detail.split('\n').map((l) => `       ${l}`).join('\n'))
  }
}
console.log('\n════════════════════════ PRE-PUSH CHECK ════════════════════════')
print('CRITICAL — must be fixed before pushing', critical)
print('MAJOR — fix before merging unless the owner agrees', major)
if (notes.length) {
  console.log('\nDEPLOY NOTES — put these in the PR description')
  for (const n of notes) console.log(`  • ${n}`)
}
console.log(critical.length ? '\n✖ Do not push.' : '\n✔ No critical findings from the automated checks. Now do the review in SKILL.md.')
process.exit(critical.length ? 1 : 0)
