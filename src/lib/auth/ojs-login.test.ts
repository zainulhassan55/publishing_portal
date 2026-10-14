import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  interpretSignIn,
  parseCurrentUser,
  parseLoginError,
  parseLoginForm,
  passwordChangeRequired,
  profileRedirectTarget,
} from './ojs-login.ts'

/**
 * These tests exist for one reason: the login relay depends on another
 * project's markup, and OJS upgrades change markup.
 *
 * The fixtures below are trimmed from real responses captured from
 * OJS 3.5.0.5 at www.nextgeniqpress.com (see docs/OJS-INTEGRATION.md, "Spike
 * results"). When an upgrade changes the shape, these fail — which is the
 * point. A failing `npm test` is a far better way to learn that sign-in broke
 * than a user who cannot get in.
 *
 * If one of these ever fails after an OJS upgrade: re-capture the fixture, fix
 * the parser, and keep both. Do not loosen a test to make it pass.
 */

/* ------------------------------ login form -------------------------------- */

const LOGIN_FORM = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="csrf-token" content="META0TOKEN0aaaaaaaaaaaaaaaaaaaaaaaaaaaa" />
  <meta name="generator" content="Open Journal Systems 3.5.0.5" />
</head>
<body>
  <form class="cmp_form login" method="post" action="https://example.org/ojs/index.php/index/login/signIn">
    <input type="hidden" name="csrfToken" value="FORM0TOKEN0bbbbbbbbbbbbbbbbbbbbbbbbbbbb" />
    <input type="hidden" name="source" value="" />
    <label>Username<input type="text" name="username" /></label>
    <label>Password<input type="password" name="password" /></label>
    <input type="checkbox" name="remember" value="1" />
    <button type="submit">Login</button>
  </form>
</body>
</html>`

test('parseLoginForm prefers the form field over the meta tag', () => {
  // Both are present on the real page. The form field is the one OJS validates
  // against the POST, so it must win.
  assert.equal(parseLoginForm(LOGIN_FORM), 'FORM0TOKEN0bbbbbbbbbbbbbbbbbbbbbbbbbbbb')
})

test('parseLoginForm falls back to the csrf-token meta tag', () => {
  const metaOnly = LOGIN_FORM.replace(/<input type="hidden" name="csrfToken"[^>]*>/, '')
  assert.equal(parseLoginForm(metaOnly), 'META0TOKEN0aaaaaaaaaaaaaaaaaaaaaaaaaaaa')
})

test('parseLoginForm returns empty rather than throwing when no token exists', () => {
  // Not fatal: OJS 3.5 accepts the login POST with or without the token, so the
  // relay sends it when present and proceeds when not.
  assert.equal(parseLoginForm('<html><body>no token here</body></html>'), '')
  assert.equal(parseLoginForm(''), '')
})

/* ------------------------------ login errors ------------------------------ */

const REJECTED = `<!DOCTYPE html>
<html lang="en"><body>
  <form class="cmp_form login" method="post">
    <div class="pkp_form_error_container">
      <span class="pkp_form_error">Invalid username/email or password. Please try again.</span>
    </div>
    <input type="password" name="password" />
  </form>
</body></html>`

test('parseLoginError reads OJS own wording for a refused login', () => {
  assert.equal(parseLoginError(REJECTED), 'Invalid username/email or password. Please try again.')
})

test('parseLoginError keeps the whole message across nested markup', () => {
  // Regression guard: the capture must close on the matching </span>, not on
  // the first </ it meets. Stopping at </strong> truncated the message right
  // before "Check your email" — the only part that tells the user what to do.
  const nested = `<span class="pkp_form_error">Your account has
    <strong>not been validated</strong>.   Check your email.</span>`
  assert.equal(parseLoginError(nested), 'Your account has not been validated. Check your email.')
})

test('parseLoginError returns null for a successful response', () => {
  assert.equal(parseLoginError('<html><body>Redirecting…</body></html>'), null)
  assert.equal(parseLoginError(''), null)
})

/* ------------------------------ currentUser ------------------------------- */

/**
 * The real shape, captured from an authenticated profile page. `roles` are OJS
 * role ids — 1048576 reader, 65536 author — and `csrfToken` is what OJS
 * requires in `X-Csrf-Token` on mutating API calls.
 */
const PROFILE = `<!DOCTYPE html>
<html lang="en">
<head><title>Profile | NextGenIQ Press</title>
<meta name="csrf-token" content="WxUn7aLOlUSXOizDtbJ4XPrbbHFjb9DFFWUYCgqn" /></head>
<body>
<script type="text/javascript">
  pkp.currentUser = {"csrfToken":"WxUn7aLOlUSXOizDtbJ4XPrbbHFjb9DFFWUYCgqn","id":22,"roles":[1048576,65536],"unreadTasksCount":0,"fullName":"Krishna Yadav","username":"krishna9911","initials":"KY","isUserLoggedInAs":false};
</script>
</body></html>`

test('parseCurrentUser reads identity, roles and the CSRF token', () => {
  const user = parseCurrentUser(PROFILE)
  assert.ok(user)
  assert.equal(user.id, 22)
  assert.equal(user.userName, 'krishna9911')
  assert.equal(user.fullName, 'Krishna Yadav')
  assert.equal(user.csrfToken, 'WxUn7aLOlUSXOizDtbJ4XPrbbHFjb9DFFWUYCgqn')
  // Mapped through ROLE_NAMES, not passed through as ids.
  assert.deepEqual(user.roles, ['reader', 'author'])
})

test('parseCurrentUser maps every role id the portal gates on', () => {
  const html = `<script>pkp.currentUser = {"id":7,"username":"ed","roles":[16,17,4096,65536]};</script>`
  const user = parseCurrentUser(html)
  assert.ok(user)
  assert.deepEqual(user.roles, ['manager', 'editor', 'reviewer', 'author'])
})

test('parseCurrentUser ignores role ids it does not recognise', () => {
  // A future OJS role must not appear as `undefined` in the roles array, which
  // would then fail a `hasRole` check in a confusing way.
  const html = `<script>pkp.currentUser = {"id":7,"username":"x","roles":[65536,999999]};</script>`
  assert.deepEqual(parseCurrentUser(html)?.roles, ['author'])
})

test('parseCurrentUser returns null when the blob is absent', () => {
  // This is the signed-out profile page, or a release that stopped emitting the
  // blob. Either way it must read as "no identity", never as a crash.
  assert.equal(parseCurrentUser('<html><body>Please log in</body></html>'), null)
  assert.equal(parseCurrentUser(''), null)
})

test('parseCurrentUser returns null on malformed JSON rather than throwing', () => {
  assert.equal(parseCurrentUser('<script>pkp.currentUser = {"id":22,,};</script>'), null)
})

test('parseCurrentUser rejects a blob with no usable id', () => {
  // Without an id there is no `ojs_user_id` to key portal rows on, so the
  // session would be unusable even though the page parsed.
  assert.equal(parseCurrentUser('<script>pkp.currentUser = {"username":"x","roles":[]};</script>'), null)
  assert.equal(parseCurrentUser('<script>pkp.currentUser = {"id":0,"username":"x"};</script>'), null)
  assert.equal(parseCurrentUser('<script>pkp.currentUser = {"id":"22","username":"x"};</script>'), null)
})

test('parseCurrentUser tolerates a missing fullName and absent email', () => {
  // `email` is simply not in the blob on 3.5; nothing in the session needs it.
  const user = parseCurrentUser('<script>pkp.currentUser = {"id":9,"username":"solo","roles":[65536]};</script>')
  assert.ok(user)
  assert.equal(user.fullName, 'solo')
  assert.equal(user.email, '')
})

test('parseCurrentUser is not confused by other JSON on the page', () => {
  // OJS pages carry several bootstrap objects; the parser must pick the right
  // one rather than the first `{` it finds.
  const html = `<script>
    pkp.currentContext = {"id":1,"name":"IJDH"};
    pkp.currentUser = {"id":31,"username":"picked","roles":[65536]};
    pkp.something = {"id":99};
  </script>`
  assert.equal(parseCurrentUser(html)?.id, 31)
  assert.equal(parseCurrentUser(html)?.userName, 'picked')
})

test('passwordChangeRequired recognises the must-change-password redirect and nothing else', () => {
  assert.equal(passwordChangeRequired('https://www.nextgeniqpress.com/ojs/index.php/index/login/changePassword/dhruv9911'), true)
  assert.equal(passwordChangeRequired('/ojs/index.php/index/login/changePassword?x=1'), true)
  assert.equal(passwordChangeRequired('https://www.nextgeniqpress.com/ojs/index.php/index/index'), false)
  assert.equal(passwordChangeRequired('https://www.nextgeniqpress.com/ojs/index.php/ijdh/dashboard'), false)
  assert.equal(passwordChangeRequired(null), false)
})

/* ---------------------------- sign-in verdict ----------------------------- */

/**
 * Every branch of the verdict, because a misread here is a wrong message to
 * a person: "wrong password" for a server fault, or "did not respond" for a
 * password that was right. The fixtures are the response shapes OJS 3.5.0.5
 * has actually produced against this relay.
 */

const REFUSED_FORM = `<form class="cmp_form login">
  <div class="pkp_form_error">Invalid username/email or password. Please try again.</div>
</form>`

test('interpretSignIn: a 3xx with a rotated cookie is a sign-in on the new session', () => {
  const r = interpretSignIn(
    { status: 302, location: 'https://www.nextgeniqpress.com/ojs/index.php/index/index', rotated: 'NEW0SID', html: '' },
    'ANON0SID',
  )
  assert.deepEqual(r, { ok: true, sid: 'NEW0SID', redirectedTo: 'https://www.nextgeniqpress.com/ojs/index.php/index/index' })
})

test('interpretSignIn: a 3xx without a new cookie keeps the anonymous session', () => {
  const r = interpretSignIn({ status: 302, location: '/ojs/index.php/index/index', rotated: null, html: '' }, 'ANON0SID')
  assert.equal(r.ok, true)
  assert.equal(r.ok && r.sid, 'ANON0SID')
})

test('interpretSignIn: the change-password redirect is not a sign-in, even with a rotated cookie', () => {
  const r = interpretSignIn(
    { status: 302, location: '/ojs/index.php/index/login/changePassword/someone', rotated: 'NEW0SID', html: '' },
    'ANON0SID',
  )
  assert.deepEqual(r, { ok: false, reason: 'password-change-required' })
})

test('interpretSignIn: a re-rendered form carries OJS own refusal', () => {
  const r = interpretSignIn({ status: 200, location: null, rotated: null, html: REFUSED_FORM }, 'ANON0SID')
  assert.deepEqual(r, {
    ok: false,
    reason: 'invalid-credentials',
    message: 'Invalid username/email or password. Please try again.',
  })
})

test('interpretSignIn: a 200 with no error and no cookie is a refusal without a reason', () => {
  const r = interpretSignIn({ status: 200, location: null, rotated: null, html: '<html>nothing</html>' }, 'ANON0SID')
  assert.deepEqual(r, { ok: false, reason: 'invalid-credentials' })
})

test('interpretSignIn: a server error is reported as one, not as a wrong password', () => {
  for (const status of [500, 502, 503, 403, 404]) {
    const r = interpretSignIn({ status, location: null, rotated: null, html: '' }, 'ANON0SID')
    assert.deepEqual(r, { ok: false, reason: 'ojs-error', status }, `status ${status}`)
  }
})

test('interpretSignIn: a server error that still sets a cookie is not mistaken for a sign-in', () => {
  // PHP had already started the session when it died; the cookie proves
  // nothing about the credentials. This used to be read as success, and the
  // identity fetch that followed then failed with no explanation.
  const r = interpretSignIn({ status: 500, location: null, rotated: 'NEW0SID', html: '' }, 'ANON0SID')
  assert.deepEqual(r, { ok: false, reason: 'ojs-error', status: 500 })
})

/* ------------------------- profile-page redirects ------------------------- */

const SITE_PROFILE = 'https://www.nextgeniqpress.com/ojs/index.php/index/user/profile'

test('profileRedirectTarget follows the one-journal redirect to that journal profile', () => {
  // ProfileHandler::profile for an account whose only role is in ijdh. This is
  // the response every single-journal registrant produced, and the portal
  // read it as "not signed in" for a month.
  assert.equal(
    profileRedirectTarget(302, 'https://www.nextgeniqpress.com/ojs/index.php/ijdh/user/profile', SITE_PROFILE),
    'https://www.nextgeniqpress.com/ojs/index.php/ijdh/user/profile',
  )
})

test('profileRedirectTarget resolves a relative Location and the restful_urls spelling', () => {
  assert.equal(
    profileRedirectTarget(302, '/ojs/index.php/ijdh/user/profile', SITE_PROFILE),
    'https://www.nextgeniqpress.com/ojs/index.php/ijdh/user/profile',
  )
  assert.equal(
    profileRedirectTarget(303, '/ojs/ijdh/user/profile', SITE_PROFILE),
    'https://www.nextgeniqpress.com/ojs/ijdh/user/profile',
  )
})

test('profileRedirectTarget does not follow the login redirect of a dead session', () => {
  assert.equal(
    profileRedirectTarget(302, 'https://www.nextgeniqpress.com/ojs/index.php/index/login', SITE_PROFILE),
    null,
  )
  assert.equal(profileRedirectTarget(302, '/ojs/index.php/ijdh/login?source=/user/profile', SITE_PROFILE), null)
})

test('profileRedirectTarget ignores anything that is not a redirect to a profile page', () => {
  assert.equal(profileRedirectTarget(200, null, SITE_PROFILE), null)
  assert.equal(profileRedirectTarget(302, null, SITE_PROFILE), null)
  assert.equal(profileRedirectTarget(302, SITE_PROFILE, SITE_PROFILE), null) // itself: would loop
  assert.equal(profileRedirectTarget(302, 'https://evil.example/ojs/index.php/ijdh/user/profile', SITE_PROFILE), null)
  assert.equal(profileRedirectTarget(302, '/ojs/index.php/ijdh/index', SITE_PROFILE), null)
  assert.equal(profileRedirectTarget(302, 'not a url at all', 'also not a url'), null)
})
