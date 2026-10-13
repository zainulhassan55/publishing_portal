import { requireAdminPage } from '@/lib/admin/guard'
import { AdminProposals } from '@/components/admin/AdminProposals'

export const dynamic = 'force-dynamic'

/**
 * Server wrapper. Its only job is the guard and handing the CSRF token to the
 * client component — the token is derived from the session cookie, which is
 * httpOnly, so the browser cannot compute it for itself. See lib/auth/csrf.ts.
 */
export default async function AdminProposalsPage() {
  const { csrfToken } = await requireAdminPage()
  return <AdminProposals csrfToken={csrfToken} />
}
