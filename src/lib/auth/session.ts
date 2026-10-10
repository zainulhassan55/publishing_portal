/**
 * Session model.
 *
 * OJS is the identity provider — it owns users, passwords and roles, and the
 * portal must not become a second account store. There is one account, it lives
 * in OJS, and every portal row that refers to a person stores `ojs_user_id`:
 * a reference, not a copy.
 *
 * ## How a session is resolved
 *
 * The portal issues its own cookie (`ngiq_session`) and keeps the OJS session
 * id server-side in `portal_sessions`. Resolving a request is therefore a
 * database lookup, not an outbound call — the previous design fired a request
 * to OJS on every page load for every signed-in reader.
 *
 * Two OJS facts forced this shape, both verified against the live instance:
 *
 *   - **There is no `/api/v1/users/me` in OJS 3.5.** The original design was
 *     built on it. So a cookie cannot be handed to OJS with "who is this";
 *     identity is read once at sign-in and cached.
 *   - **OJS scopes `OJSSID` to `path=/ojs/`**, so the browser never presents it
 *     to portal routes. Re-issuing a copy at `path=/` leaves two cookies of the
 *     same name whose precedence is browser-dependent.
 *
 * A consequence worth knowing: because the portal reaches OJS server to server,
 * the two do **not** need to share an origin. The integration can be developed
 * against the live OJS from localhost. See docs/LOCAL-DEV.md.
 *
 * ## Staleness
 *
 * A cached identity older than `REVALIDATE_AFTER_SECONDS` is re-checked against
 * OJS, which also refreshes roles — they change in OJS when someone accepts a
 * reviewer invitation, and the portal must not hold a stale view of anyone's
 * permissions. If OJS says the session is gone, the row is deleted and the
 * caller sees a signed-out visitor.
 *
 * Every failure path returns `{ user: null, reason }` rather than throwing. An
 * unauthenticated visitor is the normal case, and a misconfigured or unreachable
 * OJS must degrade to "signed out", never to a 500 on a public page.
 */

import { cookies, headers } from 'next/headers'
import { databaseConfigured } from '../db'
import { OJS_SESSION_COOKIE, ROLE_NAMES, hasRole, type Session, type SessionUser } from './roles'

// Re-exported so existing importers of this module keep working; the
// definitions live in ./roles, which imports nothing. See that file for why.
export { OJS_SESSION_COOKIE, ROLE_NAMES, hasRole }
export type { Session, SessionUser }

type OjsUserPayload = {
  id?: number
  userName?: string
  fullName?: string
  givenName?: Record<string, string> | string
  familyName?: Record<string, string> | string
  email?: string
  orcid?: string
  affiliation?: Record<string, string> | string
  roles?: { roleId?: number }[]
  groups?: { roleId?: number }[]
}

/** OJS returns many fields as { en: "value" } locale maps. */
const localised = (value: Record<string, string> | string | undefined): string | undefined => {
  if (!value) return undefined
  if (typeof value === 'string') return value
  return value.en ?? Object.values(value)[0]
}

/**
 * Normalises a user object from the OJS REST API.
 *
 * Used for `index/api/v1/users/{id}` reads, which carry locale maps and the
 * full profile. The sign-in path does not go through here — it parses the
 * `currentUser` blob instead; see `parseCurrentUser` in ojs-login.ts.
 */
export function normaliseOjsUser(payload: OjsUserPayload): SessionUser | null {
  if (!payload.id || !payload.email) return null

  const given = localised(payload.givenName)
  const family = localised(payload.familyName)
  const roleIds = [...(payload.roles ?? []), ...(payload.groups ?? [])]
    .map((r) => r.roleId)
    .filter((id): id is number => typeof id === 'number')

  return {
    id: payload.id,
    userName: payload.userName ?? payload.email,
    fullName: payload.fullName ?? [given, family].filter(Boolean).join(' ') ?? payload.email,
    givenName: given,
    familyName: family,
    email: payload.email,
    orcid: payload.orcid,
    affiliation: localised(payload.affiliation),
    roles: [...new Set(roleIds.map((id) => ROLE_NAMES[id]).filter(Boolean))],
  }
}

/**
 * Resolves the current user from the portal's own session cookie.
 *
 * Imports the session store and the OJS relay lazily. Both reach for
 * `mysql2` and `fetch`, and `getSession()` is called from statically generated
 * pages whose build must not drag a database driver into a path that will never
 * use one.
 */
export async function getSession(): Promise<Session> {
  const { PORTAL_SESSION_COOKIE } = await import('./portal-session')

  const store = await cookies()
  const token = store.get(PORTAL_SESSION_COOKIE)?.value

  if (!token) return { user: null, reason: 'no-session-cookie' }
  if (!databaseConfigured) return { user: null, reason: 'database-not-configured' }

  try {
    const { readSession, touchSession, destroySession } = await import('./portal-session')
    const session = await readSession(token)

    if (!session) return { user: null, reason: 'no-session' }
    if (!session.stale) return { user: session.user }

    // Past the revalidation threshold: confirm with OJS and refresh the cache.
    // The browser's agent rides along: OJS fingerprints the session by the
    // agent that created it (the browser's, relayed at sign-in) and would
    // reject this check under any other identity.
    const { fetchOjsIdentity } = await import('./ojs-login')
    const identity = await fetchOjsIdentity(session.ojsSid, (await headers()).get('user-agent'))

    if (!identity) {
      // OJS no longer recognises the session — signed out there, timed out, or
      // the account was disabled. Drop the row so the next request is cheap.
      await destroySession(token)
      return { user: null, reason: 'ojs-session-expired' }
    }

    await touchSession(token, identity, identity.csrfToken ?? null)
    return { user: identity }
  } catch (error) {
    // A database or network fault must not take a public page down.
    console.error('[session] resolution failed:', error)
    return { user: null, reason: 'session-unavailable' }
  }
}
