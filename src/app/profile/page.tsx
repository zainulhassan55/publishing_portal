import type { Metadata } from 'next'
import { ProfilePage, type ProfileJournalRef } from '@/components/mockup/ProfilePage'
import { journalCode, journals } from '@/data/registry'
import { withSharing } from '@/lib/metadata'

export const metadata: Metadata = withSharing({
  title: 'My profile',
  description:
    'Manage the research interests, reviewing availability and email alert preferences NextGenIQ Press holds for your account.',
  alternates: { canonical: '/profile' },
  // Account pages are per-user and must never be indexed.
  robots: { index: false, follow: false },
})

export default function Page() {
  const journalRefs: ProfileJournalRef[] = journals.map((journal) => ({
    slug: journal.slug,
    code: journalCode(journal),
    title: journal.title,
  }))

  return <ProfilePage journals={journalRefs} />
}
