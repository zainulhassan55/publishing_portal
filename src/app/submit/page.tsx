import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SubmitWizard } from '@/components/mockup/SubmitWizard'
import { getCalls } from '@/data/content'
import { isStanding } from '@/data/content/cfps'
import { journalCode, journals } from '@/data/registry'
import { subjectList } from '@/data/subjects'

export const metadata: Metadata = {
  title: 'New submission',
  description:
    'Start a submission to a NextGenIQ Press journal: choose the journal and article type, confirm the requirements, enter metadata, authors with ORCID and CRediT roles, list your files and complete the declarations.',
  alternates: { canonical: '/submit' },
  // A part-completed submission is a working surface, not a document, and a
  // draft URL carries a draft id. Nothing here belongs in an index.
  robots: { index: false, follow: true },
}

const journalOptions = journals.map((journal) => ({
  slug: journal.slug,
  title: journal.title,
  code: journalCode(journal),
}))

/**
 * Special-issue calls only. The standing open call needs no selection, and a
 * closed call is filtered in the client island — `deadlineState` reads the
 * clock, and a statically generated page would freeze that at build time.
 */
const callOptions = getCalls()
  .filter((call) => !isStanding(call))
  .map((call) => ({
    id: call.id,
    journalSlug: call.journalSlug,
    theme: call.theme,
    deadlineIso: call.deadlineIso,
    guestEditor: call.guestEditor,
  }))

const subjects = subjectList.map((subject) => subject.label)

/** Server wrapper for the replicated Submit.dc.html wizard. */
export default function SubmitPage() {
  return (
    <Suspense fallback={null}>
      <SubmitWizard journals={journalOptions} calls={callOptions} subjects={subjects} />
    </Suspense>
  )
}
