import { handler, jsonError, jsonOk } from '@/lib/api'
import { recordAudit } from '@/lib/admin/audit'
import { requireAdminApi } from '@/lib/admin/guard'
import { execute, query } from '@/lib/db'
import { FORM_TABLES, isFormKind } from '@/lib/forms/admin'
import { readDecisionLetter, sendDecisionLetter } from '@/lib/admin/decision-send'

export const dynamic = 'force-dynamic'

const STATUSES = ['received', 'under_review', 'revisions', 'accepted', 'declined', 'withdrawn'] as const
const DECIDED = ['accepted', 'declined']

/**
 * Moves an application, proposal or book submission through its states. As
 * with journal proposals, declining needs a reason, and every change is
 * written to the audit log. Accepting records the decision only; the next step
 * (an invitation, a contract, a volume record) is taken by the editors.
 *
 * An optional `email: { subject, body }` is the letter the editor wrote in the
 * panel. It is sent after the decision is saved; if sending fails the decision
 * stands and the response says so, so the editor can resend.
 */
export const PATCH = handler(async (request) => {
  const auth = await requireAdminApi(request, { mutating: true })
  if (!auth.ok) return auth.response

  const [kind, rawId] = new URL(request.url).pathname.split('/').filter(Boolean).slice(-2)
  const id = Number(rawId)
  if (!isFormKind(kind) || !Number.isInteger(id) || id <= 0) return jsonError('not-found', 404)
  const { table, ownerType } = FORM_TABLES[kind]

  const body = (await request.json().catch(() => ({}))) as { status?: unknown; note?: unknown; email?: unknown }
  const status = typeof body.status === 'string' ? body.status : ''
  // `revisions` exists only for book submissions; the other tables' enums would reject it.
  const allowed = kind === 'book_submission' ? STATUSES : STATUSES.filter((s) => s !== 'revisions')
  if (!(allowed as readonly string[]).includes(status)) {
    return jsonError('validation', 422, { errors: [{ field: 'status', message: `Status must be one of ${allowed.join(', ')}` }] })
  }
  const note = typeof body.note === 'string' ? body.note.slice(0, 4000).trim() : ''
  if (status === 'declined' && !note) {
    return jsonError('validation', 422, { errors: [{ field: 'note', message: 'Give a reason when declining' }] })
  }
  const letter = readDecisionLetter(body.email)
  if (!letter.ok) return jsonError('validation', 422, { errors: [{ field: letter.field, message: letter.message }] })

  // Special issue and book volume proposals share a table; the kind is part of the identity.
  const kindClause = table === 'editorial_proposals' ? ' AND kind = ?' : ''
  const kindParam = table === 'editorial_proposals' ? [kind] : []

  const emailColumn = kind === 'application' ? 'email' : kind === 'book_submission' ? 'corresponding_email' : 'submitter_email'
  const [before] = await query<{ status: string; decision_note: string | null; to_email: string }>(
    `SELECT status, decision_note, ${emailColumn} AS to_email FROM ${table} WHERE id = ?${kindClause}`,
    [id, ...kindParam],
  )
  if (!before) return jsonError('not-found', 404, { message: 'That record no longer exists.' })

  const decided = DECIDED.includes(status)
  await execute(
    `UPDATE ${table} SET status = ?, decision_note = ?, decided_at = ${decided ? 'CURRENT_TIMESTAMP' : 'NULL'}, decided_by = ? WHERE id = ?${kindClause}`,
    [status, note || null, decided ? auth.context.user.id : null, id, ...kindParam],
  )

  const mail = letter.letter
    ? await sendDecisionLetter({ to: before.to_email, letter: letter.letter, table, where: `id = ?${kindClause}`, params: [id, ...kindParam] })
    : null

  await recordAudit({
    actor: auth.context.user,
    action: 'editorial_form.status_changed',
    targetType: ownerType as 'editorial_application' | 'editorial_proposal' | 'book_submission',
    targetId: id,
    before: { status: before.status, decision_note: before.decision_note },
    after: {
      status,
      decision_note: note || null,
      ...(letter.letter ? { email: { to: before.to_email, ...letter.letter, sent: mail?.sent ?? false } } : {}),
    },
    note,
    request,
  })

  return jsonOk({ status, emailed: mail?.sent ?? false, emailError: mail && !mail.sent ? mail.reason : undefined })
})
