import { handler, jsonOk } from '@/lib/api'
import { query } from '@/lib/db'
import { requireAdminApi } from '@/lib/admin/guard'

export const dynamic = 'force-dynamic'

/**
 * The audit log, newest first.
 *
 * `source_ip` is read but never returned. It exists for incident triage, and an
 * activity screen that renders colleagues' IP addresses as a matter of course
 * is surveillance of staff rather than an audit trail. Query the table directly
 * when there is an actual incident.
 */

type AuditRow = {
  id: number
  actor_user_id: number
  actor_name: string | null
  action: string
  target_type: string
  target_id: string
  before_state: unknown
  after_state: unknown
  note: string | null
  created_at: Date
}

const MAX_LIMIT = 200

export const GET = handler(async (request) => {
  const auth = await requireAdminApi(request)
  if (!auth.ok) return auth.response

  const params = new URL(request.url).searchParams
  const requested = Number(params.get('limit'))
  const limit = Number.isInteger(requested) && requested > 0 ? Math.min(requested, MAX_LIMIT) : 100

  // Interpolated, not bound: MySQL will not accept a placeholder for LIMIT in a
  // prepared statement. Safe because `limit` is an integer by construction
  // above — never the raw string — and this is the only interpolation in the
  // file for that reason.
  const rows = await query<AuditRow>(
    `SELECT id, actor_user_id, actor_name, action, target_type, target_id,
            before_state, after_state, note, created_at
       FROM admin_audit
      ORDER BY created_at DESC, id DESC
      LIMIT ${limit}`,
  )

  return jsonOk({
    entries: rows.map((row) => ({
      id: row.id,
      actorUserId: row.actor_user_id,
      actorName: row.actor_name,
      action: row.action,
      targetType: row.target_type,
      targetId: row.target_id,
      before: row.before_state,
      after: row.after_state,
      note: row.note,
      createdAtIso: new Date(row.created_at).toISOString(),
    })),
  })
})
