import { NextResponse } from 'next/server'
import { handler, enforceRateLimit, jsonError, jsonOk, readJson } from '@/lib/api'
import { databaseConfigured } from '@/lib/db'
import { Validator } from '@/lib/validate'
import { fetchRegisterForm, postRegister } from '@/lib/auth/ojs-register'
import { fetchLoginForm, fetchOjsIdentity, postSignIn } from '@/lib/auth/ojs-login'
import { ojsIsSameOrigin, ojsSessionCookie } from '@/lib/auth/ojs-cookie'
import { PORTAL_SESSION_COOKIE, SESSION_TTL_SECONDS, createSession } from '@/lib/auth/portal-session'
import { ojsBaseUrl } from '@/lib/ojs/config'

export const dynamic = 'force-dynamic'

/**
 * Creates an OJS account from the portal, then signs the new member in.
 *
 * Registration used to be the last link that handed a visitor to the old
 * interface — the one journey where someone who had never seen the site
 * before met the editorial system first. It now happens here, and OJS still
 * owns the account: the portal relays the registration to OJS's own form
 * rather than keeping any user record of its own. See ojs-register.ts.
 *
 * Signing in immediately afterwards is the point of doing this at all. A
 * confirmation screen saying "now go and sign in" would have spent the
 * redesign on a form and left the hand-off in place one step later — and with
 * site email unconfigured, anything that waits on an inbox strands people.
 * `require_validation = Off` on this install is what makes it legitimate: the
 * account is usable the moment OJS creates it.
 *
 * Validation here is deliberately thin. Shape only — an address that is not
 * an address, a password too short to be worth relaying — and everything
 * else is OJS's call, reported in OJS's words. Duplicate usernames and
 * password rules live there, and a second copy here would drift.
 */

type Body = {
  givenName?: string
  familyName?: string
  email?: string
  username?: string
  password?: string
  affiliation?: string
  country?: string
  journals?: unknown
  asReviewer?: unknown
}

/** OJS's own floor is 6; `minimum_password_length` is unset on this install. */
const MIN_PASSWORD = 6

const unavailable = (message: string) =>
  NextResponse.json(
    { ok: false, error: 'unavailable', message },
    { status: 503, headers: { 'Cache-Control': 'no-store' } },
  )

export const POST = handler(async (request) => {
  if (!ojsBaseUrl) return unavailable('Registration is not configured on this server.')
  if (!databaseConfigured) {
    // The account would be created in OJS and then have nowhere to put the
    // session, so the new member would be bounced to a sign-in page believing
    // registration had failed. Refusing up front is the honest failure.
    return unavailable('Registration is temporarily unavailable. Please try again shortly.')
  }

  // Account creation is the most attractive endpoint on the site to a script.
  // Three an hour per address is far above what a person needs and far below
  // what bulk sign-up requires.
  enforceRateLimit(request, 'register', 3)

  const body = await readJson<Body>(request)
  const v = new Validator()

  const givenName = v.string({ field: 'givenName', value: body.givenName, label: 'First name', max: 255 })
  const familyName = v.string({ field: 'familyName', value: body.familyName, label: 'Last name', max: 255 })
  const email = v.email('email', body.email)
  const username = v.string({ field: 'username', value: body.username, label: 'Username', max: 32 })
  // Both required because OJS requires them. Accepting a registration here
  // that OJS will reject would report the failure against a field the person
  // was told was optional.
  const affiliation = v.string({ field: 'affiliation', value: body.affiliation, label: 'Affiliation', max: 255 })
  const country = v.string({ field: 'country', value: body.country, label: 'Country', max: 2 })

  const password = typeof body.password === 'string' ? body.password : ''
  if (password.length < MIN_PASSWORD) {
    v.add({ field: 'password', message: `Password must be at least ${MIN_PASSWORD} characters` })
  }

  const journals = Array.isArray(body.journals) ? body.journals.filter((j): j is string => typeof j === 'string') : []
  if (journals.length === 0) {
    v.add({ field: 'journals', message: 'Choose at least one journal to register with' })
  }

  v.throwIfInvalid()

  // The browser's agent rides along for the same reason it does at sign-in:
  // OJS fingerprints a session by the agent that created it, and the session
  // this registration opens is the one the new member is about to use.
  const userAgent = request.headers.get('user-agent')

  const form = await fetchRegisterForm(userAgent)
  if (!form) {
    return NextResponse.json(
      { ok: false, error: 'ojs-unreachable' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const result = await postRegister(
    form,
    { givenName, familyName, email, username, password, affiliation, country, journals, asReviewer: body.asReviewer === true },
    userAgent,
  )

  if (!result.ok) {
    if (result.reason === 'ojs-unreachable') {
      return NextResponse.json(
        { ok: false, error: 'ojs-unreachable' },
        { status: 502, headers: { 'Cache-Control': 'no-store' } },
      )
    }
    // A rejected registration used to be the one failure that left no trace at
    // all: nothing logged here, and the generic banner OJS puts above its error
    // list was all the person saw. There was then no way to answer "why can't I
    // register" from either end. The username identifies the attempt for
    // support without putting an email address in the log.
    console.warn(
      `[register] OJS rejected registration for username=${JSON.stringify(username)}:`,
      result.message ?? '(no message parsed from the OJS response)',
    )
    // OJS's wording, passed through: "username already exists" and a password
    // rule need different corrections from the person.
    return jsonError('rejected', 422, result.message ? { message: result.message } : {})
  }

  /* ------------------------- sign the new member in ------------------------ */

  // A fresh login rather than reusing the registration session: OJS rotates
  // the session id on sign-in, and the anonymous one the form was filled under
  // is not the authenticated one.
  const loginForm = await fetchLoginForm(userAgent)
  const signIn = loginForm ? await postSignIn(loginForm, username, password, userAgent) : null
  const identity = signIn?.ok ? await fetchOjsIdentity(signIn.sid, userAgent) : null

  if (!signIn?.ok || !identity) {
    // The account exists — reporting failure would be wrong and would send
    // them round to register again, where OJS would refuse the username they
    // just took. Report success and let them sign in.
    console.error('[register] account created but automatic sign-in did not complete')
    return jsonOk({ created: true, signedIn: false })
  }

  const { token } = await createSession({
    user: identity,
    ojsSid: signIn.sid,
    ojsCsrfToken: identity.csrfToken ?? null,
  })

  const response = jsonOk({
    created: true,
    signedIn: true,
    user: { id: identity.id, fullName: identity.fullName, roles: identity.roles },
  })

  response.cookies.set({
    name: PORTAL_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })

  if (ojsIsSameOrigin) response.cookies.set(ojsSessionCookie(request, signIn.sid))

  return response
})
