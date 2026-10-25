import { handler, jsonError, jsonOk, readJson } from '@/lib/api'
import { recordAudit } from '@/lib/admin/audit'
import { requireAdminApi } from '@/lib/admin/guard'
import { purgePublicContent } from '@/lib/articles/purge'
import { ensureAttached, parseChapter } from '@/lib/books/input'
import { createChapter, updateChapter, volumeById } from '@/lib/books/volumes'

export const dynamic = 'force-dynamic'

/** Adds a chapter to a volume. */
export const POST = handler(async (request) => {
  const auth = await requireAdminApi(request, { mutating: true })
  if (!auth.ok) return auth.response

  // …/volumes/{id}/chapters
  const segments = new URL(request.url).pathname.split('/').filter(Boolean)
  const volumeId = Number(segments[segments.length - 2])
  const volume = Number.isInteger(volumeId) ? await volumeById(volumeId) : undefined
  if (!volume) return jsonError('not-found', 404)

  const input = parseChapter(await readJson<Record<string, unknown>>(request), volumeId)
  const id = await createChapter({ ...input, pdfUploadId: null })
  if (input.pdfUploadId) {
    await ensureAttached(input.pdfUploadId, 'final_pdf', 'pdfUploadId', 'book_chapter', id, `volumes/${volume.seriesSlug}/${volume.slug}/chapters`)
    await updateChapter(id, input)
  }

  await recordAudit({ actor: auth.context.user, action: 'chapter.changed', targetType: 'book_chapter', targetId: id, after: input, note: 'created', request })
  purgePublicContent()
  return jsonOk({ id }, 201)
})
