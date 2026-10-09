import { NextResponse } from 'next/server'
import { OJS_SESSION_COOKIE } from '@/lib/auth/session'
import { ojsBaseUrl } from '@/lib/ojs/config'

export const dynamic = 'force-dynamic'

/**
 * Clears the portal's copy of the session cookie and asks OJS to end the
 * session on its side too. Both steps matter: dropping only the cookie would
 * leave a live OJS session that any other tab on /ojs could still use.
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
  response.cookies.set({ name: OJS_SESSION_COOKIE, value: '', path: '/', maxAge: 0 })
  return response
}
