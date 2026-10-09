import type { Article, CallForPapers, Issue, NewsItem } from '@/types/publishing'
import { readHarvest } from '@/lib/ojs/harvest-cache'
import { demoArticles, demoIssues } from './demo-articles'
import { demoThematicCalls, standingCalls } from './cfps'
import { news as curatedNews } from './news'

/**
 * Content resolution.
 *
 * The site runs populated by default: the fixture articles, issues and
 * thematic calls (the same records as the mockups' data.js) are served on
 * every surface, merged with anything the OJS harvest has picked up. Real
 * harvested articles take precedence and will displace the fixtures as OJS
 * content accumulates.
 *
 * Set NEXT_PUBLIC_DEMO_CONTENT=0 to run from the OJS harvest alone (the
 * launch/empty state every listing page also supports).
 */
export const demoContentEnabled = process.env.NEXT_PUBLIC_DEMO_CONTENT !== '0'

export function getArticles(): Article[] {
  const harvested = readHarvest().articles
  if (!demoContentEnabled) return harvested
  return harvested.length > 0 ? harvested : demoArticles
}

export function getIssues(): Issue[] {
  const harvested = readHarvest().issues
  if (!demoContentEnabled) return harvested
  return harvested.length > 0 ? harvested : (demoIssues as Issue[])
}

export function getCalls(): CallForPapers[] {
  return demoContentEnabled ? [...demoThematicCalls, ...standingCalls] : standingCalls
}

export function getNews(): NewsItem[] {
  return curatedNews
}

/* ------------------------------ derived views ----------------------------- */

export const getArticle = (slug: string) => getArticles().find((a) => a.slug === slug)

export const getArticleById = (id: string) => getArticles().find((a) => a.id === id)

/** The mockups link articles by id (`Article.dc.html?id=a1`); routes use slugs. */
export const articleHrefById = (id: string) => {
  const article = getArticleById(id)
  return article ? `/articles/${article.slug}` : '/search?tab=articles'
}

export const articlesForJournal = (journalSlug: string) =>
  getArticles()
    .filter((a) => a.journalSlug === journalSlug)
    .sort((a, b) => b.publishedIso.localeCompare(a.publishedIso))

export const latestArticles = (limit = 9) =>
  [...getArticles()].sort((a, b) => b.publishedIso.localeCompare(a.publishedIso)).slice(0, limit)

export const mostDownloaded = (limit = 9) =>
  [...getArticles()].sort((a, b) => (b.metrics?.downloads ?? 0) - (a.metrics?.downloads ?? 0)).slice(0, limit)

export const mostCited = (limit = 9) =>
  [...getArticles()].sort((a, b) => (b.metrics?.citations ?? 0) - (a.metrics?.citations ?? 0)).slice(0, limit)

export const currentIssue = (journalSlug: string) =>
  getIssues().find((i) => i.journalSlug === journalSlug && i.current) ??
  getIssues()
    .filter((i) => i.journalSlug === journalSlug)
    .sort((a, b) => b.volume - a.volume || b.number - a.number)[0]

export const issueArchive = (journalSlug: string) =>
  getIssues()
    .filter((i) => i.journalSlug === journalSlug)
    .sort((a, b) => b.volume - a.volume || b.number - a.number)

export const callsForJournal = (journalSlug: string) => getCalls().filter((c) => c.journalSlug === journalSlug)

/** Aggregate counts used by the homepage metric strip and journal insights. */
export const portfolioStats = () => {
  const articles = getArticles()
  return {
    articles: articles.length,
    downloads: articles.reduce((sum, a) => sum + (a.metrics?.downloads ?? 0), 0),
    citations: articles.reduce((sum, a) => sum + (a.metrics?.citations ?? 0), 0),
    countries: new Set(articles.flatMap((a) => a.affiliations.map((af) => af.country).filter(Boolean))).size,
  }
}

export { demoArticles }
