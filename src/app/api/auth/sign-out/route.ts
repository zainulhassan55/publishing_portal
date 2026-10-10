import { NextResponse } from 'next/server'
import { OJS_SESSION_COOKIE } from '@/lib/auth/session'
import { ojsBaseUrl } from '@/lib/ojs/config'

export const dynamic = 'force-dynamic'

/**
 * Clears the session cookie and asks OJS to end the session on its side too.
 * Both steps matter: dropping only the cookie would leave a live OJS session
 * that any other tab on /ojs could still use.
 *
 * The cookie is cleared at **two paths**. OJS issues it at `path=/ojs/`, while
 * the portal's previous sign-in route re-issued a copy at `path=/`. Clearing
 * only `/` left the real OJS cookie in place, so signing out of the portal left
 * the user signed in on /ojs — the opposite of what this endpoint promises.
 * Anyone carrying that split state gets it cleaned up on their next sign-out.
 */
export async function POST(request: Request) {
  const cookie = request.headers.get('cookie') ?? ''

  if (ojsBaseUrl && cookie.includes(`${OJS_SESSION_COOKIE}=`)) {
    try {
      await fetch(`${ojsBaseUrl}/index.php/index/login/signOut`, {
        headers: { Cookie: cookie },
        redirect: 'manual',
        cache: 'no-store',
      })
    } catch {
      // Best effort: the local cookie is cleared regardless.
    }
  }

  const url = new URL('/', request.url)
  const response = NextResponse.redirect(url, { status: 303 })

  for (const path of ['/', '/ojs/']) {
    response.cookies.set({ name: OJS_SESSION_COOKIE, value: '', path, maxAge: 0 })
  }

  return response
}
