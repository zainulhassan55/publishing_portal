/**
 * The admin audit trail.
 *
 * Every state change the panel makes goes through `recordAudit`. See
 * migrations/003_admin_audit.sql for why the table exists at all.
 *
 * ## It never throws
 *
 * A failed audit write must not fail the action it was recording. That sounds
 * backwards for an audit log — surely an unlogged change is worse than no
 * change — but consider the alternative: a full disk or a lock timeout on this
 * table would then block approving a journal proposal, and the operator's fix
 * would be to bypass the panel entirely and edit the row by hand, which logs
 * nothing at all. Logging loudly to stderr and letting the action succeed keeps
 * the work inside the audited path.
 *
 * It is written **after** the change, not before: a log of attempts rather than
 * outcomes would record decisions that never took effect.
 */

import { insert } from '../db'
import { clientIp } from '../api'
import type { SessionUser } from '../auth/session'

export type AuditAction =
  | 'proposal.status_changed'
  | 'journal.visibility_changed'
  | 'article.display_changed'
  | 'cfp.status_changed'
  | 'editorial_form.status_changed'
  | 'upload.downloaded'
  | 'volume.changed'
  | 'chapter.changed'

export type AuditEntry = {
  actor: SessionUser
  action: AuditAction
  targetType:
    | 'journal_proposal'
    | 'journal'
    | 'article'
    | 'cfp_proposal'
    | 'editorial_application'
    | 'editorial_proposal'
    | 'book_submission'
    | 'upload'
    | 'book_volume'
    | 'book_chapter'
  targetId: string | number
  before?: unknown
  after?: unknown
  note?: string | null
  request?: Request
}

/**
 * Packs an IPv4 or IPv6 address for the `VARBINARY(16)` column.
 *
 * Returns null for anything unparseable rather than storing a half-read
 * address: a wrong address in an audit log is worse than an absent one, because
 * it reads as evidence.
 */
function packIp(ip: string | null | undefined): Buffer | null {
  if (!ip) return null

  const v4 = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (v4) {
    const parts = v4.slice(1).map(Number)
    if (parts.some((n) => n > 255)) return null
    return Buffer.from(parts)
  }

  // IPv6, including the `::` compressed form.
  if (!/^[0-9a-fA-F:]+$/.test(ip) || !ip.includes(':')) return null

  const [head, tail] = ip.split('::')
  const headGroups = head ? head.split(':').filter(Boolean) : []
  const tailGroups = tail ? tail.split(':').filter(Boolean) : []

  if (!ip.includes('::') && headGroups.length !== 8) return null
  if (headGroups.length + tailGroups.length > 8) return null

  const groups = ip.includes('::')
    ? [...headGroups, ...Array(8 - headGroups.length - tailGroups.length).fill('0'), ...tailGroups]
    : headGroups

  const bytes = Buffer.alloc(16)
  for (const [i, group] of groups.entries()) {
    const value = Number.parseInt(group, 16)
    if (Number.isNaN(value) || value > 0xffff) return null
    bytes.writeUInt16BE(value, i * 2)
  }
  return bytes
}

export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await insert(
      `INSERT INTO admin_audit
         (actor_user_id, actor_name, action, target_type, target_id, before_state, after_state, note, source_ip)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.actor.id,
        entry.actor.fullName || entry.actor.userName || null,
        entry.action,
        entry.targetType,
        String(entry.targetId),
        entry.before === undefined ? null : JSON.stringify(entry.before),
        entry.after === undefined ? null : JSON.stringify(entry.after),
        entry.note?.trim() || null,
        entry.request ? (packIp(clientIp(entry.request)) as unknown as string | null) : null,
      ],
    )
  } catch (error) {
    // Loud, because an audit log that silently stops recording is worse than
    // one that was never there: it looks complete.
    console.error(
      `[audit] FAILED to record ${entry.action} on ${entry.targetType}:${entry.targetId} by user ${entry.actor.id}:`,
      error,
    )
  }
}
