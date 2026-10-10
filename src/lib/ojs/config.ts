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
export const ojsRegisterUrl = ojsUrl('index', '/user/register')
export const ojsLostPasswordUrl = ojsUrl('index', '/login/lostPassword')

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
 * The OJS submission wizard for one existing submission.
 *
 * Verified to resolve: `/{journal}/submission/wizard/{id}` → 302 to login when
 * signed out. This is what makes the metadata-first handoff worthwhile — the
 * author lands on *their* submission to attach files, rather than on a blank
 * wizard with everything to retype.
 */
export const ojsSubmissionUrl = (slug: string, submissionId: number) =>
  ojsUrl(slug, `/submission/wizard/${submissionId}`)

/**
 * OJS section id per journal, required when creating a submission.
 *
 * This is a configured map rather than a lookup because OJS will not tell us:
 * `GET /{journal}/api/v1/sections` answers `roleBasedAccessDenied` for an
 * author, and the portal creates submissions with the author's own session.
 * A journal-manager-scoped service key could read it, but the current key is
 * scoped to one journal, so there is nothing to read it with.
 *
 * Deliberately NOT guessed. Section ids look sequential across journals, but
 * filing a manuscript into the wrong section is an editorial mistake that
 * surfaces late and confuses the editor rather than the author. A journal
 * absent from this map falls back to the plain hand-off, which is the previous
 * behaviour and costs the author a retype — annoying, never wrong.
 *
 * To add a journal: ask the OJS admin for the section id (Journal Settings →
 * Sections, it is in the edit URL), or grant the service key Journal Manager
 * there and read `/sections`. Then add it here.
 *
 * `ijdh: 1` is verified — a submission was created in it and came back with
 * `sectionId: 1`.
 */
const SECTION_IDS: Record<string, number> = {
  ijdh: 1,
}

export const ojsSectionId = (slug: string): number | null => SECTION_IDS[slug] ?? null

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
 * The OJS profile page, used as the identity oracle.
 *
 * OJS 3.5 has no `/api/v1/users/me` — the route does not exist, which is what
 * the original session design was built on. This page is the substitute: it
 * redirects (302) for an unauthenticated session and renders a prefilled form
 * (200) for an authenticated one. See docs/OJS-INTEGRATION.md.
 */
export const ojsProfileUrl = () => `${requireOjsBaseUrl()}/index.php/index/user/profile`

/** OJS REST API v1 endpoint for a journal context. */
export const ojsApiPath = (context: string, path: string) =>
  `${ojsPathPrefix}/index.php/${context}/api/v1${path.startsWith('/') ? path : `/${path}`}`

export const ojsApiUrl = (context: string, path: string) =>
  `${requireOjsBaseUrl()}/index.php/${context}/api/v1${path.startsWith('/') ? path : `/${path}`}`

export const oaiUrl = () => `${requireOjsBaseUrl()}/index.php/index/oai`
