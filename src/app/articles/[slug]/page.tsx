import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArticlePage as ArticleMockupPage, type ArticleCitations } from '@/components/mockup/ArticlePage'
import { JsonLd } from '@/components/seo/JsonLd'
import { getArticle, getArticles } from '@/data/content'
import { getJournal, journalCode } from '@/data/registry'
import { articleCitationMeta, dublinCoreMeta } from '@/lib/citation-meta'
import { buildCitation } from '@/lib/citation'
import { authorsShort, formatDate } from '@/lib/format'
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/jsonld'
import { absoluteUrl, siteName } from '@/lib/site'

/**
 * The full-text article view.
 *
 * Audit finding F-01: the previous client-rendered implementation emitted no
 * server HTML, so Google Scholar — which neither runs JavaScript nor reads
 * JSON-LD — could not index a single article. Everything an indexer needs (the
 * `citation_*` tags, the abstract, the full text, the reference list) is
 * therefore produced here at build time. The page body is the replicated
 * mockup component (src/components/mockup/ArticlePage.tsx), which still
 * server-renders its HTML into the static output.
 */

export const dynamicParams = true

export function generateStaticParams() {
  // Empty in production until the first manuscript is accepted and harvested
  // from OJS. An empty list is a valid build, not a failure.
  return getArticles().map((article) => ({ slug: article.slug }))
}

const truncate = (text: string, max: number) => {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const boundary = cut.lastIndexOf(' ')
  return `${cut.slice(0, boundary > max * 0.6 ? boundary : max).trimEnd()}…`
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const article = getArticle(slug)
  const journal = article ? getJournal(article.journalSlug) : undefined

  if (!article || !journal) {
    return { title: 'Article not found', robots: { index: false, follow: false } }
  }

  // Scholar reads repeated <meta name="citation_author"> tags, so a name that
  // occurs more than once has to become an array rather than overwrite.
  const other: Record<string, string | string[]> = {}
  for (const tag of [...articleCitationMeta(article, journal), ...dublinCoreMeta(article, journal)]) {
    const existing = other[tag.name]
    if (existing === undefined) other[tag.name] = tag.content
    else other[tag.name] = Array.isArray(existing) ? [...existing, tag.content] : [existing, tag.content]
  }

  const description = truncate(article.abstract, 300)
  const path = `/articles/${article.slug}`

  return {
    title: article.title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'article',
      title: article.title,
      description,
      url: absoluteUrl(path),
      siteName,
      locale: 'en_GB',
      publishedTime: article.publishedIso,
      authors: article.authors.map((author) => author.name),
      tags: article.keywords,
    },
    other,
  }
}

export default async function ArticleRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = getArticle(slug)
  if (!article) notFound()

  const journal = getJournal(article.journalSlug)
  if (!journal) notFound()

  const code = journalCode(journal)
  const path = `/articles/${article.slug}`

  const trail = [
    { label: 'Home', href: '/' },
    { label: code, href: `/journals/${journal.slug}` },
    { label: `Volume ${article.volume}, Issue ${article.issue}`, href: `/journals/${journal.slug}/issues` },
  ]

  const citations: ArticleCitations = {
    bibtex: buildCitation('bibtex', article, journal),
    ris: buildCitation('ris', article, journal),
    endnote: buildCitation('endnote', article, journal),
    plain: buildCitation('plain', article, journal),
  }

  // The mockup's related rail: the next three articles across the portfolio.
  const related = getArticles()
    .filter((other) => other.id !== article.id)
    .slice(0, 3)
    .map((other) => {
      const otherJournal = getJournal(other.journalSlug)
      return {
        href: `/articles/${other.slug}`,
        title: other.title,
        authorLine: authorsShort(other.authors.map((author) => author.name)),
        code: otherJournal ? journalCode(otherJournal) : other.journalSlug.toUpperCase(),
        date: formatDate(other.publishedIso),
      }
    })

  return (
    <>
      <JsonLd data={articleJsonLd(article, journal)} />
      <JsonLd data={breadcrumbJsonLd([...trail, { label: article.title, href: path }])} />
      <ArticleMockupPage
        article={article}
        journalTitle={journal.title}
        journalSlug={journal.slug}
        citations={citations}
        related={related}
      />
    </>
  )
}
