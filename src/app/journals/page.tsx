import type { Metadata } from 'next'
import { JournalsPage } from '@/components/mockup/JournalsPage'
import { publicationCards } from '@/lib/publication'

export const metadata: Metadata = {
  title: 'Journals',
  description:
    'Explore our open-access journals, featuring double-blind peer review and continuous publication, and the book series open to volume proposals.',
  alternates: { canonical: '/journals' },
}

export default function Journals() {
  const { journals, series } = publicationCards()
  return <JournalsPage journals={journals} series={series} />
}
