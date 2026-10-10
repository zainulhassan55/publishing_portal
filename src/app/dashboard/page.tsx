import type { Metadata } from 'next'
import { Suspense } from 'react'
import { DashboardPage } from '@/components/mockup/DashboardPage'
import { journalCode, journals } from '@/data/registry'

export const metadata: Metadata = {
  title: 'My submissions',
  description:
    'Track your NextGenIQ Press drafts, submissions and review invitations, and pick up where you left off in the submission wizard.',
  alternates: { canonical: '/dashboard' },
  // A per-user workspace must never be indexed, and there is nothing here for a
  // crawler to follow either.
  robots: { index: false, follow: false },
}

/**
 * Server wrapper for the replicated Dashboard.dc.html page. The route stays a
 * server component so it is statically rendered: identity resolves client-side
 * from /api/session, submissions from /api/submissions and drafts from
 * /api/drafts. The server contributes only the journal lookup table.
 *
 * It used to pass fixture submissions and review invitations in demo mode.
 * Those are gone — the dashboard now shows the author's real OJS submissions,
 * and fabricated manuscripts sitting beside real ones was confusing rather
 * than illustrative.
 */
export default function Dashboard() {
  const journalRefs = journals.map((journal) => ({
    slug: journal.slug,
    code: journalCode(journal),
    title: journal.title,
  }))

  return (
    <Suspense fallback={null}>
      <DashboardPage journals={journalRefs} />
    </Suspense>
  )
}
