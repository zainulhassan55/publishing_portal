/**
 * Where the browser should send a user who clicks through to OJS.
 *
 * In production OJS is mounted at /ojs on the portal's own origin, so a relative
 * prefix is correct. Set this to an absolute URL —
 * `https://www.nextgeniqpress.com/ojs` — to develop against the live instance
 * from localhost; every builder below composes onto it unchanged.
 *
 * This is presentation only. It does **not** carry auth: the portal reaches OJS
 * server to server (see `ojsApiUrl` and `requireOjsBaseUrl`) and issues its own
 * session cookie, so the OJS cookie never reaches the browser and the two
 * origins need not match. An earlier comment here claimed same-origin was what
 * made session auth possible; that described a cookie-adoption design that was
 * abandoned. See docs/OJS-INTEGRATION.md.
 */
export const ojsPathPrefix = process.env.NEXT_PUBLIC_OJS_PATH || '/ojs'

/**
 * Absolute base, used by server-side code (harvest, BFF proxy) which cannot
 * resolve a relative path. Defaults to the same-origin path so a misconfigured
 * environment fails loudly in one place rather than silently pointing at
 * localhost — audit finding F-02 was exactly that failure mode.
 */
export const ojsBaseUrl = (process.env.OJS_BASE_URL || '').replace(/\/$/, '')

export const requireOjsBaseUrl = () => {
  if (!ojsBaseUrl) {
    throw new Error(
      'OJS_BASE_URL is not set. Server-side OJS calls need an absolute base, e.g. https://www.nextgeniqpress.com/ojs',
    )
  }
  return ojsBaseUrl
}

/**
 * Admin-scoped API key, server-side only. Used for reads that are not on behalf
 * of a user (issue lists, published article metadata). Never expose this to the
 * browser; per-user actions use the reader's own session instead.
 */
export const ojsServiceApiKey = process.env.OJS_API_KEY || ''

/** Browser-safe URL builder for an OJS page (not the API). */
export const ojsUrl = (context: string, path = '') => `${ojsPathPrefix}/index.php/${context}${path}`

export const ojsLoginUrl = ojsUrl('index', '/login')

/**
 * The reader's own OJS profile, browser-relative. The one OJS page every
 * signed-in account can open regardless of journal enrolment, so it is the
 * last-resort target for "open the editorial system" when nothing better is
 * known. The absolute, server-side form is `ojsProfileUrl` below.
 */
export const ojsProfileUrlRelative = ojsUrl('index', '/user/profile')
export const ojsRegisterUrl = ojsUrl('index', '/user/register')
export const ojsLostPasswordUrl = ojsUrl('index', '/login/lostPassword')

/**
 * Routes a click through the session hand-off (/api/auth/ojs-handoff), so a
 * signed-in portal user lands in OJS already authenticated instead of at its
 * login form. Harmless when signed out: the route just redirects. Use for
 * links shown to signed-in users; public pages can keep linking directly.
 */
export const ojsHandoffUrl = (target: string) => `/api/auth/ojs-handoff?to=${encodeURIComponent(target)}`

export const ojsJournalUrl = (slug: string) => ojsUrl(slug)
export const ojsSubmitUrl = (slug: string) => ojsUrl(slug, '/submission/wizard')
export const ojsJournalRegisterUrl = (slug: string) => ojsUrl(slug, '/user/register')

/**
 * Author and reviewer workspaces.
 *
 * These paths are verified against the live OJS 3.5.0.5 install — an
 * unauthenticated GET must redirect to the journal login page, which is how a
 * real route is distinguished from a 404 here. Re-check them after an OJS
 * upgrade: 3.4 consolidated the old per-role pages into one dashboard and moved
 * both of these.
 *
 * In particular the reviewer workspace is **not** `/reviewer`. That was the
 * 3.1/3.2 route, it 404s on this install, and since every reviewer-facing
 * surface in the portal is a link-out, pointing at it sent reviewers to a dead
 * page with no other way through.
 */
export const ojsDashboardUrl = (slug: string) => ojsUrl(slug, '/dashboard/mySubmissions')
export const ojsReviewUrl = (slug: string) => ojsUrl(slug, '/dashboard/reviewAssignments')

/** Editorial queue, for editors and journal managers. */
export const ojsEditorialUrl = (slug: string) => ojsUrl(slug, '/dashboard/editorial')

/**
 * Absolute equivalents of the page URLs above, for server-side use.
 *
 * The relative builders exist for links the browser follows; these exist for
 * requests the portal makes on a user's behalf, which cannot resolve a relative
 * path. Kept distinct so a server-side call can never accidentally be issued
 * against the portal's own origin.
 */
export const ojsLoginPageUrl = () => `${requireOjsBaseUrl()}/index.php/index/login`
export const ojsSignInUrl = () => `${requireOjsBaseUrl()}/index.php/index/login/signIn`
export const ojsSignOutUrl = () => `${requireOjsBaseUrl()}/index.php/index/login/signOut`

/**
 * The site-level registration form, driven server-side by the registration
 * relay. Site level rather than per journal on purpose: this one form offers
 * every journal's enrolment checkboxes, so one submission can join a member
 * to as many as they choose.
 */
export const ojsRegisterPageUrl = () => `${requireOjsBaseUrl()}/index.php/index/user/register`

/**
 * The OJS profile page, used as the identity oracle.
 *
 * OJS 3.5 has no `/api/v1/users/me` — the route does not exist, which is what
 * the original session design was built on. This page is the substitute: it
 * redirects (302) for an unauthenticated session and renders a prefilled form
 * (200) for an authenticated one. See docs/OJS-INTEGRATION.md.
 *
 * With one exception: for an account that holds a role in exactly one journal
 * it redirects (302) to that journal's own profile page, which then renders.
 * The relay follows that one hop — see profileRedirectTarget in ojs-login.ts.
 */
export const ojsProfileUrl = () => `${requireOjsBaseUrl()}/index.php/index/user/profile`

/** OJS REST API v1 endpoint for a journal context. */
export const ojsApiPath = (context: string, path: string) =>
  `${ojsPathPrefix}/index.php/${context}/api/v1${path.startsWith('/') ? path : `/${path}`}`

export const ojsApiUrl = (context: string, path: string) =>
  `${requireOjsBaseUrl()}/index.php/${context}/api/v1${path.startsWith('/') ? path : `/${path}`}`

export const oaiUrl = () => `${requireOjsBaseUrl()}/index.php/index/oai`
