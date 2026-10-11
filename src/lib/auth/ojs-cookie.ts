import { OJS_SESSION_COOKIE } from './roles'
import { ojsPathPrefix } from '../ojs/config'

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
export function ojsSessionCookie(request: Request, value: string) {
  // Host only, no port: a Domain attribute carrying ":443" is silently
  // rejected, which would put us straight back to a host-only cookie.
  const host = (request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '')
    .split(',')[0]
    .trim()
    .split(':')[0]

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
