import { handler, jsonOk, readJson } from '@/lib/api'
import { requireAdminApi } from '@/lib/admin/guard'
import { isPurpose } from '@/lib/uploads/policy'
import { createPendingUpload } from '@/lib/uploads/service'
import { ValidationError } from '@/lib/validate'

export const dynamic = 'force-dynamic'

type Body = { purpose?: string; filename?: string; contentType?: string; size?: number }

/**
 * Admin counterpart of /api/uploads/sign, for the files that get published:
 * a volume or chapter PDF and a volume cover. They go to the publications
 * bucket, which readers reach only through the portal's own routes.
 */
export const POST = handler(async (request) => {
  const auth = await requireAdminApi(request, { mutating: true })
  if (!auth.ok) return auth.response

  const body = await readJson<Body>(request)
  if (body.purpose !== 'final_pdf' && body.purpose !== 'cover') {
    throw new ValidationError([{ field: 'purpose', message: 'Unknown upload purpose' }])
  }
  if (!isPurpose(body.purpose)) throw new ValidationError([{ field: 'purpose', message: 'Unknown upload purpose' }])

  const upload = await createPendingUpload(
    body.purpose,
    typeof body.filename === 'string' ? body.filename : '',
    typeof body.contentType === 'string' ? body.contentType : '',
    typeof body.size === 'number' ? body.size : 0,
    'publications',
  )
  return jsonOk(upload, 201)
})
