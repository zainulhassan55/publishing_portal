import mysql from 'mysql2/promise'
import { ROLE_NAMES } from '@/lib/auth/roles'
import { portalSlug } from './contexts'
import { roleFromAssignments, type SubmissionRole } from './submission-role'

/**
 * Read-only lookups in the OJS database — roles, and nothing else.
 *
 * The portal otherwise talks to OJS only through its API, and the rule in
 * docs/ARCHITECTURE.md §2 still holds for everything except this file. The
 * exception exists because the API cannot answer "what is this person on this
 * paper, and in which journals do they work" without one or two requests per
 * paper, and cannot see review invitations at all until they are accepted.
 * Six tables answer all of it in three small queries.
 *
 * What keeps this safe:
 *
 *   - **It never decides what anyone sees.** The submission list still comes
 *     from the OJS API with the person's own session, so OJS keeps enforcing
 *     who may read which paper. This file only labels rows OJS already returned
 *     and says which journals' workspaces to link to.
 *   - **It cannot write.** The database user is granted SELECT on exactly the
 *     tables below and nothing else; see docs/OPERATIONS.md for the grant.
 *   - **It fails soft.** Not configured, unreachable, or a column renamed by an
 *     OJS upgrade: `ojsRolesFor` returns null and the caller falls back to the
 *     API. A broken lookup costs speed, never correctness.
 *
 * Every query is keyed on the OJS user id, which the portal session holds
 * because OJS is the identity provider.
 */

let pool: mysql.Pool | null = null

export const ojsDatabaseConfigured = Boolean(process.env.OJS_DATABASE_URL)

function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      uri: process.env.OJS_DATABASE_URL,
      waitForConnections: true,
      // Three queries per dashboard load; it does not need the portal's eight.
      connectionLimit: 3,
      queueLimit: 0,
      timezone: 'Z',
    })
  }
  return pool
}

async function select<T>(sql: string, params: (string | number)[]): Promise<T[]> {
  const [rows] = await getPool().execute(sql, params)
  return rows as T[]
}

// `date_end` is OJS 3.5's way of ending a role without deleting the row (it
// keeps the masthead history). An ended role is not a role.
const MEMBERSHIPS_SQL = `SELECT j.path, ug.role_id
   FROM user_user_groups uug
   JOIN user_groups ug ON ug.user_group_id = uug.user_group_id
   JOIN journals j ON j.journal_id = ug.context_id
  WHERE uug.user_id = ?
    AND (uug.date_end IS NULL OR uug.date_end > NOW())`

const STAGE_SQL = `SELECT j.path, sa.submission_id, ug.role_id
   FROM stage_assignments sa
   JOIN user_groups ug ON ug.user_group_id = sa.user_group_id
   JOIN submissions s ON s.submission_id = sa.submission_id
   JOIN journals j ON j.journal_id = s.context_id
  WHERE sa.user_id = ?`

const REVIEWS_SQL = `SELECT j.path, ra.submission_id, ra.date_confirmed
   FROM review_assignments ra
   JOIN submissions s ON s.submission_id = ra.submission_id
   JOIN journals j ON j.journal_id = s.context_id
  WHERE ra.reviewer_id = ?
    AND ra.declined = 0
    AND ra.cancelled = 0`

export type OjsRoleSnapshot = {
  /** Role names the person currently holds, per journal slug. */
  journals: Record<string, string[]>
  /** Their role on each paper, keyed `${slug}:${ojsSubmissionId}`. */
  submissions: Record<string, SubmissionRole>
  /** Review invitations not yet accepted or declined, per journal slug. */
  pendingReviews: Record<string, number>
}

export const submissionKey = (slug: string, submissionId: number) => `${slug}:${submissionId}`

export async function ojsRolesFor(userId: number): Promise<OjsRoleSnapshot | null> {
  if (!ojsDatabaseConfigured) return null

  try {
    const [memberships, stageRows, reviewRows] = await Promise.all([
      select<{ path: string; role_id: number }>(MEMBERSHIPS_SQL, [userId]),
      select<{ path: string; submission_id: number; role_id: number }>(STAGE_SQL, [userId]),
      select<{ path: string; submission_id: number; date_confirmed: Date | null }>(REVIEWS_SQL, [userId]),
    ])

    const journals: Record<string, string[]> = {}
    for (const row of memberships) {
      const slug = portalSlug(row.path)
      const role = ROLE_NAMES[row.role_id]
      if (!role) continue
      journals[slug] = [...new Set([...(journals[slug] ?? []), role])]
    }

    const stageRoles = new Map<string, number[]>()
    for (const row of stageRows) {
      const key = submissionKey(portalSlug(row.path), row.submission_id)
      stageRoles.set(key, [...(stageRoles.get(key) ?? []), row.role_id])
    }

    const reviewing = new Set<string>()
    const pendingReviews: Record<string, number> = {}
    for (const row of reviewRows) {
      const slug = portalSlug(row.path)
      reviewing.add(submissionKey(slug, row.submission_id))
      if (!row.date_confirmed) pendingReviews[slug] = (pendingReviews[slug] ?? 0) + 1
    }

    const submissions: Record<string, SubmissionRole> = {}
    for (const key of new Set([...stageRoles.keys(), ...reviewing])) {
      const role = roleFromAssignments(stageRoles.get(key) ?? [], reviewing.has(key))
      if (role) submissions[key] = role
    }

    return { journals, submissions, pendingReviews }
  } catch (error) {
    // Logged because a failure here after an OJS upgrade is exactly how a
    // schema change would first show itself, and the fallback hides it.
    console.warn(`[ojs-db] role lookup failed, falling back to the API: ${error instanceof Error ? error.message : error}`)
    return null
  }
}

/**
 * For /api/health: runs the three lookups for a user id that cannot exist, so
 * it reads no rows but proves the grant covers every table and every column
 * still has the name the queries use. An OJS upgrade that renames one shows up
 * here, by name, instead of only as a fallback warning in the logs.
 */
export async function probeOjsDatabase(): Promise<{ ok: boolean; reason?: string }> {
  if (!ojsDatabaseConfigured) return { ok: false, reason: 'not-configured' }
  try {
    await Promise.all([MEMBERSHIPS_SQL, STAGE_SQL, REVIEWS_SQL].map((sql) => select(sql, [0])))
    return { ok: true }
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : 'unknown' }
  }
}
