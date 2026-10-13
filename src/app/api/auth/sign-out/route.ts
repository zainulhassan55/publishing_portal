import { NextResponse } from 'next/server'
import { publicBaseUrl } from '@/lib/api'
import { databaseConfigured } from '@/lib/db'
import { clearOjsSessionCookies } from '@/lib/auth/ojs-cookie'
import { PORTAL_SESSION_COOKIE, destroySession, readSession } from '@/lib/auth/portal-session'
import { postSignOut } from '@/lib/auth/ojs-login'

export const dynamic = 'force-dynamic'

/**
 * Ends the portal session and the OJS session behind it.
 *
 * Both halves matter. Deleting only the portal row would leave a live OJS
 * session that any other tab on /ojs could still use — the opposite of what
 * sign-out promises. Ending only the OJS side would leave a portal cookie
 * resolving to a dead session until its next revalidation.
 *
 * Order is deliberate: read the row first, tell OJS, then delete. If the OJS
 * call fails the row is still deleted, so a user is never stuck appearing
 * signed in because a third party was unreachable.
 *
 * Never errors. Sign-out that fails is worse than useless — it leaves someone
 * believing they are signed out when they are not — so every path ends in the
 * same redirect with the cookies cleared.
 */
export async function POST(request: Request) {
  const token = request.headers
    .get('cookie')
    ?.split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${PORTAL_SESSION_COOKIE}=`))
    ?.slice(PORTAL_SESSION_COOKIE.length + 1)

  if (token && databaseConfigured) {
    try {
      const session = await readSession(token)
      if (session) await postSignOut(session.ojsSid, request.headers.get('user-agent'))
      await destroySession(token)
    } catch (error) {
      console.error('[sign-out] cleanup failed, clearing cookies anyway:', error)
    }
  }

  const response = NextResponse.redirect(new URL('/', publicBaseUrl(request)), { status: 303 })

  response.cookies.set({ name: PORTAL_SESSION_COOKIE, value: '', path: '/', maxAge: 0 })

  // Must stay below the `response.cookies.set` above, which rewrites the whole
  // Set-Cookie header and would discard these. See ojs-cookie.ts.
  //
  // Clear every OJSSID this origin can reach — host-only and domain-scoped, at
  // both paths. See clearOjsSessionCookies: this was previously four
  // `response.cookies.set` calls, which Next collapsed to one because its
  // cookie map is keyed on name alone, so the host-only copy outlived every
  // sign-out and shadowed the next session.
  clearOjsSessionCookies(response, request)

  return response
}
