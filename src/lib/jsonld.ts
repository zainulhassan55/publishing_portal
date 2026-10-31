import type { JournalDetail } from '@/types/content'
import type { Article } from '@/types/publishing'
import { electronicIssn, printIssn } from '@/data/issn'
import { journalCode, periodicalBase } from '@/data/registry'
import { absoluteUrl, doiUrl, licenceUrl, siteDescription, siteName, siteUrl } from './site'

type JsonLdObject = Record<string, unknown>

/** The full stacked logo. Google asks for at least 112×112; this is 614×640. */
const logo = absoluteUrl('/brand/logo.png')

const publisher = {
  '@type': 'Organization',
  name: siteName,
  url: siteUrl,
  logo,
}

export const organizationJsonLd = (): JsonLdObject => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${siteUrl}/#organization`,
  name: siteName,
  alternateName: 'NGIQ Press',
  url: siteUrl,
  description: siteDescription,
  email: 'contact@nextgeniqpress.com',
  logo,
})

export const websiteJsonLd = (): JsonLdObject => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${siteUrl}/#website`,
  name: siteName,
  url: siteUrl,
  publisher: { '@id': `${siteUrl}/#organization` },
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${siteUrl}/search?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
})

export function journalJsonLd(journal: JournalDetail): JsonLdObject {
  const eissn = electronicIssn(journal.slug)
  const pissn = printIssn(journal.slug)
  const issn = [pissn, eissn].filter(Boolean)

  return {
    '@context': 'https://schema.org',
    '@type': 'Periodical',
    '@id': absoluteUrl(`${periodicalBase(journal.slug)}#periodical`),
    name: journal.title,
    alternateName: journalCode(journal),
    url: absoluteUrl(periodicalBase(journal.slug)),
    description: journal.scope,
    inLanguage: 'en',
    publisher,
    // Omitted entirely while registration is pending rather than emitted as a
    // placeholder: a wrong ISSN in structured data is worse than none.
    ...(issn.length ? { issn } : {}),
  }
}

export function articleJsonLd(article: Article, journal: JournalDetail): JsonLdObject {
  const affiliationName = (ids: string[]) =>
    ids
      .map((id) => article.affiliations.find((a) => a.id === id)?.name)
      .filter(Boolean)
      .join('; ')

  return {
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    '@id': absoluteUrl(`/articles/${article.slug}`),
    headline: article.title,
    name: article.title,
    url: absoluteUrl(`/articles/${article.slug}`),
    datePublished: article.publishedIso,
    ...(article.acceptedIso ? { dateCreated: article.acceptedIso } : {}),
    abstract: article.abstract,
    keywords: article.keywords.join(', '),
    inLanguage: 'en',
    isAccessibleForFree: true,
    license: licenceUrl,
    sameAs: doiUrl(article.doi),
    identifier: [{ '@type': 'PropertyValue', propertyID: 'DOI', value: article.doi }],
    author: article.authors.map((a) => ({
      '@type': 'Person',
      name: a.name,
      ...(a.orcid ? { identifier: `https://orcid.org/${a.orcid}`, sameAs: `https://orcid.org/${a.orcid}` } : {}),
      ...(a.affiliationIds.length
        ? { affiliation: { '@type': 'Organization', name: affiliationName(a.affiliationIds) } }
        : {}),
    })),
    publisher,
    isPartOf: {
      '@type': 'PublicationIssue',
      issueNumber: article.issue,
      datePublished: article.publishedIso,
      isPartOf: {
        '@type': 'PublicationVolume',
        volumeNumber: article.volume,
        isPartOf: journalJsonLd(journal),
      },
    },
    ...(article.pages
      ? {
          pageStart: article.pages.split('–')[0],
          pageEnd: article.pages.split('–')[1] ?? article.pages.split('–')[0],
        }
      : {}),
  }
}

export function breadcrumbJsonLd(trail: { label: string; href: string }[]): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      item: absoluteUrl(item.href),
    })),
  }
}

export function faqJsonLd(items: { question: string; answer: string }[]): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }
}
