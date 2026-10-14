import Link from 'next/link'
import { query } from '@/lib/db'
import { databaseConfigured } from '@/lib/db'
import { requireAdminPage } from '@/lib/admin/guard'
import { journals } from '@/data/registry'

export const dynamic = 'force-dynamic'

/**
 * The overview.
 *
 * Counts only, each one a link into the screen that acts on it. Deliberately
 * not a dashboard of charts: the question an administrator opens this page with
 * is "what needs me", and a number that is zero is a complete answer.
 *
 * What is *not* here is as considered as what is. Submission counts would mean
 * ten authenticated OJS calls on a page whose job is to load instantly, so
 * "All submissions" is a link rather than a tile. See docs/ADMIN-PANEL-PLAN.md.
 */

async function proposalCounts() {
  if (!databaseConfigured) return null
  try {
    const rows = await query<{ status: string; n: number }>(
      'SELECT status, COUNT(*) AS n FROM journal_proposals GROUP BY status',
    )
    const by = new Map(rows.map((r) => [r.status, Number(r.n)]))
    return {
      open: (by.get('received') ?? 0) + (by.get('under_review') ?? 0),
      accepted: by.get('accepted') ?? 0,
      declined: by.get('declined') ?? 0,
    }
  } catch (error) {
    // A panel that 500s because one count failed is less useful than one that
    // says the number is unavailable.
    console.error('[admin] proposal counts failed:', error)
    return null
  }
}

const card: React.CSSProperties = {
  background: 'var(--surface,#fff)',
  border: '1px solid var(--line,#DCE1E6)',
  borderRadius: 4,
  padding: '18px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}

export default async function AdminOverview() {
  await requireAdminPage()
  const proposals = await proposalCounts()

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
      <div style={card}>
        <span style={{ fontSize: 13, color: 'var(--muted,#505C68)' }}>Journal proposals awaiting a decision</span>
        <strong style={{ fontSize: 30, lineHeight: 1.1, color: 'var(--ink,#101B27)' }}>
          {proposals ? proposals.open : '—'}
        </strong>
        <span style={{ fontSize: 12, color: 'var(--muted,#505C68)' }}>
          {proposals
            ? `${proposals.accepted} accepted · ${proposals.declined} declined`
            : 'Count unavailable — the database did not answer'}
        </span>
        <Link href="/admin/proposals" style={{ fontSize: 13, marginTop: 2 }}>
          Review proposals
        </Link>
      </div>

      <div style={card}>
        <span style={{ fontSize: 13, color: 'var(--muted,#505C68)' }}>Journals in the portfolio</span>
        <strong style={{ fontSize: 30, lineHeight: 1.1, color: 'var(--ink,#101B27)' }}>{journals.length}</strong>
        <span style={{ fontSize: 12, color: 'var(--muted,#505C68)' }}>
          Each one opens straight into its editorial system, signed in
        </span>
        <Link href="/admin/journals" style={{ fontSize: 13, marginTop: 2 }}>
          Open a journal in OJS
        </Link>
      </div>

      <div style={card}>
        <span style={{ fontSize: 13, color: 'var(--muted,#505C68)' }}>Submissions</span>
        <strong style={{ fontSize: 18, lineHeight: 1.3, color: 'var(--ink,#101B27)' }}>Across all journals</strong>
        <span style={{ fontSize: 12, color: 'var(--muted,#505C68)' }}>
          Read live from OJS, every journal in one table
        </span>
        <Link href="/admin/submissions" style={{ fontSize: 13, marginTop: 2 }}>
          Open the queue
        </Link>
      </div>
    </div>
  )
}
