import { NextResponse } from 'next/server'
import { handler, enforceRateLimit, jsonError, readJson } from '@/lib/api'
import { databaseConfigured } from '@/lib/db'
import { isEmail } from '@/lib/validate'
import { fetchLoginForm, fetchOjsIdentity, postSignIn } from '@/lib/auth/ojs-login'
import { ojsIsSameOrigin, ojsSessionCookie } from '@/lib/auth/ojs-cookie'
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
      return NextResponse.json(
        { ok: false, error: 'ojs-unreachable' },
        { status: 502, headers: { 'Cache-Control': 'no-store' } },
      )
    }
    // OJS's own wording is passed through: "not been validated" and "disabled"
    // are both reported as invalid credentials otherwise, and the user has no
    // way to tell that the fix is in their inbox.
    return jsonError('invalid-credentials', 401, result.message ? { message: result.message } : {})
  }

  const identity = await fetchOjsIdentity(result.sid, userAgent)
  if (!identity) {
    // OJS accepted the credentials but the session does not resolve to a user.
    // Reporting success here would hand out a session with no identity behind
    // it, so this fails loudly instead.
    console.error('[sign-in] OJS accepted credentials but the session did not resolve to a user')
    return NextResponse.json(
      { ok: false, error: 'session-not-accepted' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const { token } = await createSession({
    user: identity,
    ojsSid: result.sid,
    ojsCsrfToken: identity.csrfToken ?? null,
  })

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
  if (ojsIsSameOrigin) {
    response.cookies.set(ojsSessionCookie(request, result.sid))
  }

  return response
})
