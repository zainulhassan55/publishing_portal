import type { Article } from '@/types/publishing'
import type { JournalDetail } from '@/types/content'
// Explicit extension: the test suite runs under node:test with type stripping
// and no bundler, and Node's ESM resolver does not guess extensions.
import { doiUrl } from './site.ts'

const year = (iso: string) => iso.slice(0, 4)

const authorNames = (article: Article) => article.authors.map((a) => a.name)

/** "Family, G. N." — the form used by the plain-text and BibTeX exports. */
const invert = (name: string) => {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  const family = parts[parts.length - 1]
  const givenInitials = parts
    .slice(0, -1)
    .map((p) => `${p[0]}.`)
    .join(' ')
  return `${family}, ${givenInitials}`
}

const bibKey = (article: Article) => {
  const family = (article.authors[0]?.name.split(/\s+/).pop() ?? 'anon').toLowerCase().replace(/[^a-z]/g, '')
  const word = article.title.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '') ?? 'article'
  return `${family}${year(article.publishedIso)}${word}`
}

export function plainTextCitation(article: Article, journal: JournalDetail): string {
  const authors = authorNames(article).map(invert).join(', ')
  const pages = article.pages ? `, ${article.pages}` : ''
  return `${authors} (${year(article.publishedIso)}). ${article.title}. ${journal.title}, ${article.volume}(${article.issue})${pages}. ${doiUrl(article.doi)}`
}

export function bibtexCitation(article: Article, journal: JournalDetail): string {
  const type = article.type === 'Review' || article.type === 'Research Article' ? 'article' : 'article'
  const lines = [
    `@${type}{${bibKey(article)},`,
    `  author  = {${authorNames(article).map(invert).join(' and ')}},`,
    `  title   = {${article.title}},`,
    `  journal = {${journal.title}},`,
    `  year    = {${year(article.publishedIso)}},`,
    `  volume  = {${article.volume}},`,
    `  number  = {${article.issue}},`,
    article.pages ? `  pages   = {${article.pages.replace('–', '--')}},` : null,
    `  doi     = {${article.doi}},`,
    `  url     = {${doiUrl(article.doi)}}`,
    '}',
  ]
  return lines.filter(Boolean).join('\n')
}

export function risCitation(article: Article, journal: JournalDetail): string {
  const typeTag = article.type === 'Review' ? 'JOUR' : 'JOUR'
  const [start, end] = (article.pages ?? '').split('–')
  const lines = [
    `TY  - ${typeTag}`,
    ...authorNames(article).map((n) => `AU  - ${invert(n)}`),
    `TI  - ${article.title}`,
    `JO  - ${journal.title}`,
    `PY  - ${year(article.publishedIso)}`,
    `VL  - ${article.volume}`,
    `IS  - ${article.issue}`,
    start ? `SP  - ${start}` : null,
    end ? `EP  - ${end}` : null,
    `DO  - ${article.doi}`,
    `UR  - ${doiUrl(article.doi)}`,
    ...article.keywords.map((k) => `KW  - ${k}`),
    `AB  - ${article.abstract}`,
    'ER  - ',
  ]
  return lines.filter(Boolean).join('\n')
}

/**
 * EndNote's tagged export. Distinct from RIS despite the similarity — EndNote
 * uses %-prefixed tags and a different author order convention.
 */
export function endnoteCitation(article: Article, journal: JournalDetail): string {
  const lines = [
    '%0 Journal Article',
    ...authorNames(article).map((n) => `%A ${invert(n)}`),
    `%T ${article.title}`,
    `%J ${journal.title}`,
    `%D ${year(article.publishedIso)}`,
    `%V ${article.volume}`,
    `%N ${article.issue}`,
    article.pages ? `%P ${article.pages}` : null,
    `%R ${article.doi}`,
    `%U ${doiUrl(article.doi)}`,
    ...article.keywords.map((k) => `%K ${k}`),
    `%X ${article.abstract}`,
  ]
  return lines.filter(Boolean).join('\n')
}

export type CitationFormat = 'plain' | 'bibtex' | 'ris' | 'endnote'

export const citationFormats: { id: CitationFormat; label: string; filename: (slug: string) => string }[] = [
  { id: 'plain', label: 'Plain text', filename: (s) => `${s}.txt` },
  { id: 'bibtex', label: 'BibTeX', filename: (s) => `${s}.bib` },
  { id: 'ris', label: 'RIS', filename: (s) => `${s}.ris` },
  { id: 'endnote', label: 'EndNote', filename: (s) => `${s}.enw` },
]

export function buildCitation(format: CitationFormat, article: Article, journal: JournalDetail): string {
  switch (format) {
    case 'bibtex':
      return bibtexCitation(article, journal)
    case 'ris':
      return risCitation(article, journal)
    case 'endnote':
      return endnoteCitation(article, journal)
    default:
      return plainTextCitation(article, journal)
  }
}
