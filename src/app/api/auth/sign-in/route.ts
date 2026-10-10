import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * In-portal sign-in — not implemented, and reports that honestly.
 *
 * OJS exposes no login API, so signing in from the portal means driving its web
 * login handler server-side. That is the one genuinely undocumented part of the
 * integration, and three separate things have to hold before it can work:
 *
 *   1. The relay itself: fetch the login page for a CSRF token and an anonymous
 *      session, POST the credentials carrying both, and take the rotated
 *      session id OJS issues on success.
 *   2. Identity resolution. There is no `/api/v1/users/me` in OJS 3.5, so the
 *      resulting session has to be confirmed against the OJS profile page.
 *   3. A portal-owned session store, because the OJS cookie is scoped
 *      `path=/ojs/` and cannot be read by portal routes — and re-issuing a copy
 *      at `path=/` (what this route used to do) leaves two cookies of the same
 *      name whose precedence is browser-dependent.
 *
 * The previous implementation did (1) and part of (3) and could never return
 * success: it set the cookie on its own response and then read the *request*
 * cookie store back to verify, which the browser had never populated.
 *
 * `npm run spike` check 3 is the gate for building the real thing. Until then
 * the sign-in page links out to OJS, which always works, and this route returns
 * 503 so the UI shows that fallback rather than a credential error that would
 * wrongly suggest the password was wrong.
 *
 * See docs/OJS-INTEGRATION.md.
 */
export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error: 'unavailable',
      message: 'Sign in through the journal system. Accounts are managed in OJS.',
    },
    { status: 503, headers: { 'Cache-Control': 'no-store' } },
  )
}
