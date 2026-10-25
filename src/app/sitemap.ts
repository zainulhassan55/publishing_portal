import type { MetadataRoute } from 'next'
import { getArticles, getNews } from '@/data/content'
import { policies } from '@/data/policies'
import { publishedVolumes } from '@/lib/books/volumes'
import { journals, series } from '@/data/registry'
import { siteUrl } from '@/lib/site'

/**
 * Audit finding F-08: there was no sitemap, and the one that mattered least —
 * the journal and series guidance pages — is exactly the long tail a
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
    { url: url('/series'), lastModified: built, changeFrequency: 'monthly', priority: 0.8 },
    { url: url('/authors'), lastModified: built, changeFrequency: 'monthly', priority: 0.8 },
    { url: url('/reviewers'), lastModified: built, changeFrequency: 'monthly', priority: 0.6 },
    { url: url('/editors'), lastModified: built, changeFrequency: 'monthly', priority: 0.6 },
    { url: url('/editors/special-issues'), lastModified: built, changeFrequency: 'monthly', priority: 0.5 },
    { url: url('/librarians'), lastModified: built, changeFrequency: 'monthly', priority: 0.5 },
    { url: url('/policies'), lastModified: built, changeFrequency: 'monthly', priority: 0.5 },
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
      url: url(`/journals/${journal.slug}/issues`),
      lastModified: built,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    ...(journal.pages ?? [])
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

  const seriesRoutes: MetadataRoute.Sitemap = series.flatMap((s) => [
    { url: url(`/series/${s.slug}`), lastModified: built, changeFrequency: 'monthly' as const, priority: 0.8 },
    ...s.pages.map((page) => ({
      url: url(`/series/${s.slug}/${page.id}`),
      lastModified: built,
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    })),
  ])

  const volumeRoutes: MetadataRoute.Sitemap = (await Promise.all(series.map((s) => publishedVolumes(s.slug)))).flat().map((v) => ({
    url: url(`/series/${v.seriesSlug}/volumes/${v.slug}`),
    lastModified: v.publishedAt ? new Date(v.publishedAt) : built,
    changeFrequency: 'yearly',
    priority: 0.8,
  }))

  const policyRoutes: MetadataRoute.Sitemap = policies.map((p) => ({
    url: url(`/policies/${p.slug}`),
    lastModified: new Date(p.updatedIso),
    changeFrequency: 'yearly',
    priority: 0.3,
  }))

  const newsRoutes: MetadataRoute.Sitemap = getNews().map((item) => ({
    url: url(`/news/${item.slug}`),
    lastModified: new Date(item.dateIso),
    changeFrequency: 'yearly',
    priority: 0.3,
  }))

  return [...staticRoutes, ...journalRoutes, ...articleRoutes, ...seriesRoutes, ...volumeRoutes, ...policyRoutes, ...newsRoutes]
}
