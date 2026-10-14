import { NextResponse } from 'next/server'
import { publicBaseUrl } from '@/lib/api'
import { databaseConfigured } from '@/lib/db'
import { canOpenOjsPage, ojsPageRequirement } from '@/lib/auth/ojs-access'
import { clearOjsSessionCookies, setOjsSessionCookie } from '@/lib/auth/ojs-cookie'
import { fetchOjsIdentity, wizardOpenTo } from '@/lib/auth/ojs-login'
import { PORTAL_SESSION_COOKIE, destroySession, readSession, touchSession } from '@/lib/auth/portal-session'
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
 *
 * A signed-in account is only forwarded to a page OJS will let it open. OJS
 * answers a Reader on the submission wizard or the author dashboard with a
 * redirect to its own "The current role does not have access to this
 * operation" page, and the portal registers new accounts as Readers because
 * the journals do not yet permit Author self-registration. Rather than let OJS
 * deliver that news in its own interface, the reader stays on the portal
 * dashboard, which says what has to happen (an editor grants the role). See
 * ojs-access.ts for the page-to-role table.
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
      // Confirm the OJS session behind this portal session on every hand-off,
      // not just when the cached roles say no. The portal cookie outlives an
      // OJS session that was ended inside OJS or timed out there, for up to
      // the revalidation window — and forwarding such a session is exactly
      // "signed in on the portal, login form in OJS". One profile fetch per
      // click is the price of never doing that; it also refreshes the roles,
      // so a role an editor granted a moment ago works on this very click.
      const userAgent = request.headers.get('user-agent')
      const fresh = await fetchOjsIdentity(session.ojsSid, userAgent)

      if (!fresh) {
        // Mirror getSession: drop the row, clear both cookies, and send them
        // to sign in with this hand-off as the return address, so one sign-in
        // lands them in OJS where they were going. Reporting this as a
        // missing role, which an earlier build did, sent a reader to ask an
        // editor for a role they did not need.
        await destroySession(token)
        const signIn = new URL('/sign-in', base)
        signIn.searchParams.set('next', `/api/auth/ojs-handoff?to=${encodeURIComponent(requested)}`)
        const again = NextResponse.redirect(signIn, { status: 302 })
        again.cookies.set({ name: PORTAL_SESSION_COOKIE, value: '', path: '/', maxAge: 0 })
        clearOjsSessionCookies(again, request) // must follow cookies.set, see ojs-cookie.ts
        return again
      }

      await touchSession(token, fresh, fresh.csrfToken ?? null)

      const requirement = ojsPageRequirement(target.pathname, ojsPath)
      if (!canOpenOjsPage(fresh.roles, requirement)) {
        let allowed = false

        // The wizard enrols a Reader as an author on first submission when
        // the journal permits Author self-registration — OJS's own rule, so
        // the portal must not be stricter than OJS. Rather than guess at the
        // setting, OJS is asked whether it would show this session the form.
        // Only after the roles have said no; a role-holder never pays for it.
        // `unknown` (the probe timed out, with the session itself just
        // confirmed) forwards: OJS is the better judge of its own page, and
        // a refusal on no evidence is what sent readers to the editor.
        if (!allowed && requirement?.selfEnrolable) {
          allowed = (await wizardOpenTo(requirement.journal, session.ojsSid, userAgent)) !== 'closed'
        }

        if (!allowed) {
          const explain = new URL('/dashboard', base)
          explain.searchParams.set('ojs', 'role-needed')
          explain.searchParams.set('needs', requirement!.needs)
          explain.searchParams.set('journal', requirement!.journal)
          return NextResponse.redirect(explain, { status: 302 })
        }
      }
      // OJS's own cookie attributes, shared with the sign-in route so the two
      // can never disagree and leave two OJSSIDs in the jar. Evicts the other
      // (domain, path) forms as it goes — a stale sibling is sent on the very
      // request this redirect triggers, and PHP keeps the first cookie in the
      // header, which the browser orders oldest-created first. See ojs-cookie.ts.
      setOjsSessionCookie(response, request, session.ojsSid)
    }
  } catch (error) {
    // The link must keep working even with the session store down; the worst
    // case is the OJS login form, which is where it went before this route.
    console.error('[ojs-handoff] session lookup failed:', error)
  }

  return response
}
