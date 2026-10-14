import { NextResponse } from 'next/server'
import { publicBaseUrl } from '@/lib/api'
import { databaseConfigured } from '@/lib/db'
import { canOpenOjsPage, ojsPageRequirement } from '@/lib/auth/ojs-access'
import { setOjsSessionCookie } from '@/lib/auth/ojs-cookie'
import { fetchOjsIdentity } from '@/lib/auth/ojs-login'
import { authorSelfRegistrationOffered } from '@/lib/auth/ojs-register'
import { journals } from '@/data/registry'
import { PORTAL_SESSION_COOKIE, readSession, touchSession } from '@/lib/auth/portal-session'
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
      const requirement = ojsPageRequirement(target.pathname, ojsPath)
      if (!canOpenOjsPage(session.user.roles, requirement)) {
        // The cached roles may be minutes old, and the one thing that fixes a
        // refusal is an editor granting a role in OJS. Ask OJS before saying
        // no, so a role granted a moment ago works on the very next click
        // rather than after the session's next scheduled revalidation.
        const userAgent = request.headers.get('user-agent')
        const fresh = await fetchOjsIdentity(session.ojsSid, userAgent)
        if (fresh) await touchSession(token, fresh, fresh.csrfToken ?? null)

        let allowed = Boolean(fresh && canOpenOjsPage(fresh.roles, requirement))

        // The wizard enrols a Reader as an author on first submission when
        // the journal permits Author self-registration — OJS's own rule, so
        // the portal must not be stricter than OJS here. Asked only after the
        // roles have said no; a role-holder never pays for this lookup.
        if (!allowed && requirement?.selfEnrolable) {
          const name = journals.find((j) => j.slug === requirement.journal)?.title
          if (name && (await authorSelfRegistrationOffered(name, userAgent)) === true) allowed = true
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
