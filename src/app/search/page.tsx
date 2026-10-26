import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SearchPage as SearchMockupPage, type ArticleExtras } from '@/components/mockup/SearchPage'
import { getArticles } from '@/data/content'
import { buildSearchIndex } from '@/lib/search'

export const metadata: Metadata = {
  title: 'Search',
  description:
    'Search articles, journal scopes and author guidance across the NextGenIQ Press portfolio by title, author, keyword or DOI.',
  alternates: { canonical: '/search' },
  // A results page has no stable content of its own and would compete with the
  // article and journal pages it links to, so it is deliberately not indexed.
  robots: { index: false, follow: true },
}

/**
 * Faceted search.
 *
 * The index is built at build time from the same data the pages render and
 * shipped to the browser as one prop, so this page is static HTML and every
 * facet click, tab switch and sort change is local state with no round trip.
 * There is no search service to run, back up or keep in sync.
 */
/**
 * Refreshed on the server rather than fixed at build. Published papers reach
 * this page through the scheduled harvest and the admin show/hide gate, both of
 * which purge the page cache (src/lib/articles/purge.ts); the hour here is the
 * safety net for when that purge is missed, not the normal delay.
 */
export const revalidate = 3600
export default async function SearchRoute() {
  const index = await buildSearchIndex()

  // Volume/issue/pages and the PDF link render in each result row but are not
  // part of the search index, so they travel alongside it keyed by article id.
  const extras: ArticleExtras = {}
  for (const article of await getArticles()) {
    extras[article.id] = {
      vol: article.volume,
      issue: article.issue,
      pages: article.pages,
      pdfHref: article.pdfHref,
    }
  }

  return (
    <Suspense fallback={<p style={{ maxWidth: 1280, margin: '0 auto', padding: '40px var(--shell-pad)', fontSize: 15, color: 'var(--muted, #505C68)' }}>Loading search…</p>}>
      <SearchMockupPage index={index} extras={extras} />
    </Suspense>
  )
}
