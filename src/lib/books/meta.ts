import type { Series } from '@/types/publishing'
import { absoluteUrl, doiUrl, licenceUrl, siteName, siteUrl } from '../site'
import type { BookVolume } from './volumes'

/**
 * Google Scholar tags and schema.org data for a book volume.
 *
 * Scholar reads `citation_*` tags from the server-rendered page (see
 * src/lib/citation-meta.ts for the article equivalent). For a book it wants
 * `citation_title`, one `citation_author` per author — or editors via
 * `citation_editor` — `citation_publisher`, `citation_publication_date`,
 * `citation_isbn`, and a `citation_pdf_url` on the site's own domain.
 */

const scholarDate = (iso: string) => iso.slice(0, 10).replace(/-/g, '/')

export const volumeUrl = (v: BookVolume) => `/series/${v.seriesSlug}/volumes/${v.slug}`

export function volumeCitationMeta(v: BookVolume, series: Series): Record<string, string | string[]> {
  const tags: Record<string, string | string[]> = {
    citation_title: v.subtitle ? `${v.title}: ${v.subtitle}` : v.title,
    citation_publisher: siteName,
    citation_series_title: series.title,
    citation_language: 'en',
    citation_abstract_html_url: absoluteUrl(volumeUrl(v)),
  }
  const authors = v.contributors.filter((c) => c.role === 'author').map((c) => c.name)
  const editors = v.contributors.filter((c) => c.role === 'editor').map((c) => c.name)
  if (authors.length) tags.citation_author = authors
  if (editors.length) tags.citation_editor = editors
  if (v.publishedAt) tags.citation_publication_date = scholarDate(v.publishedAt)
  const isbns = [v.isbnOnline, v.isbnPrint].filter((x): x is string => Boolean(x))
  if (isbns.length) tags.citation_isbn = isbns
  if (v.doi) tags.citation_doi = v.doi
  if (v.volumeNumber) tags.citation_volume = String(v.volumeNumber)
  if (v.pdfUploadId) tags.citation_pdf_url = absoluteUrl(`${volumeUrl(v)}/pdf`)
  if (v.keywords.length) tags.citation_keywords = v.keywords.join('; ')
  return tags
}

export function volumeJsonLd(v: BookVolume, series: Series): Record<string, unknown> {
  const person = (c: { name: string; affiliation: string }) => ({
    '@type': 'Person',
    name: c.name,
    ...(c.affiliation ? { affiliation: { '@type': 'Organization', name: c.affiliation } } : {}),
  })
  const isbn = v.isbnOnline ?? v.isbnPrint
  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    '@id': absoluteUrl(`${volumeUrl(v)}#book`),
    name: v.subtitle ? `${v.title}: ${v.subtitle}` : v.title,
    url: absoluteUrl(volumeUrl(v)),
    ...(v.abstract ? { abstract: v.abstract } : {}),
    ...(v.publishedAt ? { datePublished: v.publishedAt } : {}),
    ...(isbn ? { isbn } : {}),
    ...(v.doi ? { sameAs: doiUrl(v.doi) } : {}),
    ...(v.pages ? { numberOfPages: v.pages } : {}),
    author: v.contributors.filter((c) => c.role === 'author').map(person),
    editor: v.contributors.filter((c) => c.role === 'editor').map(person),
    publisher: { '@type': 'Organization', name: siteName, url: siteUrl },
    isPartOf: { '@type': 'BookSeries', name: series.title, url: absoluteUrl(`/series/${series.slug}`) },
    isAccessibleForFree: true,
    license: v.licence === 'CC BY 4.0' ? licenceUrl : v.licence,
    inLanguage: 'en',
    hasPart: v.chapters.map((c) => ({
      '@type': 'Chapter',
      name: c.title,
      position: c.seq,
      author: c.authors.map(person),
      ...(c.pageRange ? { pagination: c.pageRange } : {}),
      ...(c.doi ? { sameAs: doiUrl(c.doi) } : {}),
    })),
  }
}
