import type { ContentBlock, JournalPage } from '@/types/content'
import { issnLabel } from './issn'

export const editorialEmail = 'contact@nextgeniqpress.com'

export function page(id: string, label: string, title: string, summary: string, blocks: ContentBlock[]): JournalPage {
  return { id, label, title, summary, blocks }
}

/**
 * Indexing & abstracting page for a journal or magazine. Left blank (title
 * only) at the publisher's request until a title is actually indexed; then pass
 * that title's confirmed coverage as `paragraphs`. Indexing facts must be real
 * (audit F-03), so never fill this with expected or applied-for services.
 */
export const indexingPage = (code: string, _kind: 'journal' | 'magazine' = 'journal', paragraphs: string[] = []): JournalPage =>
  page('indexing-abstracting', 'Indexing & abstracting', 'Indexing and Abstracting', `Indexing and abstracting for ${code}.`, paragraphs.length ? [plain(paragraphs)] : [])

/** Articles in press page: accepted work awaiting its final issue. Text only until a list is wired to OJS. */
export const articlesInPressPage = (code: string): JournalPage =>
  page('articles-in-press', 'Articles in press', 'Articles in press', `Accepted ${code} articles awaiting their final issue.`, [
    plain([
      `This page lists articles accepted for publication in ${code} ahead of their final issue. Articles in press have completed peer review and are being prepared for publication; details such as page numbers may change before final publication.`,
      'Accepted articles will be added here as they complete production. Published articles are available from the current issue and the issue archive.',
    ]),
  ])

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

/** Facts strip for a journal. ISSNs read "Not yet assigned" until `issn.ts` holds an assigned number. */
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
