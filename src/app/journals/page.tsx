import type { Metadata } from 'next'
import { JournalsPage } from '@/components/mockup/JournalsPage'
import { publicationCards } from '@/lib/publication'
import { withSharing } from '@/lib/metadata'

export const metadata: Metadata = withSharing({
  title: 'Journals',
  description:
    'Explore our open-access journals, featuring double-blind peer review and continuous publication, our magazines, and the book series open to volume proposals.',
  alternates: { canonical: '/journals' },
})

export default function Journals() {
  const { journals, magazines, series } = publicationCards()
  return <JournalsPage journals={journals} magazines={magazines} series={series} />
}
