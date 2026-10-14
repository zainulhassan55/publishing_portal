import { handler, jsonError, jsonOk } from '@/lib/api'
import { execute, query } from '@/lib/db'
import { requireAdminApi } from '@/lib/admin/guard'
import { recordAudit } from '@/lib/admin/audit'
import { readHarvest } from '@/lib/ojs/harvest-cache'
import { purgePublicContent } from '@/lib/articles/purge'

export const dynamic = 'force-dynamic'

/**
 * Shows a published paper on the portal, or holds it back.
 *
 * This is the portal half of publication and only that half. Whether a paper
 * is *published* is decided in OJS — galleys, issue, DOI, the Publish button —
 * and nothing here can publish or unpublish one. What this changes is whether
 * a paper OJS has already published appears on the portal website. Hiding it
 * removes it from the article page, the journal pages, the home page, search
 * and the sitemap on the next request; it remains readable in OJS, because the
 * portal never writes OJS and the paper is public there regardless.
 *
 * The id must be in the current harvest. A row for a paper the harvest has not
 * seen would be a decision about nothing, and most often means the paper was
 * published a minute ago and the scheduled harvest has not run yet.
 */

type Body = { hidden?: unknown; note?: unknown }

export const PATCH = handler(async (request) => {
  const auth = await requireAdminApi(request, { mutating: true })
  if (!auth.ok) return auth.response

  // The id is the last path segment. Read from the URL rather than the context
  // argument so this handler keeps the single-`request` shape `handler()` wraps.
  const id = decodeURIComponent(new URL(request.url).pathname.split('/').filter(Boolean).pop() ?? '')
  const article = readHarvest().articles.find((a) => a.id === id)
  if (!article) {
    return jsonError('not-found', 404, {
      message: 'That paper is not in the current harvest. If it was published just now, wait for the next harvest run.',
    })
  }

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return jsonError('validation', 422, { errors: [{ field: 'body', message: 'Request body must be valid JSON' }] })
  }

  if (typeof body.hidden !== 'boolean') {
    return jsonError('validation', 422, { errors: [{ field: 'hidden', message: 'hidden must be true or false' }] })
  }

  const hidden = body.hidden
  const note = typeof body.note === 'string' ? body.note.slice(0, 4000).trim() : ''
  const actor = auth.context.user
  const actorName = actor.fullName || actor.userName || null

  const [before] = await query<{ hidden: number; note: string | null }>(
    'SELECT hidden, note FROM article_display WHERE article_id = ?',
    [id],
  )

  // Explicit values in the UPDATE half rather than VALUES(): the same statement
  // then runs on MariaDB and on MySQL 8, which deprecates VALUES().
  await execute(
    `INSERT INTO article_display (article_id, journal_slug, hidden, note, updated_by, updated_by_name)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE journal_slug = ?, hidden = ?, note = ?, updated_by = ?, updated_by_name = ?`,
    [
      id, article.journalSlug, hidden ? 1 : 0, note || null, actor.id, actorName,
      article.journalSlug, hidden ? 1 : 0, note || null, actor.id, actorName,
    ],
  )

  await recordAudit({
    actor,
    action: 'article.display_changed',
    targetType: 'article',
    targetId: id,
    before: { hidden: Boolean(before?.hidden), note: before?.note ?? null },
    // The title and journal travel with the audit row because the harvest is
    // disposable: a year from now the id alone may name nothing.
    after: { hidden, note: note || null, title: article.title, journal: article.journalSlug },
    note: note || null,
    request,
  })

  // The decision takes effect on the next request to any public page.
  purgePublicContent()

  return jsonOk({ id, hidden, note: note || null })
})
