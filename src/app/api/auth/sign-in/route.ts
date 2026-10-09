import { NextResponse } from 'next/server'
import { OJS_SESSION_COOKIE, getSession } from '@/lib/auth/session'
import { ojsBaseUrl, requireOjsBaseUrl } from '@/lib/ojs/config'

export const dynamic = 'force-dynamic'

type Body = { email?: string; password?: string }

/**
 * Signs in against OJS and adopts its session cookie.
 *
 * OJS exposes no login API, so this posts to its web login handler and relays
 * the Set-Cookie it issues. That is the undocumented part of the integration
 * and the reason docs/OJS-INTEGRATION.md gates Phase 3 on a spike: OJS may
 * require a CSRF token on the login form, and its response on success is a
 * redirect whose shape can change between releases.
 *
 * Until the spike confirms this path, the UI keeps the OJS login page as a
 * visible fallback, and this route reports `unavailable` rather than guessing.
 */
export async function POST(request: Request) {
  if (!ojsBaseUrl) {
    return NextResponse.json(
      { ok: false, error: 'unavailable', message: 'OJS_BASE_URL is not configured on the server.' },
      { status: 503 },
    )
  }

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ ok: false, error: 'bad-request' }, { status: 400 })
  }

  const email = body.email?.trim()
  const password = body.password

  if (!email || !password) {
    return NextResponse.json({ ok: false, error: 'missing-credentials' }, { status: 400 })
  }

  const form = new URLSearchParams({ username: email, password, remember: '0' })

  let upstream: Response
  try {
    upstream = await fetch(`${requireOjsBaseUrl()}/index.php/index/login/signIn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'text/html',
      },
      body: form,
      redirect: 'manual',
      cache: 'no-store',
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'ojs-unreachable' }, { status: 502 })
  }

  // OJS redirects on success and re-renders the form with an error on failure.
  const setCookie = upstream.headers.getSetCookie?.() ?? []
  const sessionCookie = setCookie.find((c) => c.startsWith(`${OJS_SESSION_COOKIE}=`))
  const redirected = upstream.status >= 300 && upstream.status < 400

  if (!redirected || !sessionCookie) {
    return NextResponse.json({ ok: false, error: 'invalid-credentials' }, { status: 401 })
  }

  const sid = sessionCookie.split(';')[0].split('=')[1]

  const response = NextResponse.json({ ok: true })
  response.cookies.set({
    name: OJS_SESSION_COOKIE,
    value: sid,
    httpOnly: true,
    // Audit finding F-11: the OJS session cookie shipped without Secure.
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })

  // Confirm the adopted session actually resolves to a user before reporting
  // success, so a cookie that OJS will reject never looks like a sign-in.
  const session = await getSession()
  if (!session.user) {
    return NextResponse.json({ ok: false, error: 'session-not-accepted' }, { status: 502 })
  }

  return response
}
