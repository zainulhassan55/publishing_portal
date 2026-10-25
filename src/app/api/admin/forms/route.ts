import { handler, jsonOk } from '@/lib/api'
import { requireAdminApi } from '@/lib/admin/guard'
import { listFormRecords } from '@/lib/forms/admin'

export const dynamic = 'force-dynamic'

/** Everything submitted through the editorial forms, newest first, with its attached files. */
export const GET = handler(async (request) => {
  const auth = await requireAdminApi(request)
  if (!auth.ok) return auth.response
  return jsonOk({ records: await listFormRecords() })
})
