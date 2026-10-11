import { NextResponse } from 'next/server'
import { publicBaseUrl } from '@/lib/api'
import { databaseConfigured } from '@/lib/db'
import { OJS_SESSION_COOKIE } from '@/lib/auth/roles'
import { PORTAL_SESSION_COOKIE, readSession } from '@/lib/auth/portal-session'
import { ojsPathPrefix } from '@/lib/ojs/config'

export const dynamic = 'force-dynamic'

/**
 * Hands the browser the OJS session the portal has been holding, then forwards
 * into OJS — so "Open in the editorial system" does not ask a signed-in user
 * to sign in a second time.
 *
 * The cookie is issued with the exact attributes OJS uses on its own —
 * `path=/ojs/`, Secure, HttpOnly, SameSite=Lax (see docs/OJS-INTEGRATION.md) —
 * so the browser holds at most one OJSSID: OJS overwrites the same
 * (name, domain, path) tuple whenever it rotates the session. The mixing
 * hazard documented in portal-session.ts is about a second copy at `path=/`,
 * which this deliberately is not.
 *
 * `to` is validated, never trusted: the response carries a credential cookie,
 * so an open redirect here would be worth attacking. Accepts the relative
 * paths the URL builders produce and the absolute `urlAuthorWorkflow` URLs
 * OJS supplies — anything else collapses to the OJS front page.
 *
 * Signed-out and expired visitors are redirected without a cookie and land on
 * the OJS login form — exactly where the link went before this route existed.
 */
export async function GET(request: Request) {
  const requested = new URL(request.url).searchParams.get('to') ?? ''

  // Resolved against the public base, never request.url — behind nginx the
  // standalone server reports its own bind address. See publicBaseUrl.
  const base = publicBaseUrl(request)

  // Relative prefix means OJS shares this origin and can be handed the cookie.
  // An absolute prefix is the cross-origin development layout (localhost portal
  // against the live OJS): the redirect still works, the cookie cannot.
  const sameOrigin = ojsPathPrefix.startsWith('/')
  const ojsPath = sameOrigin ? ojsPathPrefix : new URL(ojsPathPrefix).pathname
  const fallback = new URL(`${ojsPathPrefix}/`, base)

  let target: URL
  try {
    target = new URL(requested, base)
  } catch {
    target = fallback
  }

  const allowedHosts = new Set([base.hostname])
  for (const configured of [process.env.NEXT_PUBLIC_SITE_URL, sameOrigin ? '' : ojsPathPrefix]) {
    if (!configured) continue
    try {
      allowedHosts.add(new URL(configured).hostname)
    } catch {
      /* a malformed env var must not break the link */
    }
  }

  const inOjs = target.pathname === ojsPath || target.pathname.startsWith(`${ojsPath}/`)
  if (!allowedHosts.has(target.hostname) || !inOjs) target = fallback

  const response = NextResponse.redirect(target, { status: 302 })
  if (!sameOrigin || !databaseConfigured) return response

  const token = request.headers
    .get('cookie')
    ?.split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${PORTAL_SESSION_COOKIE}=`))
    ?.slice(PORTAL_SESSION_COOKIE.length + 1)
  if (!token) return response

  try {
    const session = await readSession(token)
    if (session) {
      // Same 7-day lifetime OJS puts on its own cookie, and the same one the
      // sign-in route uses — so a browser restart does not strand the reader
      // with a live portal session but no OJS one.
      response.cookies.set({
        name: OJS_SESSION_COOKIE,
        value: session.ojsSid,
        path: `${ojsPath}/`,
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
      })
    }
  } catch (error) {
    // The link must keep working even with the session store down; the worst
    // case is the OJS login form, which is where it went before this route.
    console.error('[ojs-handoff] session lookup failed:', error)
  }

  return response
}
