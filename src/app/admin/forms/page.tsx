import { AdminForms } from '@/components/admin/AdminForms'
import { requireAdminPage } from '@/lib/admin/guard'

export const dynamic = 'force-dynamic'

/** Server wrapper: the guard, and the CSRF token the client component needs for decisions. */
export default async function AdminFormsPage() {
  const { csrfToken } = await requireAdminPage()
  return <AdminForms csrfToken={csrfToken} />
}
