import { handler, jsonError } from '@/lib/api'
import { recordAudit } from '@/lib/admin/audit'
import { requireAdminApi } from '@/lib/admin/guard'
import { presignDownload } from '@/lib/storage'
import { getUpload } from '@/lib/uploads/service'

export const dynamic = 'force-dynamic'

/**
 * Downloads a submitted file. Redirects to a five-minute signed link rather
 * than streaming through the server, and records who downloaded what: CVs and
 * unpublished manuscripts are personal and confidential material.
 */
export const GET = handler(async (request) => {
  const auth = await requireAdminApi(request)
  if (!auth.ok) return auth.response

  const id = new URL(request.url).pathname.split('/').filter(Boolean).pop() ?? ''
  const upload = /^[0-9a-f-]{36}$/.test(id) ? await getUpload(id) : undefined
  if (!upload || upload.status !== 'attached') return jsonError('not-found', 404)

  const url = await presignDownload(upload.bucket, upload.storage_key, upload.original_name)

  await recordAudit({
    actor: auth.context.user,
    action: 'upload.downloaded',
    targetType: 'upload',
    targetId: upload.id,
    after: { owner_type: upload.owner_type, owner_id: upload.owner_id, name: upload.original_name },
    request,
  })

  return new Response(null, { status: 302, headers: { Location: url, 'Cache-Control': 'no-store' } })
})
