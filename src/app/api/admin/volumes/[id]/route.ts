import { handler, jsonError, jsonOk, readJson } from '@/lib/api'
import { recordAudit } from '@/lib/admin/audit'
import { requireAdminApi } from '@/lib/admin/guard'
import { purgePublicContent } from '@/lib/articles/purge'
import { ensureAttached, parseVolume } from '@/lib/books/input'
import { deleteVolume, updateVolume, volumeById } from '@/lib/books/volumes'

export const dynamic = 'force-dynamic'

const idOf = (request: Request) => Number(new URL(request.url).pathname.split('/').filter(Boolean).pop())

/** Saves every field of a volume, including publishing (a publication date) and hiding. */
export const PATCH = handler(async (request) => {
  const auth = await requireAdminApi(request, { mutating: true })
  if (!auth.ok) return auth.response

  const id = idOf(request)
  const before = Number.isInteger(id) ? await volumeById(id) : undefined
  if (!before) return jsonError('not-found', 404)

  const input = parseVolume(await readJson<Record<string, unknown>>(request))
  const prefix = `volumes/${input.seriesSlug}/${input.slug}`
  await ensureAttached(input.pdfUploadId, 'final_pdf', 'pdfUploadId', 'book_volume', id, prefix)
  await ensureAttached(input.coverUploadId, 'cover', 'coverUploadId', 'book_volume', id, prefix)

  try {
    await updateVolume(id, input)
  } catch (error) {
    if (error instanceof Error && /Duplicate entry/.test(error.message)) {
      return jsonError('validation', 422, { errors: [{ field: 'slug', message: 'Another volume in this series already uses that URL segment' }] })
    }
    throw error
  }

  const { chapters: _chapters, ...beforeState } = before
  await recordAudit({ actor: auth.context.user, action: 'volume.changed', targetType: 'book_volume', targetId: id, before: beforeState, after: input, request })
  purgePublicContent()
  return jsonOk({ id })
})

/** Deletes a volume and its chapters. Its files stay in storage, recorded in `uploads`. */
export const DELETE = handler(async (request) => {
  const auth = await requireAdminApi(request, { mutating: true })
  if (!auth.ok) return auth.response

  const id = idOf(request)
  const before = Number.isInteger(id) ? await volumeById(id) : undefined
  if (!before) return jsonError('not-found', 404)

  await deleteVolume(id)
  await recordAudit({ actor: auth.context.user, action: 'volume.changed', targetType: 'book_volume', targetId: id, before, note: 'deleted', request })
  purgePublicContent()
  return jsonOk({ deleted: id })
})
