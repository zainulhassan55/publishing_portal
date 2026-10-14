import type { Article, CallForPapers, Issue, NewsItem } from '@/types/publishing'
import { readHarvest } from '@/lib/ojs/harvest-cache'
import { hiddenArticleIds, withoutHidden } from '@/lib/articles/display'
import { demoArticles, demoIssues } from './demo-articles'
import { demoThematicCalls, standingCalls } from './cfps'
import { news as curatedNews } from './news'

/**
 * Content resolution.
 *
 * Harvested OJS content is the only thing served by default. The fixture
 * articles, issues and thematic calls (the same records as the mockups' data.js)
 * are **opt-in**: set NEXT_PUBLIC_DEMO_CONTENT=1 for local development and
 * design review, and never in production.
 *
 * This default is deliberately fail-safe. It used to be `!== '0'`, which meant
 * any environment that simply forgot the variable published invented articles,
 * issues and calls for papers under a real publisher's name — the same class of
 * credibility failure as audit finding F-03, and one missing env var away.
 * Opt-in means the worst case is an empty site, which every listing page
 * already renders a launch-state message for.
 *
 * ## Why the article readers are async
 *
 * A published paper can be held back from the site by an administrator
 * (`article_display`, migration 004). That set lives in the database, so
 * `getArticles()` and everything derived from it await it. Issues, calls and
 * news have no gate and stay synchronous. The fixtures are not gated either:
 * they are not real papers, and the admin screen lists the harvest only.
 */
export const demoContentEnabled = process.env.NEXT_PUBLIC_DEMO_CONTENT === '1'

export async function getArticles(): Promise<Article[]> {
  const harvested = readHarvest().articles
  if (demoContentEnabled && harvested.length === 0) return demoArticles
  return withoutHidden(harvested, await hiddenArticleIds())
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

export { demoArticles }
