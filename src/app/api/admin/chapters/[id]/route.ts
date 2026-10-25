import { handler, jsonError, jsonOk, readJson } from '@/lib/api'
import { recordAudit } from '@/lib/admin/audit'
import { requireAdminApi } from '@/lib/admin/guard'
import { purgePublicContent } from '@/lib/articles/purge'
import { ensureAttached, parseChapter } from '@/lib/books/input'
import { chapterById, deleteChapter, updateChapter, volumeById } from '@/lib/books/volumes'

export const dynamic = 'force-dynamic'

const idOf = (request: Request) => Number(new URL(request.url).pathname.split('/').filter(Boolean).pop())

export const PATCH = handler(async (request) => {
  const auth = await requireAdminApi(request, { mutating: true })
  if (!auth.ok) return auth.response

  const id = idOf(request)
  const before = Number.isInteger(id) ? await chapterById(id) : undefined
  if (!before) return jsonError('not-found', 404)
  const volume = await volumeById(before.volumeId)

  const input = parseChapter(await readJson<Record<string, unknown>>(request), before.volumeId)
  await ensureAttached(input.pdfUploadId, 'final_pdf', 'pdfUploadId', 'book_chapter', id, `volumes/${volume.seriesSlug}/${volume.slug}/chapters`)
  await updateChapter(id, input)

  await recordAudit({ actor: auth.context.user, action: 'chapter.changed', targetType: 'book_chapter', targetId: id, before, after: input, request })
  purgePublicContent()
  return jsonOk({ id })
})

export const DELETE = handler(async (request) => {
  const auth = await requireAdminApi(request, { mutating: true })
  if (!auth.ok) return auth.response

  const id = idOf(request)
  const before = Number.isInteger(id) ? await chapterById(id) : undefined
  if (!before) return jsonError('not-found', 404)

  await deleteChapter(id)
  await recordAudit({ actor: auth.context.user, action: 'chapter.changed', targetType: 'book_chapter', targetId: id, before, note: 'deleted', request })
  purgePublicContent()
  return jsonOk({ deleted: id })
})
