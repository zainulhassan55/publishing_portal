/**
 * CSRF protection for the admin panel's mutating routes.
 *
 * The portal session cookie is `SameSite=Lax`, which already stops a
 * cross-site form POST. It is not sufficient on its own for routes that hide a
 * journal or hold a paper back: `Lax` is a browser behaviour, it has had
 * implementation differences, and "the cookie policy probably covers it" is not
 * the argument you want to be making about the endpoint that unpublishes
 * articles.
 *
 * ## How the token works
 *
 * It is **derived** from the session token rather than stored:
 *
 *     csrf = sha256(sessionToken + ':' + PURPOSE)
 *
 * The session token is `httpOnly`, so script on another origin cannot read it;
 * the derived token is rendered into the admin page, which another origin
 * cannot read either (no CORS grant). An attacker can make the browser send the
 * session *cookie* — that is what CSRF is — but cannot produce the header value
 * that matches it. Verification recomputes the digest from the cookie it was
 * sent with and compares.
 *
 * Derivation rather than a second cookie or a server-side table is deliberate:
 *
 *   - nothing to store, nothing to expire, nothing to purge
 *   - it is automatically invalidated when the session ends, because it is a
 *     function of the session token
 *   - it cannot drift out of sync with the session, which a separate cookie can
 *
 * The comparison is constant-time. A fast-fail compare on a value derived from
 * a secret leaks that secret a byte at a time to anyone willing to measure, and
 * `timingSafeEqual` costs nothing here.
 */

import { createHash, timingSafeEqual } from 'node:crypto'

/** Domain separation, so this digest can never be mistaken for the session hash. */
const PURPOSE = 'ngiq-admin-csrf-v1'

export const CSRF_HEADER = 'x-ngiq-csrf'

export const csrfTokenFor = (sessionToken: string): string =>
  createHash('sha256').update(`${sessionToken}:${PURPOSE}`).digest('hex')

/**
 * Compares two hex digests without leaking where they first differ.
 *
 * `timingSafeEqual` throws on a length mismatch rather than returning false, so
 * the length is checked first — a caller sending a truncated token must get
 * `false`, not a 500.
 */
export function csrfTokenMatches(expected: string, presented: string | null | undefined): boolean {
  if (!presented || presented.length !== expected.length) return false

  try {
    return timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(presented, 'utf8'))
  } catch {
    return false
  }
}

/**
 * Same-origin check on the `Origin` header, as a second independent barrier.
 *
 * Browsers set `Origin` on every cross-origin request and on same-origin
 * mutations, and script cannot forge it. A request with no `Origin` at all is
 * accepted: that is a same-origin navigation or a server-to-server caller, and
 * rejecting it would break `curl` against the API for no security gain — the
 * token check is what actually stops the attack, and this only narrows it
 * further.
 */
export function originAllowed(request: Request, siteUrl: string | undefined): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return true

  if (!siteUrl) {
    // No configured origin to compare against. Fall back to the request's own
    // host rather than trusting anything that shows up.
    try {
      return new URL(origin).host === new URL(request.url).host
    } catch {
      return false
    }
  }

  try {
    return new URL(origin).origin === new URL(siteUrl).origin
  } catch {
    return false
  }
}
