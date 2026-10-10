import type { JournalDetail } from '@/types/content'
import type { Article } from '@/types/publishing'
import { electronicIssn } from '@/data/issn'
import { absoluteUrl, siteName } from './site'

/**
 * Google Scholar citation meta tags.
 *
 * Scholar does not read JSON-LD and does not execute JavaScript; it reads these
 * `citation_*` tags from server-rendered HTML. Audit finding F-01 was that the
 * client-only SPA emitted none of them, so no article could ever be indexed.
 * Every article page must render these, which is why article routes are
 * statically generated rather than client-fetched.
 *
 * Tag names and repetition rules follow Scholar's inclusion guidelines: one
 * `citation_author` per author in list order, dates as YYYY/MM/DD.
 */
export type MetaTag = { name: string; content: string }

const scholarDate = (iso: string) => iso.slice(0, 10).replace(/-/g, '/')

export function articleCitationMeta(article: Article, journal: JournalDetail): MetaTag[] {
  const tags: MetaTag[] = [
    { name: 'citation_title', content: article.title },
    { name: 'citation_journal_title', content: journal.title },
    { name: 'citation_publisher', content: siteName },
    { name: 'citation_publication_date', content: scholarDate(article.publishedIso) },
    { name: 'citation_online_date', content: scholarDate(article.publishedIso) },
    { name: 'citation_volume', content: String(article.volume) },
    { name: 'citation_issue', content: String(article.issue) },
    { name: 'citation_doi', content: article.doi },
    { name: 'citation_abstract_html_url', content: absoluteUrl(`/articles/${article.slug}`) },
    { name: 'citation_language', content: 'en' },
    { name: 'citation_article_type', content: article.type },
  ]

  for (const author of article.authors) {
    tags.push({ name: 'citation_author', content: author.name })
    for (const id of author.affiliationIds) {
      const affiliation = article.affiliations.find((a) => a.id === id)
      if (affiliation) tags.push({ name: 'citation_author_institution', content: affiliation.name })
    }
    if (author.orcid) tags.push({ name: 'citation_author_orcid', content: `https://orcid.org/${author.orcid}` })
  }

  const eissn = electronicIssn(journal.slug)
  if (eissn) tags.push({ name: 'citation_issn', content: eissn })

  if (article.pages) {
    const [first, last] = article.pages.split('–')
    if (first) tags.push({ name: 'citation_firstpage', content: first })
    if (last) tags.push({ name: 'citation_lastpage', content: last })
  }

  if (article.pdfHref) {
    tags.push({ name: 'citation_pdf_url', content: absoluteUrl(article.pdfHref) })
  }

  for (const keyword of article.keywords) {
    tags.push({ name: 'citation_keywords', content: keyword })
  }

  return tags
}

/** Dublin Core, which several aggregators prefer over the Scholar tags. */
export function dublinCoreMeta(article: Article, journal: JournalDetail): MetaTag[] {
  return [
    { name: 'DC.title', content: article.title },
    { name: 'DC.type', content: article.type },
    { name: 'DC.date', content: article.publishedIso },
    { name: 'DC.publisher', content: siteName },
    { name: 'DC.source', content: journal.title },
    { name: 'DC.identifier', content: `doi:${article.doi}` },
    { name: 'DC.language', content: 'en' },
    { name: 'DC.rights', content: article.licence },
    { name: 'DC.description', content: article.abstract },
    ...article.authors.map((a) => ({ name: 'DC.creator', content: a.name })),
    ...article.keywords.map((k) => ({ name: 'DC.subject', content: k })),
  ]
}
