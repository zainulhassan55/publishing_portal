import { databaseConfigured, query } from '../db'

/**
 * How many submissions are new: still `received`, meaning nobody has acted on
 * them yet. This is what lights up the admin nav.
 *
 * "New" is a status rather than a per-admin "seen" flag on purpose. Opening a
 * record is not dealing with it; marking it under review, or deciding it, is.
 * So the badge goes when the work is picked up, for every admin at once.
 */

export type PendingCounts = {
  proposals: number
  forms: { application: number; special_issue: number; book_volume: number; book_submission: number }
  total: number
}

/** Null when the database cannot be read, so the nav shows nothing rather than a false zero. */
export async function pendingCounts(): Promise<PendingCounts | null> {
  if (!databaseConfigured) return null
  try {
    const rows = await query<{ k: string; n: number }>(
      `SELECT 'proposals' AS k, COUNT(*) AS n FROM journal_proposals WHERE status = 'received'
         UNION ALL SELECT 'application', COUNT(*) FROM editorial_applications WHERE status = 'received'
         UNION ALL SELECT 'special_issue', COUNT(*) FROM editorial_proposals WHERE status = 'received' AND kind = 'special_issue'
         UNION ALL SELECT 'book_volume', COUNT(*) FROM editorial_proposals WHERE status = 'received' AND kind = 'book_volume'
         UNION ALL SELECT 'book_submission', COUNT(*) FROM book_submissions WHERE status = 'received'`,
    )
    const n = (k: string) => Number(rows.find((r) => r.k === k)?.n ?? 0)
    const forms = { application: n('application'), special_issue: n('special_issue'), book_volume: n('book_volume'), book_submission: n('book_submission') }
    const proposals = n('proposals')
    return { proposals, forms, total: proposals + forms.application + forms.special_issue + forms.book_volume + forms.book_submission }
  } catch (error) {
    console.error('[admin] pending counts failed:', error)
    return null
  }
}
