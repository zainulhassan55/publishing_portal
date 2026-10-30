import { handler, jsonOk } from '@/lib/api'
import { query } from '@/lib/db'
import { requireAdminApi } from '@/lib/admin/guard'

export const dynamic = 'force-dynamic'

/**
 * Journal proposals, for the administrator who decides on them.
 *
 * `journal_proposals` has existed since migration 001 and nothing has ever read
 * it. Proposals arrived through /propose-journal, were acknowledged by email and
 * then sat in a table with no screen — which is the same failure as audit
 * finding F-18 one layer in: the form worked, and the thing behind it did not.
 *
 * `payload` is returned verbatim alongside the typed columns. Migration 001
 * stores it precisely so a later schema change cannot lose what someone
 * actually submitted, and the detail view renders from it rather than from the
 * columns, so a field added to the form appears here without a migration.
 */

type ProposalRow = {
  id: number
  title: string
  subject: string
  scope: string
  rationale: string | null
  expected_volume: string | null
  eic_name: string | null
  eic_affiliation: string | null
  eic_orcid: string | null
  proposer_name: string
  proposer_email: string
  status: string
  decided_at: Date | null
  decided_by: number | null
  decision_note: string | null
  decision_emailed_at: Date | null
  payload: unknown
  created_at: Date
  updated_at: Date
}

export const GET = handler(async (request) => {
  const auth = await requireAdminApi(request)
  if (!auth.ok) return auth.response

  const rows = await query<ProposalRow>(
    `SELECT id, title, subject, scope, rationale, expected_volume,
            eic_name, eic_affiliation, eic_orcid,
            proposer_name, proposer_email, status,
            decided_at, decided_by, decision_note, decision_emailed_at, payload, created_at, updated_at
       FROM journal_proposals
      ORDER BY
        -- Undecided first, oldest first within that: the queue is a worklist,
        -- and the thing most overdue a decision belongs at the top.
        CASE WHEN status IN ('received', 'under_review') THEN 0 ELSE 1 END,
        created_at ASC`,
  )

  return jsonOk({
    proposals: rows.map((row) => ({
      id: row.id,
      title: row.title,
      subject: row.subject,
      scope: row.scope,
      rationale: row.rationale,
      expectedVolume: row.expected_volume,
      eicName: row.eic_name,
      eicAffiliation: row.eic_affiliation,
      eicOrcid: row.eic_orcid,
      proposerName: row.proposer_name,
      proposerEmail: row.proposer_email,
      status: row.status,
      decidedAtIso: row.decided_at ? new Date(row.decided_at).toISOString() : null,
      decidedBy: row.decided_by,
      decisionNote: row.decision_note,
      emailedAtIso: row.decision_emailed_at ? new Date(row.decision_emailed_at).toISOString() : null,
      payload: row.payload,
      createdAtIso: new Date(row.created_at).toISOString(),
      updatedAtIso: new Date(row.updated_at).toISOString(),
    })),
  })
})
