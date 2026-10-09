/**
 * OJS lives on the same origin as the portal, mounted at /ojs by nginx. That is
 * what makes session-based auth possible at all: the OJS session cookie is
 * scoped to /ojs/ and is sent automatically on same-origin API requests from
 * the browser, with no token handoff. See docs/OJS-INTEGRATION.md.
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
export const ojsDashboardUrl = (slug: string) => ojsUrl(slug, '/submissions')
export const ojsReviewUrl = (slug: string) => ojsUrl(slug, '/reviewer')

/** OJS REST API v1 endpoint for a journal context. */
export const ojsApiPath = (context: string, path: string) =>
  `${ojsPathPrefix}/index.php/${context}/api/v1${path.startsWith('/') ? path : `/${path}`}`

export const ojsApiUrl = (context: string, path: string) =>
  `${requireOjsBaseUrl()}/index.php/${context}/api/v1${path.startsWith('/') ? path : `/${path}`}`

export const oaiUrl = () => `${requireOjsBaseUrl()}/index.php/index/oai`
