import { handler, jsonOk } from '@/lib/api'
import { databaseConfigured, query } from '@/lib/db'
import { requireAdminApi } from '@/lib/admin/guard'
import { readHarvest } from '@/lib/ojs/harvest-cache'
import { getJournal, journalCode } from '@/data/registry'

export const dynamic = 'force-dynamic'

/**
 * Every paper OJS has published, with whether the portal is showing it.
 *
 * The list is the harvest snapshot, read directly rather than through
 * `getArticles()`: that reader applies the gate, and an administrator deciding
 * what to hide needs to see the hidden ones. Nothing here talks to OJS — a
 * paper appears when the scheduled harvest has seen it published, which is why
 * `harvestedAt` is returned: "it is not in the list yet" is answered by the
 * time of the last run, not by a refresh button.
 *
 * `submissionId` is recovered from the harvest id (`ojs-<id>`) so each row can
 * link into the paper's workflow in OJS through the sign-on hand-off.
 */

type DisplayRow = {
  article_id: string
  hidden: number
  note: string | null
  updated_by_name: string | null
  updated_at: Date
}

export const GET = handler(async (request) => {
  const auth = await requireAdminApi(request)
  if (!auth.ok) return auth.response

  const harvest = readHarvest()

  // Without a database there is no gate, and the honest answer is "everything
  // is shown", which is also what the public pages do in that state.
  const rows = databaseConfigured
    ? await query<DisplayRow>('SELECT article_id, hidden, note, updated_by_name, updated_at FROM article_display')
    : []
  const display = new Map(rows.map((row) => [row.article_id, row]))

  const articles = harvest.articles
    .map((article) => {
      const journal = getJournal(article.journalSlug)
      const row = display.get(article.id)
      const submissionId = Number(article.id.replace(/^ojs-/, ''))
      return {
        id: article.id,
        slug: article.slug,
        title: article.title,
        journalSlug: article.journalSlug,
        journalCode: journal ? journalCode(journal) : article.journalSlug.toUpperCase(),
        journalTitle: journal?.title ?? article.journalSlug,
        authors: article.authors.map((author) => author.name),
        publishedIso: article.publishedIso,
        volume: article.volume,
        issue: article.issue,
        doi: article.doi,
        hasPdf: Boolean(article.pdfHref),
        submissionId: Number.isInteger(submissionId) && submissionId > 0 ? submissionId : null,
        hidden: Boolean(row?.hidden),
        note: row?.note ?? null,
        updatedBy: row?.updated_by_name ?? null,
        updatedAtIso: row ? new Date(row.updated_at).toISOString() : null,
      }
    })
    // Newest first: the paper just published is the one the administrator came
    // to look at.
    .sort((a, b) => b.publishedIso.localeCompare(a.publishedIso))

  return jsonOk({ harvestedAt: harvest.harvestedAt, gate: databaseConfigured ? 'active' : 'unavailable', articles })
})
