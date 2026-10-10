import { NextResponse } from 'next/server'
import { databaseConfigured } from '@/lib/db'
import { OJS_SESSION_COOKIE } from '@/lib/auth/roles'
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
      if (session) await postSignOut(session.ojsSid)
      await destroySession(token)
    } catch (error) {
      console.error('[sign-out] cleanup failed, clearing cookies anyway:', error)
    }
  }

  const response = NextResponse.redirect(new URL('/', request.url), { status: 303 })

  response.cookies.set({ name: PORTAL_SESSION_COOKIE, value: '', path: '/', maxAge: 0 })

  // Clears the stray OJSSID copies the previous cookie-adoption design left at
  // `path=/`, and anything scoped to `/ojs/` that this origin can see. Harmless
  // when absent, and it means anyone carrying that old split state gets it
  // cleaned up on their next sign-out rather than keeping a half-session
  // indefinitely.
  for (const path of ['/', '/ojs/']) {
    response.cookies.set({ name: OJS_SESSION_COOKIE, value: '', path, maxAge: 0 })
  }

  return response
}
