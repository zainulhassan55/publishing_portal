/**
 * The admin panel's door.
 *
 * One module so there is exactly one answer to "may this request be here", used
 * by both the pages and the API routes. The portal's existing role checks are
 * in `Header.tsx` and `DashboardPage.tsx` and both only show and hide UI; this
 * panel must not follow that pattern, because a hidden control is not an absent
 * permission and `/admin/journals` is reachable by typing it.
 *
 * ## Why a non-admin gets notFound() and not a 403
 *
 * A 403 confirms the page exists. For a reader who should not know the admin
 * panel is there, "no such page" is both true from their point of view and the
 * answer that tells them least. The API routes answer 403 instead — a client
 * that is *supposed* to be admin needs to tell a permission failure apart from
 * a typo, and by then the caller has already proved they know the route.
 *
 * ## Why there is no separate admin sign-in
 *
 * A second credential path is a second thing to phish, a second session model to
 * get wrong, and a second place for a password policy to drift. OJS is the
 * identity provider and the portal already has a session; `/admin` is a
 * permission on that session, not a different door.
 */

import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { NextResponse } from 'next/server'
import { getSession } from '../auth/session'
import { isSiteAdmin } from '../auth/access'
import { PORTAL_SESSION_COOKIE } from '../auth/portal-session'
import { CSRF_HEADER, csrfTokenFor, csrfTokenMatches, originAllowed } from '../auth/csrf'
import type { SessionUser } from '../auth/session'

export type AdminContext = {
  user: SessionUser
  /** Derived from the session token; rendered into the page for mutating calls. */
  csrfToken: string
}

/**
 * Page guard. Renders a 404 for anyone who is not a site administrator.
 *
 * Server-side by construction: this runs during the render, so an unauthorised
 * reader never receives the page at all rather than receiving it and being
 * asked nicely not to look.
 */
export async function requireAdminPage(): Promise<AdminContext> {
  const session = await getSession()
  if (!session.user || !isSiteAdmin(session.user.roles)) notFound()

  const token = (await cookies()).get(PORTAL_SESSION_COOKIE)?.value
  // Unreachable in practice — getSession resolved from this cookie — but typed
  // honestly rather than asserted away.
  if (!token) notFound()

  return { user: session.user, csrfToken: csrfTokenFor(token) }
}

export type AdminApiResult = { ok: true; context: AdminContext } | { ok: false; response: NextResponse }

const deny = (error: string, status: number, message: string) =>
  NextResponse.json({ ok: false, error, message }, { status, headers: { 'Cache-Control': 'no-store' } })

/**
 * API guard.
 *
 * `mutating: true` additionally requires the CSRF token and a same-origin
 * `Origin`. Read routes skip both: there is nothing to forge a read into, and
 * demanding a token on a GET only means the first `curl` against the API looks
 * broken.
 */
export async function requireAdminApi(
  request: Request,
  options: { mutating?: boolean } = {},
): Promise<AdminApiResult> {
  const session = await getSession()

  if (!session.user) {
    return { ok: false, response: deny('unauthenticated', 401, 'Sign in to continue.') }
  }

  if (!isSiteAdmin(session.user.roles)) {
    // Logged: someone reaching an admin route without the role is either a
    // stale client or a probe, and both are worth being able to see later.
    console.warn(
      `[admin] refused ${request.method} ${new URL(request.url).pathname} for user ${session.user.id} with roles ${JSON.stringify(session.user.roles)}`,
    )
    return { ok: false, response: deny('forbidden', 403, 'This area is restricted to site administrators.') }
  }

  const token = (await cookies()).get(PORTAL_SESSION_COOKIE)?.value
  if (!token) {
    return { ok: false, response: deny('unauthenticated', 401, 'Sign in to continue.') }
  }

  const csrfToken = csrfTokenFor(token)

  if (options.mutating) {
    if (!originAllowed(request, process.env.NEXT_PUBLIC_SITE_URL)) {
      console.warn(`[admin] rejected cross-origin mutation from ${request.headers.get('origin')}`)
      return { ok: false, response: deny('bad-origin', 403, 'Request rejected.') }
    }

    if (!csrfTokenMatches(csrfToken, request.headers.get(CSRF_HEADER))) {
      // Most often a page left open across a sign-out and back in, which gives
      // a new session token and so a new derived CSRF token. Reloading fixes it,
      // and saying so beats a bare 403.
      return {
        ok: false,
        response: deny('bad-csrf', 403, 'This page has expired. Reload it and try again.'),
      }
    }
  }

  return { ok: true, context: { user: session.user, csrfToken } }
}
