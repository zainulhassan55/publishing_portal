/**
 * OJS integration spike: turns the go/no-go in docs/OJS-INTEGRATION.md into
 * evidence instead of opinion.
 *
 *   OJS_BASE_URL=https://www.nextgeniqpress.com/ojs npm run spike
 *   OJS_BASE_URL=… OJS_API_KEY=… OJS_SPIKE_USER=… OJS_SPIKE_PASS=… npm run spike
 *
 * This hits a live third-party service, so it is deliberately NOT part of
 * `npm run verify` or CI. It writes nothing, mutates nothing it was not asked
 * to, and never prints a secret.
 *
 * Checks 0 and 1 need no credentials. Run them on a schedule: an OJS upgrade
 * that moves a route or resets `repository_id` is exactly the class of
 * regression that went unnoticed long enough to reach this plan.
 *
 * Exit code is non-zero if any check that runs fails. Checks whose credentials
 * are absent SKIP, and a skip is not a failure — it means "not yet knowable".
 * Checks 4 and 5 REPORT: they record what OJS actually does with a mutating
 * call so the request shape can be written down, and never fail the run.
 */

import { loadLocalEnv } from './env.ts'

loadLocalEnv()

/**
 * Treat an unreplaced placeholder as absent.
 *
 * Documentation that says `OJS_SPIKE_USER=<username>` invites pasting the
 * angle brackets along with it, and the resulting failure looks identical to a
 * wrong password: OJS answers "Invalid username/email or password" either way.
 * Catching it here turns a confusing dead end into an instruction.
 */
const configured = (name: string): string => {
  const value = (process.env[name] || '').trim()
  if (/^<.*>$/.test(value) || /^(your|the)[-_ ]/i.test(value) || value.toUpperCase() === `REPLACE_${name}`) {
    console.error(`\n  ${name} still holds the placeholder "${value}" — replace it with the real value.`)
    return ''
  }
  return value
}

const baseUrl = configured('OJS_BASE_URL').replace(/\/$/, '')
const apiKey = configured('OJS_API_KEY')
const spikeUser = configured('OJS_SPIKE_USER')
const spikePass = configured('OJS_SPIKE_PASS')

/**
 * Which mutating checks may run. `1` or `all` enables both; name them
 * individually (`submit`, `files`, or `submit,files`) to re-test one without
 * creating state for the other — check 4 creates a real submission every run,
 * and a spike that quietly litters the editorial dashboard is its own problem.
 */
const mutate = (process.env.OJS_SPIKE_MUTATE || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)
const mayMutate = (target: string) => mutate.includes('1') || mutate.includes('all') || mutate.includes(target)

/** The journal context the credentialled checks exercise. */
const SPIKE_CONTEXT = 'ijdh'
const ALL_CONTEXTS = ['ijdh', 'ijdm', 'ijds', 'ijei', 'ijic', 'ijis', 'ijmc', 'ijmr', 'ijqt', 'ijse']

if (!baseUrl) {
  console.error('OJS_BASE_URL is not set. Nothing to probe.')
  console.error('')
  console.error('Put it in .env.local so you never have to pass it again:')
  console.error('  echo "OJS_BASE_URL=https://www.nextgeniqpress.com/ojs" >> .env.local')
  console.error('')
  console.error('Or pass it for one run:')
  console.error('  OJS_BASE_URL=https://www.nextgeniqpress.com/ojs npm run spike')
  process.exit(1)
}

/* ------------------------------- reporting -------------------------------- */

type Outcome = 'PASS' | 'FAIL' | 'SKIP' | 'REPORT'

const results: { check: string; outcome: Outcome; note: string }[] = []

const COLOUR: Record<Outcome, string> = {
  PASS: '\x1b[32m',
  FAIL: '\x1b[31m',
  SKIP: '\x1b[33m',
  REPORT: '\x1b[36m',
}

function record(check: string, outcome: Outcome, note: string) {
  results.push({ check, outcome, note })
  const tint = process.stdout.isTTY ? COLOUR[outcome] : ''
  const reset = process.stdout.isTTY ? '\x1b[0m' : ''
  console.log(`  ${tint}${outcome.padEnd(6)}${reset} ${check}${note ? ` — ${note}` : ''}`)
}

const heading = (title: string) => console.log(`\n${title}`)

/** Response bodies are truncated: enough to act on, not enough to drown in. */
const excerpt = (body: string, limit = 200) =>
  body.replace(/\s+/g, ' ').trim().slice(0, limit) + (body.length > limit ? '…' : '')

/* --------------------------------- fetch ---------------------------------- */

type Probe = { status: number; body: string; headers: Headers; cookies: string[] }

async function probe(url: string, init: RequestInit = {}): Promise<Probe | null> {
  try {
    const response = await fetch(url, {
      redirect: 'manual',
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
      ...init,
    })
    return {
      status: response.status,
      body: await response.text(),
      headers: response.headers,
      cookies: response.headers.getSetCookie?.() ?? [],
    }
  } catch (error) {
    console.log(`         (request failed: ${error instanceof Error ? error.message : 'unknown'})`)
    return null
  }
}

const apiUrl = (context: string, path: string) => `${baseUrl}/index.php/${context}/api/v1${path}`
const pageUrl = (path: string) => `${baseUrl}/index.php${path}`

const sessionCookie = (cookies: string[], name = 'OJSSID') => {
  const match = cookies.find((c) => c.startsWith(`${name}=`))
  return match ? match.split(';')[0].split('=').slice(1).join('=') : null
}

/* ------------------------- check 0 — config preflight ---------------------- */
/**
 * The four server-side settings everything else depends on. Each is a one-line
 * change in config.inc.php, and three of them are currently wrong.
 */

heading('Check 0 — OJS configuration preflight')

const identify = await probe(`${pageUrl('/index/oai')}?verb=Identify`)

if (!identify) {
  record('0a oai-identify', 'FAIL', 'OAI endpoint unreachable')
} else {
  const repositoryId = identify.body.match(/<repositoryIdentifier>([^<]*)<\/repositoryIdentifier>/)?.[1] ?? ''
  const oaiBase = identify.body.match(/<baseURL>([^<]*)<\/baseURL>/)?.[1] ?? ''

  // F-02. The portal brief recorded this as fixed because `base_url` was
  // corrected, but the OAI repository identifier is a separate setting
  // (`[oai] repository_id`) and is what harvesters cache as the record's
  // permanent identity. Getting this wrong means re-registering with every
  // service that already harvested, so it must be fixed while 0 records exist.
  if (!repositoryId) {
    record('0a repository_id', 'FAIL', 'no <repositoryIdentifier> in the Identify response')
  } else if (/localhost|127\.0\.0\.1|:\d+$/.test(repositoryId)) {
    record('0a repository_id', 'FAIL', `still the dev value "${repositoryId}" — set [oai] repository_id (F-02)`)
  } else {
    record('0a repository_id', 'PASS', repositoryId)
  }

  if (oaiBase.startsWith(baseUrl)) {
    record('0b oai base_url', 'PASS', oaiBase)
  } else {
    record('0b oai base_url', 'FAIL', `expected to start with ${baseUrl}, got "${oaiBase}"`)
  }
}

// An API token cannot be validated at all until `api_key_secret` is set, so
// this specific error distinguishes "no secret configured" from "bad key".
const tokenProbe = await probe(`${apiUrl('index', '/contexts')}?count=1&apiToken=spike-probe-not-a-real-key`)

if (!tokenProbe) {
  record('0c api_key_secret', 'FAIL', 'API unreachable')
} else if (/has not configured a secret key/i.test(tokenProbe.body)) {
  record('0c api_key_secret', 'FAIL', 'not set in config.inc.php — no API auth is possible for anyone')
} else {
  record('0c api_key_secret', 'PASS', `secret is configured (probe rejected with HTTP ${tokenProbe.status})`)
}

const loginPage = await probe(pageUrl('/index/login'))

if (!loginPage) {
  record('0d force_ssl', 'FAIL', 'login page unreachable')
} else {
  const raw = loginPage.cookies.find((c) => c.startsWith('OJSSID='))
  // F-11. Without `force_ssl = On` the session cookie has no Secure attribute,
  // so a single plaintext request to the origin leaks a live session.
  if (!raw) {
    record('0d force_ssl', 'SKIP', 'login page issued no OJSSID to inspect')
  } else if (/;\s*secure/i.test(raw)) {
    record('0d force_ssl', 'PASS', 'session cookie carries Secure')
  } else {
    record('0d force_ssl', 'FAIL', 'session cookie has no Secure attribute — set force_ssl = On (F-11)')
  }

  // Not a gate: OJS 3.5 returns the same credential error with or without the
  // token. Recorded because the relay in Phase 3 should send it regardless, and
  // a future release may well start enforcing it.
  const csrf = /name="csrfToken"/.test(loginPage.body) || /name="csrf-token"/.test(loginPage.body)
  record('0e login csrfToken', csrf ? 'PASS' : 'REPORT', csrf ? 'present on the login form' : 'absent')
}

/* ---------------------------- check 1 — route map -------------------------- */
/**
 * OJS answers unauthenticated API requests in three distinguishable ways, which
 * makes a credential-free route inventory possible:
 *
 *   401 "not authorized"        → the route exists and needs auth
 *   500 "could not be found"    → no such route in this release
 *   404 api.404.endpointNotFound → no handler matched
 *
 * That is the only reason this check can run with no key at all, and it is what
 * proved the reviewer API absent and `/users/me` nonexistent in 3.5.0.5.
 */

heading('Check 1 — route map (credential-free)')

type RouteExpectation = 'present' | 'absent'

const ROUTES: { path: string; expect: RouteExpectation; why: string }[] = [
  { path: `${SPIKE_CONTEXT}/api/v1/submissions`, expect: 'present', why: 'Phase 4 author reads + create' },
  { path: `${SPIKE_CONTEXT}/api/v1/submissions/1/files`, expect: 'present', why: 'file attach (not used, metadata-first)' },
  { path: `${SPIKE_CONTEXT}/api/v1/submissions/1/publications`, expect: 'present', why: 'title/abstract live here in 3.4+' },
  { path: `${SPIKE_CONTEXT}/api/v1/submissions/1/participants`, expect: 'present', why: 'author identity on a submission' },
  { path: `${SPIKE_CONTEXT}/api/v1/issues`, expect: 'present', why: 'harvest enrichment' },
  { path: `${SPIKE_CONTEXT}/api/v1/sections`, expect: 'present', why: 'section id → article type mapping' },
  { path: `${SPIKE_CONTEXT}/api/v1/vocabs`, expect: 'present', why: 'keyword vocabulary' },
  { path: 'index/api/v1/contexts', expect: 'present', why: 'journal list, health probe' },
  { path: 'index/api/v1/users/1', expect: 'present', why: 'role ids for hasRole() in Phase 4' },
  // Confirmed absent in 3.5.0.5. Listed so a future upgrade that ADDS them
  // shows up as a surprise in this table rather than going unnoticed.
  { path: 'index/api/v1/users/me', expect: 'absent', why: 'session.ts was built on this; it does not exist' },
  { path: `${SPIKE_CONTEXT}/api/v1/reviews`, expect: 'absent', why: 'no reviewer API → workspace is a link-out' },
  { path: `${SPIKE_CONTEXT}/api/v1/reviewAssignments`, expect: 'absent', why: 'no reviewer API' },
  { path: `${SPIKE_CONTEXT}/api/v1/submissions/1/reviewRounds`, expect: 'absent', why: 'no review-round API' },
]

const classify = (p: Probe): RouteExpectation | 'unknown' => {
  if (p.status === 401 || p.status === 403) return 'present'
  if (/could not be found|endpointNotFound/i.test(p.body)) return 'absent'
  if (p.status === 200) return 'present'
  // A method-not-supported error still proves the route is registered.
  if (/method is not supported for route/i.test(p.body)) return 'present'
  return 'unknown'
}

let routeDrift = 0

for (const route of ROUTES) {
  const result = await probe(`${baseUrl}/index.php/${route.path}`)
  if (!result) {
    record(`1  ${route.path}`, 'FAIL', 'unreachable')
    routeDrift += 1
    continue
  }

  const actual = classify(result)

  if (actual === route.expect) {
    record(`1  ${route.path}`, 'PASS', `${actual} (HTTP ${result.status}) · ${route.why}`)
  } else {
    routeDrift += 1
    record(
      `1  ${route.path}`,
      'FAIL',
      `expected ${route.expect}, got ${actual} (HTTP ${result.status}) · ${route.why} · ${excerpt(result.body, 120)}`,
    )
  }
}

// temporaryFiles is POST-only, so a GET proves registration via the
// method-not-supported error rather than a 401.
const tempFiles = await probe(apiUrl(SPIKE_CONTEXT, '/temporaryFiles'))
if (tempFiles && /method is not supported for route/i.test(tempFiles.body)) {
  record('1  temporaryFiles', 'PASS', 'present, POST-only')
} else {
  record('1  temporaryFiles', 'REPORT', tempFiles ? excerpt(tempFiles.body, 120) : 'unreachable')
}

/**
 * The web routes the portal links out to.
 *
 * These matter more than the API routes right now: link-outs are the entire
 * author and reviewer experience until the portal session lands, so a dead one
 * is a dead end with no alternative path. A signed-out GET must redirect to the
 * login page — a 404 means the route moved, which is exactly what happened to
 * the old `/reviewer` path when OJS 3.4 consolidated the per-role pages into
 * one dashboard.
 *
 * Keep this list in step with the builders in src/lib/ojs/config.ts.
 */
const LINK_OUTS: { path: string; builder: string }[] = [
  { path: `${SPIKE_CONTEXT}/dashboard/mySubmissions`, builder: 'ojsDashboardUrl' },
  { path: `${SPIKE_CONTEXT}/dashboard/reviewAssignments`, builder: 'ojsReviewUrl' },
  { path: `${SPIKE_CONTEXT}/dashboard/editorial`, builder: 'ojsEditorialUrl' },
  { path: `${SPIKE_CONTEXT}/submission/wizard`, builder: 'ojsSubmitUrl' },
  { path: `${SPIKE_CONTEXT}/user/register`, builder: 'ojsJournalRegisterUrl' },
  { path: 'index/login', builder: 'ojsLoginUrl' },
  { path: 'index/login/lostPassword', builder: 'ojsLostPasswordUrl' },
  { path: 'index/user/register', builder: 'ojsRegisterUrl' },
  { path: 'index/user/profile', builder: 'ojsProfileUrl / whoami oracle' },
]

for (const link of LINK_OUTS) {
  const result = await probe(`${baseUrl}/index.php/${link.path}`)
  if (!result) {
    record(`1  ${link.path}`, 'FAIL', `unreachable · ${link.builder}`)
    routeDrift += 1
  } else if (result.status === 404 || result.status >= 500) {
    routeDrift += 1
    record(`1  ${link.path}`, 'FAIL', `HTTP ${result.status} — dead link-out · ${link.builder}`)
  } else {
    record(`1  ${link.path}`, 'PASS', `HTTP ${result.status} · ${link.builder}`)
  }
}

if (routeDrift > 0) {
  console.log(`\n  ${routeDrift} route(s) differ from what this plan was built against.`)
  console.log('  Re-read docs/OJS-INTEGRATION.md before trusting any phase gated on them.')
}

/* --------------------------- check 2 — service key ------------------------- */

heading('Check 2 — service API key (gates Phase 2 harvest)')

if (!apiKey) {
  record('2  service key', 'SKIP', 'OJS_API_KEY not set')
} else {
  const auth = { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' }

  /**
   * Authorisation in OJS is per journal, so one 200 proves nothing about the
   * other nine. An earlier version of this check tested `index/contexts` plus
   * a single journal and reported a key that could read exactly one journal as
   * essentially working — the harvest would then have silently produced a
   * snapshot missing nine journals' articles, which looks identical to nine
   * journals having published nothing.
   */
  const denied: string[] = []
  const allowed: string[] = []

  for (const slug of ALL_CONTEXTS) {
    const submissions = await probe(`${apiUrl(slug, '/submissions')}?status=3&count=1`, { headers: auth })
    if (submissions?.status === 200) allowed.push(slug)
    else denied.push(`${slug}:${submissions?.status ?? 'unreachable'}`)
  }

  if (denied.length === 0) {
    record('2a per-journal reads', 'PASS', `all ${ALL_CONTEXTS.length} journals readable`)
  } else {
    record(
      '2a per-journal reads',
      'FAIL',
      `readable: ${allowed.join(', ') || 'none'} · refused: ${denied.join(', ')}`,
    )
    console.log('         The key\'s account needs a role in every journal the harvest reads.')
    console.log('         Until then the harvest covers only the journals listed as readable.')
  }

  // Informational only: the harvest never calls this, and OJS does not grant
  // it to a journal-scoped role even when every journal read succeeds.
  const contexts = await probe(`${apiUrl('index', '/contexts')}?count=100`, { headers: auth })
  record(
    '2b site contexts',
    contexts?.status === 200 ? 'PASS' : 'REPORT',
    contexts?.status === 200
      ? 'site-level journal list readable'
      : `HTTP ${contexts?.status ?? '?'} — not required by the harvest`,
  )
}

/* ------------------- check 3 — login relay + whoami (the gate) ------------- */
/**
 * The go/no-go for in-portal sign-in, and the one genuinely unknown part of the
 * integration. OJS 3.5 has no login API, so the relay drives its web login
 * handler; and because `/users/me` does not exist, identity is resolved from
 * the profile page's redirect behaviour instead.
 *
 * docs/OJS-INTEGRATION.md's original check #2 tested `/users/me` and would have
 * failed the whole approach for the wrong reason.
 */

heading('Check 3 — login relay + whoami (gates Phase 3)')

let spikeSid: string | null = null
/** OJS wants this in `X-Csrf-Token` on mutating API calls (check 4). */
let spikeCsrfToken: string | null = null

if (!spikeUser || !spikePass) {
  record('3  login relay', 'SKIP', 'OJS_SPIKE_USER / OJS_SPIKE_PASS not set — this is the only Phase 3 blocker')
} else {
  const form = await probe(pageUrl('/index/login'))
  const anonymousSid = form ? sessionCookie(form.cookies) : null
  const csrfToken = form?.body.match(/name="csrfToken"\s+value="([^"]*)"/)?.[1] ?? ''

  if (!form || !anonymousSid) {
    record('3a login form', 'FAIL', 'could not obtain an anonymous session from the login page')
  } else {
    record('3a login form', 'PASS', `anonymous session acquired, csrfToken ${csrfToken ? 'scraped' : 'absent'}`)

    const body = new URLSearchParams({
      username: spikeUser,
      password: spikePass,
      remember: '0',
      source: '',
      ...(csrfToken ? { csrfToken } : {}),
    })

    const signIn = await probe(pageUrl('/index/login/signIn'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'text/html',
        Cookie: `OJSSID=${anonymousSid}`,
      },
      body,
    })

    // OJS rotates the session id on a successful login, so the cookie that
    // matters is the one on this response, not the anonymous one above.
    spikeSid = signIn ? (sessionCookie(signIn.cookies) ?? anonymousSid) : null

    if (!signIn) {
      record('3b signIn', 'FAIL', 'unreachable')
    } else if (/pkp_form_error|Invalid username|not been validated|disabled/i.test(signIn.body)) {
      /**
       * Surface OJS's own wording. "Rejected" covers several very different
       * situations and the fix differs for each: a wrong password, an account
       * awaiting email validation (OJS `require_validation`, and note that
       * validation mail cannot arrive while F-07/DKIM is unresolved), a
       * disabled account, or a relay that is genuinely malformed. Guessing
       * between them wastes more time than printing the message.
       */
      const errors = [...signIn.body.matchAll(/<[^>]*class="[^"]*pkp_form_error[^"]*"[^>]*>([\s\S]*?)<\//g)]
        .map((m) => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim())
        .filter(Boolean)

      const validation = /not been validated|validate your account|confirm your email/i.test(signIn.body)
      const disabled = /disabled/i.test(signIn.body)

      const diagnosis = validation
        ? 'account awaits EMAIL VALIDATION — click the link in the registration email, or disable require_validation in config.inc.php'
        : disabled
          ? 'account appears DISABLED in OJS'
          : 'credentials refused — verify them by logging in manually in a private window'

      record('3b signIn', 'FAIL', diagnosis)
      if (errors.length > 0) {
        for (const e of errors) console.log(`         OJS says: "${e}"`)
      } else {
        console.log(`         body excerpt: ${excerpt(signIn.body, 300)}`)
      }
      console.log('         Note 3a PASSED: the relay mechanism itself works — form fetched,')
      console.log('         csrfToken scraped, session issued. Only authentication failed.')
      spikeSid = null
    } else {
      record('3b signIn', 'PASS', `HTTP ${signIn.status}, session ${spikeSid === anonymousSid ? 'reused' : 'rotated'}`)
    }

    if (spikeSid) {
      // The replacement for /users/me: 302 means the session is not
      // authenticated, 200 means it is and the form is prefilled with identity.
      const profile = await probe(pageUrl('/index/user/profile'), {
        headers: { Cookie: `OJSSID=${spikeSid}`, Accept: 'text/html' },
      })

      if (!profile) {
        record('3c whoami', 'FAIL', 'profile page unreachable')
      } else if (profile.status === 200) {
        /**
         * OJS 3.5 embeds the signed-in user as a JSON object for its Vue app:
         *
         *   currentUser = {"csrfToken":"…","id":22,"roles":[1048576,65536],
         *                  "fullName":"…","username":"…","initials":"KY",…}
         *
         * Parsing that is far steadier than scraping form inputs — it is data,
         * not markup, so a template or CSS change cannot break it. It also
         * carries two things the earlier form-scraping plan assumed were
         * unavailable:
         *
         *   - `roles`, as OJS role ids, matching ROLE_NAMES in
         *     src/lib/auth/session.ts. Role-gated UI does NOT have to wait for
         *     a service-key lookup against index/api/v1/users/{id}.
         *   - `csrfToken`, which is what OJS wants in `X-Csrf-Token` on
         *     mutating API calls — the specific unknown behind check 4.
         *
         * `email` is absent. Nothing in the session needs it; fetch it from the
         * users API if a surface ever does.
         */
        const blob = profile.body.match(/currentUser\s*=\s*(\{[\s\S]*?\});/)?.[1]
        let identity: { id?: number; username?: string; fullName?: string; roles?: number[]; csrfToken?: string } | null =
          null

        if (blob) {
          try {
            identity = JSON.parse(blob)
          } catch {
            identity = null
          }
        }

        if (!identity?.id) {
          // Authenticated but unparsable: the approach works, the parser does
          // not. Phase 3 must treat this as signed-out, never as a 500.
          record('3c whoami', 'FAIL', 'profile page 200 but currentUser could not be parsed')
          console.log(`         body excerpt: ${excerpt(profile.body, 240)}`)
        } else {
          record(
            '3c whoami',
            'PASS',
            `id=${identity.id} username=${identity.username} roles=[${(identity.roles ?? []).join(',')}]`,
          )
          console.log(`         fullName: ${identity.fullName ?? '(absent)'}`)
          console.log(`         csrfToken for mutating API calls: ${identity.csrfToken ? 'present' : 'absent'}`)
          spikeCsrfToken = identity.csrfToken ?? null
        }
      } else {
        record('3c whoami', 'FAIL', `HTTP ${profile.status} → ${profile.headers.get('location') ?? 'no redirect'}`)
      }
    }
  }
}

/* --------------------- check 4 — mutating call (report only) --------------- */
/**
 * Settles two things the Phase 4 code cannot be written without: whether a
 * session-cookie POST is accepted at all (or demands an X-Csrf-Token), and the
 * create body 3.5 expects. OJS 3.4 moved title/abstract/keywords off the
 * submission and onto the publication, so the body currently in
 * src/app/api/drafts/submit/route.ts is probably wrong.
 *
 * Reports rather than fails: this creates real state in OJS, so it only runs
 * with an explicit opt-in, and the spike author's journal must be cleaned up
 * afterwards.
 */

heading('Check 4 — submission create shape (report only)')

if (!spikeSid) {
  record('4  create submission', 'SKIP', 'no authenticated spike session')
} else if (!mayMutate('submit')) {
  record('4  create submission', 'SKIP', 'set OJS_SPIKE_MUTATE=submit (or 1) to run — this creates a real submission')
} else {
  const create = await probe(apiUrl(SPIKE_CONTEXT, '/submissions'), {
    method: 'POST',
    headers: {
      Cookie: `OJSSID=${spikeSid}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      // Scraped from `currentUser` on the profile page in check 3c. A 403
      // without it is the documented signal that OJS requires it.
      ...(spikeCsrfToken ? { 'X-Csrf-Token': spikeCsrfToken } : {}),
    },
    body: JSON.stringify({ locale: 'en', sectionId: 1 }),
  })

  if (!create) {
    record('4  create submission', 'FAIL', 'unreachable')
  } else {
    record('4  create submission', 'REPORT', `HTTP ${create.status}`)
    console.log(`         location: ${create.headers.get('location') ?? '(none)'}`)
    console.log(`         body:     ${excerpt(create.body, 400)}`)
    if (create.status === 403) {
      console.log('         403 → OJS wants an X-Csrf-Token on mutating API calls. Find where a')
      console.log('         logged-in session exposes it and whether it is stable across requests.')
    }
    if (create.status < 300) {
      console.log('         Created real state. Delete it from the OJS editorial dashboard.')
    }
  }
}

/* -------------------- check 5 — temporary file (report only) --------------- */
/**
 * Recorded for completeness even though the plan hands files off to OJS: if
 * that decision is ever revisited, the multipart field name and the response
 * shape are the two unknowns, and this settles both in one run.
 */

heading('Check 5 — temporary file upload shape (report only)')

if (!spikeSid) {
  record('5  temporaryFiles', 'SKIP', 'no authenticated spike session')
} else if (!mayMutate('files')) {
  record('5  temporaryFiles', 'SKIP', 'set OJS_SPIKE_MUTATE=files (or 1) to run')
} else {
  const payload = new FormData()
  payload.append('file', new Blob(['spike probe, safe to delete\n'], { type: 'text/plain' }), 'spike-probe.txt')

  const upload = await probe(apiUrl(SPIKE_CONTEXT, '/temporaryFiles'), {
    method: 'POST',
    headers: {
      Cookie: `OJSSID=${spikeSid}`,
      Accept: 'application/json',
      // Required, and its omission is what made an earlier run look like OJS
      // refusing uploads: the 403 body read "You may have been logged out",
      // which is OJS's CSRF rejection, not an authentication failure.
      ...(spikeCsrfToken ? { 'X-Csrf-Token': spikeCsrfToken } : {}),
      // Content-Type is deliberately unset so fetch adds the multipart
      // boundary itself.
    },
    body: payload,
  })

  if (!upload) {
    record('5  temporaryFiles', 'FAIL', 'unreachable')
  } else {
    record('5  temporaryFiles', 'REPORT', `HTTP ${upload.status} with multipart field name "file"`)
    console.log(`         body: ${excerpt(upload.body, 300)}`)
  }
}

/* --------------------- check 6 — expiry must degrade softly ---------------- */
/**
 * A dead session has to resolve to "signed out", not to a 500 on a public page.
 * Probing OJS with a corrupted session id is the cheap half of that; the other
 * half is the portal's own /api/session, which is asserted in the Phase 3 gate
 * once the portal is deployed.
 */

heading('Check 6 — expired/invalid session degrades to signed-out')

const corrupted = await probe(pageUrl('/index/user/profile'), {
  headers: { Cookie: 'OJSSID=spike-definitely-not-a-valid-session-id', Accept: 'text/html' },
})

if (!corrupted) {
  record('6  invalid session', 'FAIL', 'profile page unreachable')
} else if (corrupted.status >= 300 && corrupted.status < 400) {
  record('6  invalid session', 'PASS', `HTTP ${corrupted.status} → login (the signed-out signal Phase 3 relies on)`)
} else {
  record('6  invalid session', 'FAIL', `expected a redirect to login, got HTTP ${corrupted.status}`)
}

/* --------------------------------- summary -------------------------------- */

const tally = (outcome: Outcome) => results.filter((r) => r.outcome === outcome).length

heading('Summary')
console.log(
  `  ${tally('PASS')} passed · ${tally('FAIL')} failed · ${tally('SKIP')} skipped · ${tally('REPORT')} reported`,
)

const failures = results.filter((r) => r.outcome === 'FAIL')

if (failures.length > 0) {
  console.log('\n  Failures:')
  for (const f of failures) console.log(`    ${f.check} — ${f.note}`)
}

const skipped = results.filter((r) => r.outcome === 'SKIP')
if (skipped.length > 0) {
  console.log('\n  Skipped (credentials or opt-in absent — not knowable yet):')
  for (const s of skipped) console.log(`    ${s.check} — ${s.note}`)
}

console.log('\n  Record the outcome in docs/OJS-INTEGRATION.md.')

process.exit(failures.length > 0 ? 1 : 0)
