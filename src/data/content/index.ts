import type { Article, CallForPapers, Issue, NewsItem } from '@/types/publishing'
import { readHarvest } from '@/lib/ojs/harvest-cache'
import { hiddenArticleIds, withoutHidden } from '@/lib/articles/display'
import { standingCalls } from './cfps'
import { news as curatedNews } from './news'
import { journalSlugs } from '../registry'

/**
 * Content resolution: harvested OJS content only.
 *
 * The site used to carry fixture articles, issues and calls (the mockups'
 * data.js) behind NEXT_PUBLIC_DEMO_CONTENT. They were removed in October 2026:
 * the publisher has no published articles yet, and invented records under a
 * real publisher's name are a credibility failure (audit finding F-03) one
 * environment variable away. Every listing renders its empty state instead.
 *
 * ## Why the article readers are async
 *
 * A published paper can be held back from the site by an administrator
 * (`article_display`, migration 004). That set lives in the database, so
 * `getArticles()` and everything derived from it await it. Issues, calls and
 * news have no gate and stay synchronous.
 */

/**
 * OJS still hosts journals that are no longer in the portfolio. Their records
 * stay in the harvest (the admin screen lists them) but are not served: an
 * article whose journal has no page here would link to a 404.
 */
const inPortfolio = <T extends { journalSlug: string }>(items: T[]) => items.filter((i) => journalSlugs.includes(i.journalSlug))

export async function getArticles(): Promise<Article[]> {
  return withoutHidden(inPortfolio(readHarvest().articles), await hiddenArticleIds())
}

export function getIssues(): Issue[] {
  return inPortfolio(readHarvest().issues)
}

export function getCalls(): CallForPapers[] {
  return standingCalls
}

export function getNews(): NewsItem[] {
  return curatedNews
}

/* ------------------------------ derived views ----------------------------- */

export const getArticle = async (slug: string) => (await getArticles()).find((a) => a.slug === slug)

export const getArticleById = async (id: string) => (await getArticles()).find((a) => a.id === id)

/** The mockups link articles by id (`Article.dc.html?id=a1`); routes use slugs. */
export const articleHrefById = async (id: string) => {
  const article = await getArticleById(id)
  return article ? `/articles/${article.slug}` : '/search?tab=articles'
}

export const articlesForJournal = async (journalSlug: string) =>
  (await getArticles())
    .filter((a) => a.journalSlug === journalSlug)
    .sort((a, b) => b.publishedIso.localeCompare(a.publishedIso))

export const latestArticles = async (limit = 9) =>
  [...(await getArticles())].sort((a, b) => b.publishedIso.localeCompare(a.publishedIso)).slice(0, limit)

export const mostDownloaded = async (limit = 9) =>
  [...(await getArticles())].sort((a, b) => (b.metrics?.downloads ?? 0) - (a.metrics?.downloads ?? 0)).slice(0, limit)

export const mostCited = async (limit = 9) =>
  [...(await getArticles())].sort((a, b) => (b.metrics?.citations ?? 0) - (a.metrics?.citations ?? 0)).slice(0, limit)

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
export const portfolioStats = async () => {
  const articles = await getArticles()
  return {
    articles: articles.length,
    downloads: articles.reduce((sum, a) => sum + (a.metrics?.downloads ?? 0), 0),
    citations: articles.reduce((sum, a) => sum + (a.metrics?.citations ?? 0), 0),
    countries: new Set(articles.flatMap((a) => a.affiliations.map((af) => af.country).filter(Boolean))).size,
  }
}

