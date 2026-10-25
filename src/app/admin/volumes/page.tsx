import { AdminVolumes } from '@/components/admin/AdminVolumes'
import { series } from '@/data/registry'
import { requireAdminPage } from '@/lib/admin/guard'

export const dynamic = 'force-dynamic'

/** Server wrapper: the guard, the CSRF token for saves, and the series to choose from. */
export default async function AdminVolumesPage() {
  const { csrfToken } = await requireAdminPage()
  return <AdminVolumes csrfToken={csrfToken} series={series.map((s) => ({ value: s.slug, label: `${s.code} · ${s.title}` }))} />
}
