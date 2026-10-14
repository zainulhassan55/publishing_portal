import { databaseConfigured, query } from '../db/index.ts'

/**
 * The publish-to-public gate, read side.
 *
 * OJS decides what is published; `article_display` (migration 004) decides
 * what the portal shows. The default mirrors OJS — a paper with no row, or a
 * row with hidden = 0, is shown — so this module only ever needs the set of
 * ids an administrator has held back.
 *
 * ## Why it never throws
 *
 * The harvest snapshot was designed so a page render never depends on the
 * database being up, and the gate keeps that property: if the read fails, the
 * last successfully read set is used, and if there has never been one, nothing
 * is hidden. That is fail-open by choice. A hidden paper reappearing for the
 * length of a database outage is a smaller harm than every article and journal
 * page on the site answering 500 for the same outage — and the paper is public
 * in OJS regardless, so what is briefly exposed is already published, not
 * secret. It logs loudly so the outage is not silent.
 *
 * ## The build
 *
 * `next build` runs on a developer's machine with no database (the deploy
 * script builds locally and uploads). During the build phase the set is empty,
 * which is honest — the build cannot know — and the deploy script purges the
 * page cache once the release is live so the first real render re-reads it.
 */

const TTL_MS = 5_000

let memo: { ids: Set<string>; at: number } | null = null
let lastGood: Set<string> | null = null

const EMPTY = new Set<string>()

const inBuild = () => process.env.NEXT_PHASE === 'phase-production-build'

export async function hiddenArticleIds(): Promise<Set<string>> {
  if (inBuild() || !databaseConfigured) return EMPTY

  const now = Date.now()
  if (memo && now - memo.at < TTL_MS) return memo.ids

  try {
    const rows = await query<{ article_id: string }>('SELECT article_id FROM article_display WHERE hidden = 1')
    const ids = new Set(rows.map((row) => row.article_id))
    memo = { ids, at: now }
    lastGood = ids
    return ids
  } catch (error) {
    console.error('[display] could not read article_display; using the last known set:', error)
    return lastGood ?? EMPTY
  }
}

/** Forces the next read to hit the database; the admin toggle calls this. */
export const resetDisplayCache = () => {
  memo = null
}

/** Pure filter, split out so the rule is testable without a database. */
export function withoutHidden<T extends { id: string }>(articles: T[], hidden: Set<string>): T[] {
  if (hidden.size === 0) return articles
  return articles.filter((article) => !hidden.has(article.id))
}
