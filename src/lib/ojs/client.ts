/**
 * The one place the portal calls the OJS REST API.
 *
 * Two auth modes, and the difference matters:
 *
 *   - `service` — the admin-scoped `OJS_API_KEY`, for reads that are nobody's
 *     in particular: published articles, issue lists, the harvest.
 *   - `{ sid, csrfToken }` — a user's own OJS session, taken from
 *     `portal_sessions`. Everything done *on behalf of* an author goes this
 *     way, so OJS applies that author's permissions rather than an
 *     administrator's. A service key creating submissions would make every
 *     paper look like it came from the admin account.
 *
 * `X-Csrf-Token` is mandatory on anything mutating. Without it OJS answers 403
 * with "The form could not be submitted. You may have been logged out." — which
 * reads like an expired session and sent an earlier debugging pass down the
 * wrong path entirely. The token comes from the `currentUser` blob captured at
 * sign-in; see src/lib/auth/ojs-login.ts.
 *
 * Never throws. Every caller has a sensible degraded path — usually handing the
 * author off to OJS — and an exception here would turn that into a 500.
 */

import { ojsApiUrl, ojsBaseUrl, ojsServiceApiKey } from './config'
import { OJS_SESSION_COOKIE } from '../auth/roles'

export type OjsAuth = 'service' | { sid: string; csrfToken?: string | null }

export type OjsResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: string; body?: string }

const TIMEOUT_MS = 20_000

export async function ojsFetch<T = unknown>(
  context: string,
  path: string,
  options: {
    auth: OjsAuth
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    body?: unknown
  },
): Promise<OjsResult<T>> {
  if (!ojsBaseUrl) return { ok: false, status: 0, error: 'ojs-not-configured' }

  const method = options.method ?? 'GET'
  const headers: Record<string, string> = { Accept: 'application/json' }

  if (options.auth === 'service') {
    if (!ojsServiceApiKey) return { ok: false, status: 0, error: 'no-service-key' }
    headers.Authorization = `Bearer ${ojsServiceApiKey}`
  } else {
    headers.Cookie = `${OJS_SESSION_COOKIE}=${options.auth.sid}`
    if (options.auth.csrfToken) headers['X-Csrf-Token'] = options.auth.csrfToken
  }

  if (options.body !== undefined) headers['Content-Type'] = 'application/json'

  let response: Response
  try {
    response = await fetch(ojsApiUrl(context, path), {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    return { ok: false, status: 0, error: error instanceof Error ? error.message : 'ojs-unreachable' }
  }

  const text = await response.text()

  if (!response.ok) {
    // OJS puts a machine-readable key in `error` and prose in `errorMessage`.
    // The key is what callers branch on; the prose is worth logging because it
    // is often the only thing that explains a 400.
    let error = `ojs-${response.status}`
    try {
      const parsed = JSON.parse(text) as { error?: string; errorMessage?: string }
      if (parsed.error) error = parsed.error
    } catch {
      /* keep the status-derived code */
    }
    return { ok: false, status: response.status, error, body: text.slice(0, 500) }
  }

  if (!text) return { ok: true, status: response.status, data: undefined as T }

  try {
    return { ok: true, status: response.status, data: JSON.parse(text) as T }
  } catch {
    return { ok: false, status: response.status, error: 'unparsable-response', body: text.slice(0, 500) }
  }
}

/** OJS stores most text as `{ en: value }` locale maps. */
export const localeValue = <T>(value: T, locale = 'en'): Record<string, T> => ({ [locale]: value })
