// Explicit extensions: this module is reachable from a `node --test` entry
// point, whose ESM loader does not resolve extensionless paths. Same reason as
// ojs-login.ts.
import { OJS_SESSION_COOKIE } from './roles.ts'
import { ojsPathPrefix } from '../ojs/config.ts'

/** How long OJS keeps a session: `session_lifetime = 7` days in config.inc.php. */
const OJS_SESSION_MAX_AGE = 7 * 24 * 60 * 60

/**
 * Cookie attributes identical to the ones OJS sets on its own `OJSSID`.
 *
 * Verified against the live instance:
 *
 *   OJSSID=…; path=/ojs/; domain=www.nextgeniqpress.com; secure; httponly; samesite=lax
 *
 * `domain` is the attribute that matters and the one an earlier version of
 * this code omitted. A cookie sent without `Domain` is stored *host-only*, and
 * browsers key the cookie jar on (name, domain, host-only flag, path) — so a
 * host-only `OJSSID` and OJS's own domain-scoped `OJSSID` are two distinct
 * entries that coexist. Both match a request to /ojs/, both are sent, and PHP
 * keeps whichever appears last in the header. The result is a browser holding
 * a perfectly good portal-issued session behind a stale one OJS planted
 * earlier, and a reader who is signed in on the portal yet sees the OJS login
 * form. Matching OJS exactly means there is only ever one OJSSID: ours
 * overwrites OJS's in place rather than sitting beside it.
 *
 * This is the same class of bug the portal-owned session design was built to
 * avoid (see portal-session.ts) — reintroduced by an attribute, not by a path.
 */
/**
 * Host only, no port: a Domain attribute carrying ":443" is silently rejected,
 * which would put us straight back to a host-only cookie.
 */
const requestHost = (request: Request) =>
  (request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '')
    .split(',')[0]
    .trim()
    .split(':')[0]

export function ojsSessionCookie(request: Request, value: string) {
  const host = requestHost(request)

  return {
    name: OJS_SESSION_COOKIE,
    value,
    path: `${ojsPathPrefix}/`,
    // Omitted for localhost, where a Domain attribute buys nothing and some
    // browsers reject it outright.
    ...(host && host !== 'localhost' ? { domain: host } : {}),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: OJS_SESSION_MAX_AGE,
  }
}

/** True when OJS shares this origin, so a cookie for it can be set at all. */
export const ojsIsSameOrigin = ojsPathPrefix.startsWith('/')

/**
 * Every `(domain, path)` form of OJSSID this origin can reach.
 *
 * A browser keys its jar on (name, domain, host-only flag, path), so this one
 * name can occupy four entries: host-only and domain-scoped, at `${prefix}/`
 * and at the `/` the abandoned cookie-adoption design left behind. All four
 * match a request to `${prefix}/`, all four are sent on it, and PHP keeps
 * whichever arrives last — so a single stale copy is enough to shadow a good
 * session and drop the reader on the OJS login form.
 */
const sessionCookieForms = (request: Request) => {
  const host = requestHost(request)
  const domains = host && host !== 'localhost' ? [undefined, host] : [undefined]
  return domains.flatMap((domain) => ['/', `${ojsPathPrefix}/`].map((path) => ({ domain, path })))
}

/**
 * `Set-Cookie` serialiser, used instead of `response.cookies.set` wherever more
 * than one form of the same name has to be emitted.
 *
 * Next's `ResponseCookies` keys its map on the cookie *name* alone and rewrites
 * the whole header from that map on every `set`, so N calls for one name
 * collapse to the last one — silently. That defeated the eviction this module
 * exists to perform: four clears went in, one came out, and the host-only copy
 * survived every sign-out. Appending the header directly is the only way to put
 * two entries of the same name on one response.
 *
 * ORDERING, and the reason both exported helpers must be called last on a
 * response: that same rewrite does `headers.delete('set-cookie')` first, so a
 * `response.cookies.set` *after* an append discards every appended cookie —
 * including all of these. `response.cookies.set` for the portal session, then
 * these helpers, is the only safe order. Locked in by ojs-cookie.test.ts.
 */
const serialize = (parts: {
  value: string
  path: string
  domain?: string
  maxAge: number
}) =>
  [
    `${OJS_SESSION_COOKIE}=${encodeURIComponent(parts.value)}`,
    `Path=${parts.path}`,
    parts.domain ? `Domain=${parts.domain}` : '',
    `Max-Age=${parts.maxAge}`,
    process.env.NODE_ENV === 'production' ? 'Secure' : '',
    'HttpOnly',
    'SameSite=Lax',
  ]
    .filter(Boolean)
    .join('; ')

/**
 * Installs `value` as the one live OJSSID, evicting every other form first.
 *
 * Setting the authoritative cookie alone is not enough: it overwrites its own
 * jar entry and leaves any stale sibling untouched, which is precisely the
 * "signed in on the portal, login form in OJS" bug — and why clearing cookie
 * data by hand appeared to fix it. Each sign-in and hand-off now clears the
 * siblings so a fresh session cannot be shadowed by an old one.
 */
export function setOjsSessionCookie(response: { headers: Headers }, request: Request, value: string) {
  const authoritative = ojsSessionCookie(request, value)

  for (const form of sessionCookieForms(request)) {
    if (form.path === authoritative.path && form.domain === authoritative.domain) continue
    response.headers.append('set-cookie', serialize({ ...form, value: '', maxAge: 0 }))
  }

  response.headers.append(
    'set-cookie',
    serialize({
      value,
      path: authoritative.path,
      domain: authoritative.domain,
      maxAge: OJS_SESSION_MAX_AGE,
    }),
  )
}

/** Clears every form of OJSSID. Used by sign-out; harmless where absent. */
export function clearOjsSessionCookies(response: { headers: Headers }, request: Request) {
  for (const form of sessionCookieForms(request)) {
    response.headers.append('set-cookie', serialize({ ...form, value: '', maxAge: 0 }))
  }
}
