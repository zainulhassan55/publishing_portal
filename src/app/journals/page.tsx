import type { Metadata } from 'next'
import { JournalsPage, type JournalsRow, type SeriesRow, type SubjectChip } from '@/components/mockup/JournalsPage'
import { journalCode, journals, series } from '@/data/registry'
import { subjectFor, subjectList } from '@/data/subjects'

export const metadata: Metadata = {
  title: 'Journals',
  description:
    'Ten open-access journals with double-blind peer review and continuous publication, plus the book series and proceedings open to volume and conference proposals.',
  alternates: { canonical: '/journals' },
}

export default function Journals() {
  const rows: JournalsRow[] = journals.map((journal) => {
    const subject = subjectFor(journal.slug)
    return {
      slug: journal.slug,
      code: journalCode(journal),
      title: journal.title,
      subject: subject.label,
      sk: subject.key,
      color: subject.color,
      scope: journal.scope,
    }
  })

  const subjects: SubjectChip[] = subjectList.map((s) => ({ k: s.key, label: s.label, color: s.color }))

  const seriesRows: SeriesRow[] = series.map((s) => ({
    slug: s.slug,
    kind: s.kind === 'book' ? 'Book series' : 'Proceedings',
    code: s.code,
    id: s.kind === 'book' ? 'ISSN' : 'ISBN',
    title: s.title,
    desc: s.scope,
    cta: s.kind === 'book' ? 'Propose a volume' : 'Publish your conference',
  }))

  return <JournalsPage rows={rows} subjects={subjects} series={seriesRows} />
}
