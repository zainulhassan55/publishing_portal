import type { Metadata } from 'next'
import { ProposeJournalPage } from '@/components/mockup/ProposeJournalPage'
import { subjectList } from '@/data/subjects'
import { editorialEmail } from '@/lib/site'
import { withSharing } from '@/lib/metadata'

export const metadata: Metadata = withSharing({
  title: 'Propose a new journal',
  description:
    'Propose a new open-access journal to NextGenIQ Press. Tell us the title, subject area, aims and scope, the gap it fills and your proposed Editor-in-Chief. Proposals are acknowledged within 5 working days and decided quarterly.',
  alternates: { canonical: '/propose-journal' },
})

const subjects = subjectList.map((subject) => subject.label)

/** Server wrapper for the replicated ProposeJournal.dc.html page. */
export default function ProposeJournal() {
  return <ProposeJournalPage subjects={subjects} editorialEmail={editorialEmail} />
}
