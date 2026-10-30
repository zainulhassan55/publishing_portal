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

/** Editors as name and university rows, with no column headings. */
export const editorTable = (editors: { name: string; affiliation: string }[]) => ({
  head: [],
  rows: editors.map((e) => [e.name, e.affiliation]),
})

/**
 * Editorial board text for a title whose editors have not been named yet. The
 * page's call to action links to the application form (see the [pageId] route).
 */
export const boardPending = (code: string) =>
  `The ${code} editorial board is being appointed, and its members will be listed here. Researchers with relevant expertise who would like to serve on the board are welcome to apply.`

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
