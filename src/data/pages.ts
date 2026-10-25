import type { ContentBlock, JournalPage } from '@/types/content'
import { issnLabel } from './issn'

export const editorialEmail = 'contact@nextgeniqpress.com'

export function page(id: string, label: string, title: string, summary: string, blocks: ContentBlock[]): JournalPage {
  return { id, label, title, summary, blocks }
}

/** A page whose whole body sits under its own title, so no section heading is repeated. */
export const plain = (paragraphs: string[], extra: Omit<ContentBlock, 'title' | 'paragraphs'> = {}): ContentBlock => ({
  title: '',
  paragraphs,
  ...extra,
})

export const editorTable = (editors: { name: string; affiliation: string }[]) => ({
  head: ['Name', 'Affiliation'],
  rows: editors.map((e) => [e.name, e.affiliation]),
})

/** Facts strip for a journal. ISSNs read "Applied for" until `issn.ts` holds an assigned number. */
export const journalFacts = (eIssn: string | null) => [
  { label: 'ISSN (online)', value: issnLabel(eIssn) },
  { label: 'Peer review', value: 'Double-blind' },
  { label: 'Licence', value: 'CC BY 4.0' },
  { label: 'Publication model', value: 'Continuous' },
]

export const seriesFacts = [
  { label: 'Access', value: 'Open access' },
  { label: 'Peer review', value: 'Every volume' },
  { label: 'Licence', value: 'CC BY 4.0' },
  { label: 'Submission fee', value: 'None' },
]
