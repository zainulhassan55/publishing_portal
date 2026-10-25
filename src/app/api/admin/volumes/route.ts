import { handler, jsonError, jsonOk, readJson } from '@/lib/api'
import { recordAudit } from '@/lib/admin/audit'
import { requireAdminApi } from '@/lib/admin/guard'
import { purgePublicContent } from '@/lib/articles/purge'
import { ensureAttached, parseVolume } from '@/lib/books/input'
import { allVolumes, createVolume, updateVolume } from '@/lib/books/volumes'

export const dynamic = 'force-dynamic'

export const GET = handler(async (request) => {
  const auth = await requireAdminApi(request)
  if (!auth.ok) return auth.response
  return jsonOk({ volumes: await allVolumes() })
})

/** Creates a volume. Files referenced by it are verified and moved under the volume. */
export const POST = handler(async (request) => {
  const auth = await requireAdminApi(request, { mutating: true })
  if (!auth.ok) return auth.response

  const input = parseVolume(await readJson<Record<string, unknown>>(request))
  let id: number
  try {
    id = await createVolume({ ...input, pdfUploadId: null, coverUploadId: null })
  } catch (error) {
    if (error instanceof Error && /Duplicate entry/.test(error.message)) {
      return jsonError('validation', 422, { errors: [{ field: 'slug', message: 'Another volume in this series already uses that URL segment' }] })
    }
    throw error
  }

  const prefix = `volumes/${input.seriesSlug}/${input.slug}`
  await ensureAttached(input.pdfUploadId, 'final_pdf', 'pdfUploadId', 'book_volume', id, prefix)
  await ensureAttached(input.coverUploadId, 'cover', 'coverUploadId', 'book_volume', id, prefix)
  if (input.pdfUploadId || input.coverUploadId) await updateVolume(id, input)

  await recordAudit({ actor: auth.context.user, action: 'volume.changed', targetType: 'book_volume', targetId: id, after: input, note: 'created', request })
  purgePublicContent()
  return jsonOk({ id }, 201)
})
