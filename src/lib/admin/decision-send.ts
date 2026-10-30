import { execute } from '../db'
import { sendTransactionalEmail } from '../email'
import { hasPlaceholder } from './decision-email'

/**
 * The server half of decision letters: checks the letter the editor wrote and
 * sends it. The decision itself is saved first, by the caller. A mail failure
 * must not undo a decision; it is reported so the editor can try again.
 */

export type DecisionLetter = { subject: string; body: string }

export type LetterResult =
  | { ok: true; letter: DecisionLetter | null }
  | { ok: false; field: string; message: string }

/** Reads `email: { subject, body }` from a decision request. Absent or null means "don't email". */
export function readDecisionLetter(value: unknown): LetterResult {
  if (value === undefined || value === null) return { ok: true, letter: null }
  if (typeof value !== 'object') return { ok: false, field: 'email', message: 'Email must be an object' }

  const { subject, body } = value as { subject?: unknown; body?: unknown }
  // Header injection: nodemailer folds newlines in a subject, but refusing them
  // is clearer than relying on that.
  const s = typeof subject === 'string' ? subject.replace(/[\r\n]+/g, ' ').trim() : ''
  const b = typeof body === 'string' ? body.replace(/\r\n/g, '\n').trim() : ''

  if (!s) return { ok: false, field: 'email.subject', message: 'The email needs a subject' }
  if (s.length > 200) return { ok: false, field: 'email.subject', message: 'Keep the subject under 200 characters' }
  if (!b) return { ok: false, field: 'email.body', message: 'The email is empty' }
  if (b.length > 20_000) return { ok: false, field: 'email.body', message: 'The email is too long' }
  if (hasPlaceholder(b)) {
    return { ok: false, field: 'email.body', message: 'Replace or delete the “[Add any details here…]” line before sending' }
  }

  return { ok: true, letter: { subject: s, body: b } }
}

/**
 * Sends the letter and stamps `decision_emailed_at`. `where` is the row's
 * WHERE clause and params, the same one the caller's UPDATE used.
 */
export async function sendDecisionLetter(opts: {
  to: string
  letter: DecisionLetter
  table: string
  where: string
  params: (string | number)[]
}): Promise<{ sent: boolean; reason?: string }> {
  const result = await sendTransactionalEmail({ to: opts.to, subject: opts.letter.subject, lines: opts.letter.body.split('\n') })
  if (result.sent) {
    try {
      await execute(`UPDATE ${opts.table} SET decision_emailed_at = CURRENT_TIMESTAMP WHERE ${opts.where}`, opts.params)
    } catch (error) {
      // The letter has gone. A missing flag is a cosmetic problem, not a reason to report a failure.
      console.error('[decision-email] sent, but could not record it:', error)
    }
  }
  return result
}
