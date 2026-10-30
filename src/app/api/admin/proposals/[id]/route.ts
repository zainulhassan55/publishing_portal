import { handler, jsonError, jsonOk } from '@/lib/api'
import { execute, query } from '@/lib/db'
import { requireAdminApi } from '@/lib/admin/guard'
import { recordAudit } from '@/lib/admin/audit'
import { readDecisionLetter, sendDecisionLetter } from '@/lib/admin/decision-send'

export const dynamic = 'force-dynamic'

/**
 * Moves a journal proposal through its decision states.
 *
 * The status values are migration 001's enum and are not re-invented here —
 * `received`, `under_review`, `accepted`, `declined`. MySQL would reject
 * anything else anyway, but a rejected enum surfaces as a 500 and this must
 * read as a 422 naming the field.
 *
 * Accepting a proposal does **not** create the journal. Creating an OJS context
 * means a slug, a path, sections, an editorial team, email templates and a
 * masthead — a setup conversation, not a database write, and OJS's own journal
 * settings is where it belongs. Accepting records the publisher's decision and
 * the next step is taken in OJS. Wiring this to `POST index/api/v1/contexts`
 * would produce a half-configured journal nobody can submit to, which is worse
 * than an honest hand-off. See docs/ADMIN-PANEL-PLAN.md §4.
 */

const STATUSES = ['received', 'under_review', 'accepted', 'declined'] as const
type Status = (typeof STATUSES)[number]

const isStatus = (value: unknown): value is Status =>
  typeof value === 'string' && (STATUSES as readonly string[]).includes(value)

/** A decision is a thing someone may have to defend later. */
const DECIDED: Status[] = ['accepted', 'declined']

type Body = { status?: unknown; note?: unknown; email?: unknown }

export const PATCH = handler(async (request) => {
  const auth = await requireAdminApi(request, { mutating: true })
  if (!auth.ok) return auth.response

  // The id is the last path segment. Read from the URL rather than the context
  // argument so this handler keeps the single-`request` shape `handler()` wraps.
  const id = Number(new URL(request.url).pathname.split('/').filter(Boolean).pop())
  if (!Number.isInteger(id) || id <= 0) {
    return jsonError('validation', 422, { errors: [{ field: 'id', message: 'Unknown proposal' }] })
  }

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return jsonError('validation', 422, { errors: [{ field: 'body', message: 'Request body must be valid JSON' }] })
  }

  if (!isStatus(body.status)) {
    return jsonError('validation', 422, {
      errors: [{ field: 'status', message: `Status must be one of ${STATUSES.join(', ')}` }],
    })
  }

  const note = typeof body.note === 'string' ? body.note.slice(0, 4000).trim() : ''

  // Declining without a reason is the one transition worth refusing. The
  // proposer will ask why, and "the record does not say" is not an answer a
  // publisher should have to give.
  if (body.status === 'declined' && !note) {
    return jsonError('validation', 422, {
      errors: [{ field: 'note', message: 'Give a reason when declining — the proposer will be told it' }],
    })
  }

  const letter = readDecisionLetter(body.email)
  if (!letter.ok) return jsonError('validation', 422, { errors: [{ field: letter.field, message: letter.message }] })

  const [before] = await query<{ id: number; status: string; title: string; decision_note: string | null; proposer_email: string }>(
    'SELECT id, status, title, decision_note, proposer_email FROM journal_proposals WHERE id = ?',
    [id],
  )

  if (!before) {
    return jsonError('not-found', 404, { message: 'That proposal no longer exists.' })
  }

  const decided = DECIDED.includes(body.status)

  const affected = await execute(
    `UPDATE journal_proposals
        SET status = ?,
            decision_note = ?,
            decided_at = ${decided ? 'NOW()' : 'NULL'},
            decided_by = ?
      WHERE id = ?`,
    [body.status, note || null, decided ? auth.context.user.id : null, id],
  )

  if (affected === 0) {
    return jsonError('not-found', 404, { message: 'That proposal no longer exists.' })
  }

  // The letter is optional and sent only once the decision is saved: a mail
  // failure is reported back so the editor can resend, never undoes the decision.
  const mail = letter.letter
    ? await sendDecisionLetter({ to: before.proposer_email, letter: letter.letter, table: 'journal_proposals', where: 'id = ?', params: [id] })
    : null

  await recordAudit({
    actor: auth.context.user,
    action: 'proposal.status_changed',
    targetType: 'journal_proposal',
    targetId: id,
    before: { status: before.status, note: before.decision_note },
    after: {
      status: body.status,
      note: note || null,
      ...(letter.letter ? { email: { to: before.proposer_email, ...letter.letter, sent: mail?.sent ?? false } } : {}),
    },
    note: note || null,
    request,
  })

  return jsonOk({ id, status: body.status, emailed: mail?.sent ?? false, emailError: mail && !mail.sent ? mail.reason : undefined })
})
