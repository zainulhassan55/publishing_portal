import { requireAdminPage } from '@/lib/admin/guard'
import { AdminActivity } from '@/components/admin/AdminActivity'

export const dynamic = 'force-dynamic'

/**
 * The audit log, read.
 *
 * Deliberately shipped in the same pass as the first screen that writes to it.
 * An audit table nothing displays is an audit table nobody checks, and the
 * first time it matters is the worst time to discover it was never readable.
 */
export default async function AdminActivityPage() {
  await requireAdminPage()
  return <AdminActivity />
}
