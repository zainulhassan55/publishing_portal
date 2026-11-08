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

/**
 * Articles in press page. Left blank (title only) at the publisher's request
 * until there are articles in press; then pass their entries as `paragraphs`.
 */
export const articlesInPressPage = (code: string, paragraphs: string[] = []): JournalPage =>
  page('articles-in-press', 'Articles in press', 'Articles in press', `Accepted ${code} articles awaiting their final issue.`, paragraphs.length ? [plain(paragraphs)] : [])

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

/** Facts strip for a journal. ISSNs read "Not yet assigned" until `issn.ts` holds an assigned number. */
export const journalFacts = (eIssn: string | null) => [
  { label: 'ISSN (online)', value: issnLabel(eIssn) },
  { label: 'Peer review', value: 'Double-blind' },
  { label: 'Licence', value: 'CC BY 4.0' },
  { label: 'Publication model', value: 'Continuous' },
]

/** Book series facts strip ("Series information" table supplied by the publisher, November 2026). */
export const seriesFacts = [
  { label: 'Publication format', value: 'E-book only' },
  { label: 'Access options', value: 'Open access or subscription' },
  { label: 'Peer review', value: 'Every volume' },
  { label: 'Open access licence', value: 'CC BY 4.0' },
  { label: 'Submission fee', value: 'None' },
]

/** Added to every series' Author & editor guidelines page (publisher, November 2026). */
export const seriesDigitalPublication =
  'Please prepare your manuscript and illustrations for digital publication. The publishing agreement will specify the volume’s access model, applicable terms and any publication charges.'

/** Added to every series' Peer review & ethics page (publisher, November 2026). */
export const seriesSameStandards =
  'Every volume undergoes peer review. The same editorial standards apply to open access and subscription volumes. Publication charges and funding arrangements do not influence editorial decisions.'
