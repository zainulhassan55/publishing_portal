/**
 * Portal-owned session store.
 *
 * A **session** store, not an account store — the distinction matters and is
 * the rule the whole integration is built on. OJS owns every user, password and
 * role. A row here maps a cookie the portal issued to an `ojs_user_id` and the
 * OJS session behind it, and holds nothing OJS does not already know.
 *
 * Why it exists rather than reusing the OJS cookie directly:
 *
 *   - OJS 3.5 has no `/api/v1/users/me`, so there is no way to ask OJS "who is
 *     this cookie". Identity is read once at sign-in and cached here.
 *   - OJS scopes `OJSSID` to `path=/ojs/`, so the browser never presents it to
 *     portal routes. Copying it to `path=/` would leave two cookies of the same
 *     name whose precedence is browser-dependent — intermittent session mixing.
 *   - Holding the OJS session id server-side keeps it out of the browser
 *     entirely, and makes expiry a server-side fact rather than a hope.
 *
 * See docs/OJS-INTEGRATION.md and migrations/002_portal_sessions.sql.
 */

import { createHash } from 'node:crypto'
import { execute, insert, query } from '../db'
import { tokenUrlSafe } from '../api'
import type { SessionUser } from './session'

/** The portal's own session cookie. Nothing to do with OJSSID. */
export const PORTAL_SESSION_COOKIE = 'ngiq_session'

/**
 * Matches the 7-day `Max-Age` OJS issues on its own cookie, so the portal
 * session cannot outlive the OJS session it is backed by.
 */
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60

/**
 * How long a cached identity is trusted before being re-checked against OJS.
 *
 * The trade-off: too short and every page load becomes an outbound request,
 * which is what the previous design did and why a signed-in reader cost one OJS
 * round trip per page. Too long and a session revoked in OJS keeps working
 * here. Fifteen minutes is short enough that a sign-out or disable in OJS takes
 * effect promptly, and long enough that normal browsing hits the database only.
 */
export const REVALIDATE_AFTER_SECONDS = 15 * 60

export type PortalSession = {
  user: SessionUser
  /** The OJS session id this is backed by. Server-side only, never sent to a browser. */
  ojsSid: string
  /** OJS's CSRF token for that session; required on mutating OJS API calls. */
  ojsCsrfToken: string | null
  /** True when the cached identity is older than the revalidation threshold. */
  stale: boolean
}

/**
 * Tokens are stored as a SHA-256 hex digest, never in the clear.
 *
 * A session token is a bearer credential: whoever holds it is signed in. If the
 * table were read — a backup left readable, a SQL injection elsewhere, an
 * over-broad grant — plaintext tokens would hand over live sessions. Hashing
 * makes a read useless, and costs one hash per request.
 */
const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex')

type SessionRow = {
  ojs_user_id: number
  ojs_sid: string
  user_name: string
  full_name: string | null
  email: string | null
  roles: string | string[] | null
  ojs_csrf_token: string | null
  last_seen_at: Date
}

const parseRoles = (value: SessionRow['roles']): string[] => {
  if (!value) return []
  if (Array.isArray(value)) return value
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Creates a session and returns the token to put in the cookie.
 *
 * The token is returned exactly once and never recoverable afterwards, which is
 * the point of storing only its hash.
 */
export async function createSession(args: {
  user: SessionUser
  ojsSid: string
  ojsCsrfToken?: string | null
}): Promise<{ token: string; expiresAt: Date }> {
  const token = tokenUrlSafe()
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000)

  await insert(
    `INSERT INTO portal_sessions
       (token_hash, ojs_user_id, ojs_sid, user_name, full_name, email, roles, ojs_csrf_token, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      hashToken(token),
      args.user.id,
      args.ojsSid,
      args.user.userName,
      args.user.fullName || null,
      args.user.email || null,
      JSON.stringify(args.user.roles ?? []),
      args.ojsCsrfToken ?? null,
      expiresAt,
    ],
  )

  return { token, expiresAt }
}

/**
 * Looks up a session by its cookie token.
 *
 * Expiry is enforced in the `WHERE` clause rather than checked afterwards, so
 * an expired row can never be read as valid even if the purge has not run.
 */
export async function readSession(token: string): Promise<PortalSession | null> {
  if (!token) return null

  const [row] = await query<SessionRow>(
    `SELECT ojs_user_id, ojs_sid, user_name, full_name, email, roles, ojs_csrf_token, last_seen_at
       FROM portal_sessions
      WHERE token_hash = ? AND expires_at > NOW()`,
    [hashToken(token)],
  )

  if (!row) return null

  const ageSeconds = (Date.now() - new Date(row.last_seen_at).getTime()) / 1000

  return {
    user: {
      id: row.ojs_user_id,
      userName: row.user_name,
      fullName: row.full_name ?? row.user_name,
      email: row.email ?? '',
      roles: parseRoles(row.roles),
    },
    ojsSid: row.ojs_sid,
    ojsCsrfToken: row.ojs_csrf_token,
    stale: ageSeconds > REVALIDATE_AFTER_SECONDS,
  }
}

/**
 * Marks a session as freshly validated, refreshing the cached identity.
 *
 * Roles and name are re-read from OJS on revalidation because they can change
 * there — a reviewer invitation adds a role — and the portal must not hold a
 * stale view of someone's permissions.
 */
export async function touchSession(token: string, user?: SessionUser, ojsCsrfToken?: string | null): Promise<void> {
  if (user) {
    await execute(
      `UPDATE portal_sessions
          SET last_seen_at = NOW(), user_name = ?, full_name = ?, email = ?, roles = ?, ojs_csrf_token = ?
        WHERE token_hash = ?`,
      [
        user.userName,
        user.fullName || null,
        user.email || null,
        JSON.stringify(user.roles ?? []),
        ojsCsrfToken ?? null,
        hashToken(token),
      ],
    )
    return
  }

  await execute('UPDATE portal_sessions SET last_seen_at = NOW() WHERE token_hash = ?', [hashToken(token)])
}

export async function destroySession(token: string): Promise<void> {
  if (!token) return
  await execute('DELETE FROM portal_sessions WHERE token_hash = ?', [hashToken(token)])
}

/** Sign out everywhere, for a password change or a disabled account. */
export async function destroyUserSessions(ojsUserId: number): Promise<number> {
  return execute('DELETE FROM portal_sessions WHERE ojs_user_id = ?', [ojsUserId])
}

/**
 * Deletes expired rows.
 *
 * Worth running on a schedule rather than leaving to chance: each row holds a
 * live OJS session id, so an unpurged table is a growing pile of credentials at
 * rest for sessions nobody is using.
 */
export async function purgeExpired(): Promise<number> {
  return execute('DELETE FROM portal_sessions WHERE expires_at <= NOW()')
}
