import type { Article } from '@/types/publishing'
import type { JournalDetail } from '@/types/content'
// Explicit extension: the test suite runs under node:test with type stripping
// and no bundler, and Node's ESM resolver does not guess extensions.
import { absoluteUrl, doiUrl } from './site.ts'

const year = (iso: string) => iso.slice(0, 4)

const authorNames = (article: Article) => article.authors.map((a) => a.name)

/**
 * Where a reader is sent: the DOI when there is one, the article page when
 * there is not. A paper published before its DOI is minted must not cite as
 * `https://doi.org/` with nothing after it.
 */
const locator = (article: Article) => (article.doi ? doiUrl(article.doi) : absoluteUrl(`/articles/${article.slug}`))

/* ----------------------------- name handling ------------------------------ */

/** Splits "Amara N. Okafor" into its family name and the given-name tokens. */
const splitName = (name: string) => {
  const parts = name.trim().split(/\s+/)
  return { family: parts[parts.length - 1] ?? '', given: parts.slice(0, -1) }
}

/** "A. N." — spaced initials, as APA, Chicago and IEEE want them. */
const spacedInitials = (given: string[]) => given.map((g) => `${g[0]}.`).join(' ')
/** "A.N." — unspaced, as Harvard wants them. */
const tightInitials = (given: string[]) => given.map((g) => `${g[0]}.`).join('')
/** "AN" — bare, as Vancouver wants them. */
const bareInitials = (given: string[]) => given.map((g) => g[0]).join('')

/** "Okafor, A. N." */
const apaName = (name: string) => {
  const { family, given } = splitName(name)
  return given.length ? `${family}, ${spacedInitials(given)}` : family
}
/** "Okafor, A.N." */
const harvardName = (name: string) => {
  const { family, given } = splitName(name)
  return given.length ? `${family}, ${tightInitials(given)}` : family
}
/** "Okafor AN" */
const vancouverName = (name: string) => {
  const { family, given } = splitName(name)
  return given.length ? `${family} ${bareInitials(given)}` : family
}
/** "A. N. Okafor" */
const ieeeName = (name: string) => {
  const { family, given } = splitName(name)
  return given.length ? `${spacedInitials(given)} ${family}` : family
}
/** "Okafor, Amara N." — the full inverted form MLA and Chicago lead with. */
const invertFull = (name: string) => {
  const { family, given } = splitName(name)
  return given.length ? `${family}, ${given.join(' ')}` : family
}

/** Ends an author block with a full stop unless it already has one ("Amara N." / "et al."). */
const closeAuthors = (authors: string) => (authors ? (authors.endsWith('.') ? `${authors} ` : `${authors}. `) : '')

/** "A, B, & C" / "A & B" / "A" — the serial-comma list the author-date styles share. */
const serial = (names: string[], conjunction: string) => {
  if (names.length <= 1) return names.join('')
  // APA keeps the comma before "&" even for two authors, because inverted
  // names already carry commas and "Okafor, A. N. & Reyes-Morales, D." misreads.
  if (names.length === 2) return `${names[0]}${conjunction === '&' ? ', & ' : ` ${conjunction} `}${names[1]}`
  return `${names.slice(0, -1).join(', ')}, ${conjunction} ${names[names.length - 1]}`
}

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
  return `${authors} (${year(article.publishedIso)}). ${article.title}. ${journal.title}, ${article.volume}(${article.issue})${pages}. ${locator(article)}`
}

/* ------------------------------ styled forms ------------------------------ */
/*
 * Plain text in each style's reference-list form, without italics markup —
 * these are copied into a manuscript, and the writer's software applies the
 * typography. Author-count rules follow each style's current edition:
 * APA 7 lists up to 20, MLA 9 cuts to "et al." at three, Chicago 17 lists up
 * to ten and shows seven beyond that, Harvard (Cite Them Right) cuts at four,
 * Vancouver and IEEE cut at seven.
 */

/** APA 7th: Okafor, A. N., & Reyes-Morales, D. (2026). Title. Journal, 1(2), 45–67. https://doi.org/… */
export function apaCitation(article: Article, journal: JournalDetail): string {
  const names = authorNames(article).map(apaName)
  const authors =
    names.length > 20 ? `${names.slice(0, 19).join(', ')}, … ${names[names.length - 1]}` : serial(names, '&')
  const pages = article.pages ? `, ${article.pages}` : ''
  return `${authors} (${year(article.publishedIso)}). ${article.title}. ${journal.title}, ${article.volume}(${article.issue})${pages}. ${locator(article)}`
}

/** MLA 9th: Okafor, Amara N., and Daniel Reyes-Morales. "Title." Journal, vol. 1, no. 2, 2026, pp. 45–67, https://doi.org/…. */
export function mlaCitation(article: Article, journal: JournalDetail): string {
  const names = authorNames(article)
  const authors =
    names.length === 0
      ? ''
      : names.length === 1
        ? invertFull(names[0])
        : names.length === 2
          ? `${invertFull(names[0])}, and ${names[1]}`
          : `${invertFull(names[0])}, et al.`
  const pages = article.pages ? `, pp. ${article.pages}` : ''
  return `${closeAuthors(authors)}"${article.title}." ${journal.title}, vol. ${article.volume}, no. ${article.issue}, ${year(article.publishedIso)}${pages}, ${locator(article)}.`
}

/** Chicago 17th, author-date: Okafor, Amara N., and Daniel Reyes-Morales. 2026. "Title." Journal 1 (2): 45–67. https://doi.org/…. */
export function chicagoCitation(article: Article, journal: JournalDetail): string {
  const names = authorNames(article)
  const listed = names.length > 10 ? names.slice(0, 7) : names
  const forms = listed.map((n, i) => (i === 0 ? invertFull(n) : n))
  let authors = names.length > 10 ? `${forms.join(', ')}, et al.` : serial(forms, 'and')
  if (names.length === 2) authors = `${forms[0]}, and ${forms[1]}`
  const pages = article.pages ? `: ${article.pages}` : ''
  return `${closeAuthors(authors)}${year(article.publishedIso)}. "${article.title}." ${journal.title} ${article.volume} (${article.issue})${pages}. ${locator(article)}.`
}

/** Harvard (Cite Them Right): Okafor, A.N. and Reyes-Morales, D. (2026) 'Title', Journal, 1(2), pp. 45–67. doi: … */
export function harvardCitation(article: Article, journal: JournalDetail): string {
  const names = authorNames(article).map(harvardName)
  const authors =
    names.length > 3
      ? `${names[0]} et al.`
      : names.length <= 1
        ? names.join('')
        : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
  const pages = article.pages ? `, pp. ${article.pages}` : ''
  const end = article.doi ? `doi: ${article.doi}.` : `Available at: ${locator(article)}.`
  return `${authors ? `${authors} ` : ''}(${year(article.publishedIso)}) '${article.title}', ${journal.title}, ${article.volume}(${article.issue})${pages}. ${end}`
}

/** Vancouver (ICMJE): Okafor AN, Reyes-Morales D. Title. Journal. 2026;1(2):45–67. doi:… */
export function vancouverCitation(article: Article, journal: JournalDetail): string {
  const names = authorNames(article).map(vancouverName)
  const authors = names.length > 6 ? `${names.slice(0, 6).join(', ')}, et al.` : names.join(', ')
  const pages = article.pages ? `:${article.pages}` : ''
  const end = article.doi ? `doi:${article.doi}` : `Available from: ${locator(article)}`
  return `${closeAuthors(authors)}${article.title}. ${journal.title}. ${year(article.publishedIso)};${article.volume}(${article.issue})${pages}. ${end}`
}

/** IEEE: A. N. Okafor and D. Reyes-Morales, "Title," Journal, vol. 1, no. 2, pp. 45–67, 2026, doi: …. */
export function ieeeCitation(article: Article, journal: JournalDetail): string {
  const names = authorNames(article).map(ieeeName)
  const authors =
    names.length > 6
      ? `${names[0]} et al.`
      : names.length <= 1
        ? names.join('')
        : names.length === 2
          ? `${names[0]} and ${names[1]}`
          : `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
  const pages = article.pages ? `, pp. ${article.pages}` : ''
  const end = article.doi ? `, doi: ${article.doi}.` : `. [Online]. Available: ${locator(article)}`
  return `${authors ? `${authors}, ` : ''}"${article.title}," ${journal.title}, vol. ${article.volume}, no. ${article.issue}${pages}, ${year(article.publishedIso)}${end}`
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
    article.doi ? `  doi     = {${article.doi}},` : null,
    `  url     = {${locator(article)}}`,
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
    article.doi ? `DO  - ${article.doi}` : null,
    `UR  - ${locator(article)}`,
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
    article.doi ? `%R ${article.doi}` : null,
    `%U ${locator(article)}`,
    ...article.keywords.map((k) => `%K ${k}`),
    `%X ${article.abstract}`,
  ]
  return lines.filter(Boolean).join('\n')
}

export type CitationFormat =
  | 'apa'
  | 'mla'
  | 'chicago'
  | 'harvard'
  | 'vancouver'
  | 'ieee'
  | 'plain'
  | 'bibtex'
  | 'ris'
  | 'endnote'

/** Every format, in the order the article page offers them: styles first, then exports. */
export const citationFormats: { id: CitationFormat; label: string; filename: (slug: string) => string }[] = [
  { id: 'apa', label: 'APA', filename: (s) => `${s}-apa.txt` },
  { id: 'mla', label: 'MLA', filename: (s) => `${s}-mla.txt` },
  { id: 'chicago', label: 'Chicago', filename: (s) => `${s}-chicago.txt` },
  { id: 'harvard', label: 'Harvard', filename: (s) => `${s}-harvard.txt` },
  { id: 'vancouver', label: 'Vancouver', filename: (s) => `${s}-vancouver.txt` },
  { id: 'ieee', label: 'IEEE', filename: (s) => `${s}-ieee.txt` },
  { id: 'plain', label: 'Plain text', filename: (s) => `${s}.txt` },
  { id: 'bibtex', label: 'BibTeX', filename: (s) => `${s}.bib` },
  { id: 'ris', label: 'RIS', filename: (s) => `${s}.ris` },
  { id: 'endnote', label: 'EndNote', filename: (s) => `${s}.enw` },
]

export function buildCitation(format: CitationFormat, article: Article, journal: JournalDetail): string {
  switch (format) {
    case 'apa':
      return apaCitation(article, journal)
    case 'mla':
      return mlaCitation(article, journal)
    case 'chicago':
      return chicagoCitation(article, journal)
    case 'harvard':
      return harvardCitation(article, journal)
    case 'vancouver':
      return vancouverCitation(article, journal)
    case 'ieee':
      return ieeeCitation(article, journal)
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

/** All formats at once, keyed by id — what the article page is handed. */
export const buildAllCitations = (article: Article, journal: JournalDetail): Record<CitationFormat, string> =>
  Object.fromEntries(citationFormats.map((f) => [f.id, buildCitation(f.id, article, journal)])) as Record<
    CitationFormat,
    string
  >
