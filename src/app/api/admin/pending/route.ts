import { handler, jsonOk } from '@/lib/api'
import { requireAdminApi } from '@/lib/admin/guard'
import { pendingCounts } from '@/lib/admin/pending'

export const dynamic = 'force-dynamic'

/** New-submission counts for the admin nav, which polls this. */
export const GET = handler(async (request) => {
  const auth = await requireAdminApi(request)
  if (!auth.ok) return auth.response
  return jsonOk({ counts: await pendingCounts() })
})
