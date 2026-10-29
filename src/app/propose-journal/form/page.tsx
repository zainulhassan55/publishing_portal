import type { Metadata } from 'next'
import { formPageRobots } from '@/components/forms/FormPage'
import { ProposeJournalPage } from '@/components/mockup/ProposeJournalPage'
import { subjectList } from '@/data/subjects'
import { requireMemberPage } from '@/lib/auth/require'
import { editorialEmail } from '@/lib/site'
import { withSharing } from '@/lib/metadata'

export const metadata: Metadata = withSharing({ title: 'Journal proposal form', robots: formPageRobots })

const subjects = subjectList.map((subject) => subject.label)

export default async function ProposeJournalForm() {
  await requireMemberPage('/propose-journal/form')
  return <ProposeJournalPage subjects={subjects} editorialEmail={editorialEmail} view="form" />
}
