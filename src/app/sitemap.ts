import type { MetadataRoute } from 'next'
import { getArticles, getNews } from '@/data/content'
import { journals, series } from '@/data/registry'
import { siteUrl } from '@/lib/site'

/**
 * Audit finding F-08: there was no sitemap, and the one that mattered least —
 * the journal guidance pages, 22 per journal — is exactly the long tail a
 * crawler needs help finding.
 *
 * Priorities are relative within this site, not absolute quality claims:
 * articles and journal homes are what we want indexed first, boilerplate
 * policy pages last.
 */
/**
 * Refreshed on the server rather than fixed at build. Published papers reach
 * this page through the scheduled harvest and the admin show/hide gate, both of
 * which purge the page cache (src/lib/articles/purge.ts); the hour here is the
 * safety net for when that purge is missed, not the normal delay.
 */
export const revalidate = 3600
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = (path: string) => `${siteUrl}${path}`
  const articles = await getArticles()

  // Build date rather than `new Date()` scattered through the entries, so every
  // static entry shares one coherent timestamp.
  const built = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: url('/'), lastModified: built, changeFrequency: 'weekly', priority: 1 },
    { url: url('/journals'), lastModified: built, changeFrequency: 'weekly', priority: 0.9 },
    { url: url('/authors'), lastModified: built, changeFrequency: 'monthly', priority: 0.8 },
    { url: url('/about'), lastModified: built, changeFrequency: 'yearly', priority: 0.5 },
    { url: url('/contact'), lastModified: built, changeFrequency: 'yearly', priority: 0.4 },
    { url: url('/news'), lastModified: built, changeFrequency: 'weekly', priority: 0.5 },
    { url: url('/indexing'), lastModified: built, changeFrequency: 'monthly', priority: 0.4 },
    { url: url('/propose-journal'), lastModified: built, changeFrequency: 'yearly', priority: 0.4 },
  ]

  const journalRoutes: MetadataRoute.Sitemap = journals.flatMap((journal) => [
    {
      url: url(`/journals/${journal.slug}`),
      lastModified: built,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: url(`/journals/${journal.slug}/current-issue`),
      lastModified: built,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: url(`/journals/${journal.slug}/issues`),
      lastModified: built,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    ...(journal.pages ?? [])
      .filter((page) => page.id !== 'current-issue')
      .map((page) => ({
        url: url(`/journals/${journal.slug}/${page.id}`),
        lastModified: built,
        changeFrequency: 'monthly' as const,
        priority: 0.4,
      })),
  ])

  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: url(`/articles/${article.slug}`),
    lastModified: new Date(article.publishedIso),
    changeFrequency: 'yearly',
    priority: 0.8,
  }))

  const seriesRoutes: MetadataRoute.Sitemap = series.map((s) => ({
    url: url(`/series/${s.slug}`),
    lastModified: built,
    changeFrequency: 'monthly',
    priority: 0.5,
  }))

  const newsRoutes: MetadataRoute.Sitemap = getNews().map((item) => ({
    url: url(`/news/${item.slug}`),
    lastModified: new Date(item.dateIso),
    changeFrequency: 'yearly',
    priority: 0.3,
  }))

  return [...staticRoutes, ...journalRoutes, ...articleRoutes, ...seriesRoutes, ...newsRoutes]
}
