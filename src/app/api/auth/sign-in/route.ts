import { NextResponse } from 'next/server'
import { handler, enforceRateLimit, jsonError, readJson } from '@/lib/api'
import { databaseConfigured } from '@/lib/db'
import { isEmail } from '@/lib/validate'
import { createHash } from 'node:crypto'
import { fetchLoginForm, postSignIn, postSignOut, probeOjsIdentity } from '@/lib/auth/ojs-login'
import { ojsIsSameOrigin, setOjsSessionCookie } from '@/lib/auth/ojs-cookie'
import { PORTAL_SESSION_COOKIE, SESSION_TTL_SECONDS, createSession } from '@/lib/auth/portal-session'
import { ojsBaseUrl } from '@/lib/ojs/config'

export const dynamic = 'force-dynamic'

/**
 * Signs a user in against OJS and issues the portal's own session.
 *
 * OJS 3.5 has no login API, so this drives its web login handler server-side:
 * fetch the form for a CSRF token and an anonymous session, post the
 * credentials, then confirm the result against the OJS profile page — which is
 * also where the identity comes from, since `/api/v1/users/me` does not exist
 * in this release. The approach was verified against the live instance before
 * being built on; see `npm run spike` check 3 and docs/OJS-INTEGRATION.md.
 *
 * What the browser ends up holding is `ngiq_session`, the portal's own cookie.
 * **The OJS session id never reaches the browser** — it stays in
 * `portal_sessions`. That is deliberate: OJS scopes `OJSSID` to `path=/ojs/`,
 * so a copy re-issued at `path=/` would leave two cookies of the same name
 * whose precedence is browser-dependent, which is an intermittent
 * session-mixing bug rather than a theoretical one.
 *
 * `PORTAL_NATIVE_SIGNIN` gates the whole route. With it off the sign-in page
 * leads with the OJS link-out instead, which always works.
 */

type Body = { email?: string; password?: string }

const nativeSignInEnabled = process.env.PORTAL_NATIVE_SIGNIN === '1'

/**
 * A short, stable, pseudonymous handle for an account in the logs.
 *
 * Support needs to see that the same account failed five times in a row, and
 * which failure it was each time; the log must not hold the address itself
 * (see the register route, which logs the username for the same reason). The
 * first ten hex characters of a hash are enough to correlate and nothing else.
 */
const accountRef = (identifier: string) =>
  createHash('sha256').update(identifier.trim().toLowerCase()).digest('hex').slice(0, 10)

const unavailable = (message: string) =>
  NextResponse.json(
    { ok: false, error: 'unavailable', message },
    { status: 503, headers: { 'Cache-Control': 'no-store' } },
  )

export const POST = handler(async (request) => {
  if (!nativeSignInEnabled) {
    return unavailable('Sign in through the journal system. Accounts are managed in OJS.')
  }
  if (!ojsBaseUrl) {
    return unavailable('Sign-in is not configured on this server.')
  }
  if (!databaseConfigured) {
    // Without the session store there is nowhere to put the result, and
    // succeeding at the OJS end only to drop the session would look like a
    // wrong password to the user.
    return unavailable('Sign-in is temporarily unavailable. Please try the journal system.')
  }

  // A credential endpoint with no rate limit is an open invitation to
  // credential stuffing — and every attempt here is relayed to OJS, so the
  // limit protects OJS too, not just the portal.
  enforceRateLimit(request, 'sign-in', 5)

  const body = await readJson<Body>(request)
  const identifier = body.email?.trim() ?? ''
  const password = body.password ?? ''

  if (!identifier || !password) {
    return jsonError('validation', 422, {
      errors: [
        ...(identifier ? [] : [{ field: 'email', message: 'Enter the email address you registered with' }]),
        ...(password ? [] : [{ field: 'password', message: 'Enter your password' }]),
      ],
    })
  }

  // OJS accepts either a username or an email in this field, so an address that
  // is not email-shaped is still worth relaying — it may be a username. The
  // check only exists to catch obvious nonsense before an outbound request.
  if (identifier.length > 320 || (identifier.includes('@') && !isEmail(identifier))) {
    return jsonError('invalid-credentials', 401)
  }

  // The browser's agent rides along on every OJS call, so the session OJS
  // creates is fingerprinted to the browser that will later present it
  // directly via the OJSSID hand-off. See withUserAgent in ojs-login.ts.
  const userAgent = request.headers.get('user-agent')

  const form = await fetchLoginForm(userAgent)
  if (!form) {
    return NextResponse.json(
      { ok: false, error: 'ojs-unreachable' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const result = await postSignIn(form, identifier, password, userAgent)

  if (!result.ok) {
    if (result.reason === 'ojs-unreachable') {
      console.error(`[sign-in] OJS did not answer the sign-in post (account ${accountRef(identifier)})`)
      return NextResponse.json(
        { ok: false, error: 'ojs-unreachable' },
        { status: 502, headers: { 'Cache-Control': 'no-store' } },
      )
    }
    if (result.reason === 'ojs-error') {
      // OJS failed on the request rather than ruling on the credentials. The
      // status is the lead for whoever reads the log; the page says only that
      // the editorial system errored, which is true and is all the person can
      // act on.
      console.error(`[sign-in] OJS answered HTTP ${result.status} to the sign-in post (account ${accountRef(identifier)})`)
      return NextResponse.json(
        { ok: false, error: 'ojs-error', status: result.status },
        { status: 502, headers: { 'Cache-Control': 'no-store' } },
      )
    }
    if (result.reason === 'password-change-required') {
      // The password was right; OJS wants a new one before it will open a
      // session. That has to happen on OJS's own change-password page, which
      // the sign-in page links to. See passwordChangeRequired in ojs-login.ts.
      console.warn(`[sign-in] OJS requires a password change before sign-in (account ${accountRef(identifier)})`)
      return jsonError('password-change-required', 401, {
        message:
          'The editorial system requires a new password for this account before it can sign in. Set one there, then sign in here again.',
      })
    }
    // OJS's own wording is passed through: "not been validated" and "disabled"
    // are both reported as invalid credentials otherwise, and the user has no
    // way to tell that the fix is in their inbox.
    return jsonError('invalid-credentials', 401, result.message ? { message: result.message } : {})
  }

  const probe = await probeOjsIdentity(result.sid, userAgent)
  const identity = probe.identity
  if (!identity) {
    // OJS accepted the credentials but the session does not resolve to a user.
    // Reporting success here would hand out a session with no identity behind
    // it, so this fails loudly instead — and with its working shown. The
    // one-line version of this message was all the log held the last time it
    // fired for a single account while every other account signed in, and it
    // took a day to learn that OJS had been redirecting that account to its
    // change-password page. Status and locations are what settle that in a
    // minute: a 302 to login is a session OJS would not keep, a 500 is the
    // profile page failing for this account, a 200 is the markup changing.
    console.error(
      `[sign-in] OJS accepted credentials but the session did not resolve to a user ` +
        `(account ${accountRef(identifier)}; sign-in redirected to ${result.redirectedTo ?? 'nowhere'}; ` +
        `profile answered ${probe.status || 'no response'}${probe.location ? ` → ${probe.location}` : ''})`,
    )
    return NextResponse.json(
      { ok: false, error: 'session-not-accepted' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  // The credentials were already accepted by OJS, so a failure here is
  // infrastructure, not the user — and it must not surface as a bare 500.
  //
  // `databaseConfigured` above only proves `PORTAL_DATABASE_URL` is *set*, not
  // that anything is listening on it. With the env var present and MySQL down,
  // this insert threw ECONNREFUSED, the route 500'd, no session cookie was
  // issued, and the browser went straight back to the sign-in form — looking
  // for all the world like a rejected password that no number of retries could
  // fix. The route already has the right wording for an outage; this routes the
  // unreachable case into it.
  let token: string
  try {
    ;({ token } = await createSession({
      user: identity,
      ojsSid: result.sid,
      ojsCsrfToken: identity.csrfToken ?? null,
    }))
  } catch (error) {
    console.error('[sign-in] session store unavailable, cannot complete sign-in:', error)

    // The OJS session just minted is now orphaned — nothing will ever present
    // it, and it stays valid for OJS's full session lifetime. Hand it back
    // rather than leaving a live credential nobody owns.
    try {
      await postSignOut(result.sid, userAgent)
    } catch {
      /* best effort: the sign-in has already failed, and this is cleanup */
    }

    return unavailable('Sign-in is temporarily unavailable. Please try the journal system.')
  }

  const response = NextResponse.json(
    { ok: true, user: { id: identity.id, fullName: identity.fullName, roles: identity.roles } },
    { headers: { 'Cache-Control': 'no-store' } },
  )

  response.cookies.set({
    name: PORTAL_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    // Not in development, where the portal is served over plain HTTP on
    // localhost and a Secure cookie would never be sent back.
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })

  // Hand the browser the OJS session too, under OJS's own cookie attributes
  // (see ojsSessionCookie). Without this, only links routed through
  // /api/auth/ojs-handoff reached OJS signed in — a typed or bookmarked OJS
  // URL still hit the login form, because the hand-off never ran. One
  // sign-in must sign the reader into both halves of the site. Skipped when
  // OJS lives on another origin (localhost development), where a cookie for
  // it cannot be set from here.
  //
  // Must stay below the `response.cookies.set` above: that call rewrites the
  // whole Set-Cookie header and would discard these. See ojs-cookie.ts.
  if (ojsIsSameOrigin) {
    setOjsSessionCookie(response, request, result.sid)
  }

  return response
})
