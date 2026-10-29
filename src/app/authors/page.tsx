import type { Metadata } from 'next'
import { AuthorsPage, type AuthorsCall, type AuthorsJournalRef } from '@/components/mockup/AuthorsPage'
import { getCalls } from '@/data/content'
import { isStanding } from '@/data/content/cfps'
import { journalCode, journals } from '@/data/registry'
import { formatDate } from '@/lib/format'
import { withSharing } from '@/lib/metadata'

export const metadata: Metadata = withSharing({
  title: 'For authors',
  description:
    'Everything you need to prepare and submit a manuscript to a NextGenIQ Press journal: scope, article types, templates, fees, ethics requirements and open calls.',
  alternates: { canonical: '/authors' },
})

export default function Page() {
  const journalRefs: AuthorsJournalRef[] = journals.map((j) => ({
    slug: j.slug,
    code: journalCode(j),
    title: j.title,
  }))

  // The mockup's cfp browser lists thematic calls (guest editor + deadline);
  // the standing year-round calls have no deadline to count down.
  const calls: AuthorsCall[] = getCalls()
    .filter((c) => !isStanding(c))
    .map((c) => {
      const journal = journals.find((j) => j.slug === c.journalSlug)
      return {
        id: c.id,
        journalSlug: c.journalSlug,
        code: journal ? journalCode(journal) : c.journalSlug.toUpperCase(),
        theme: c.theme,
        guest: c.guestEditor ?? '',
        deadlineIso: c.deadlineIso,
        deadline: formatDate(c.deadlineIso),
        href: `/journals/${c.journalSlug}/call-for-papers`,
      }
    })

  return <AuthorsPage journals={journalRefs} calls={calls} />
}
