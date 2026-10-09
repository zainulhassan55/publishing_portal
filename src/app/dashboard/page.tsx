import type { Metadata } from 'next'
import { Suspense } from 'react'
import { DashboardPage } from '@/components/mockup/DashboardPage'
import { demoInvitations, demoSubmissions } from '@/components/dashboard/demo-submissions'
import { journalCode, journals } from '@/data/registry'
import { demoContentEnabled } from '@/data/content'

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
 * from /api/session (SessionProvider), the server only contributes the journal
 * lookup table and, in demo mode, the fixtures. Passing the fixtures from here
 * keeps them out of the production client bundle when demo content is off.
 */
export default function Dashboard() {
  const journalRefs = journals.map((journal) => ({
    slug: journal.slug,
    code: journalCode(journal),
    title: journal.title,
  }))

  return (
    <Suspense fallback={null}>
      <DashboardPage
        journals={journalRefs}
        demoSubmissions={demoContentEnabled ? demoSubmissions : []}
        demoInvitations={demoContentEnabled ? demoInvitations : []}
      />
    </Suspense>
  )
}
