import { requireAdminPage } from '@/lib/admin/guard'
import { AdminSubmissions } from '@/components/admin/AdminSubmissions'
import { journalCode, journals } from '@/data/registry'

export const dynamic = 'force-dynamic'

/**
 * Every submission, every journal, one table.
 *
 * The thing OJS genuinely cannot do. OJS is per-journal by design, so overseeing
 * ten journals today means opening ten dashboards and holding the comparison in
 * your head. This is the only screen in the panel that exists because of a gap
 * rather than a preference.
 *
 * Read-only, and that is the whole design. Assigning reviewers, recording
 * decisions and moving stages all happen in OJS — see docs/ADMIN-PANEL-PLAN.md
 * §1 — so every row links into the OJS editorial workflow through the sign-on
 * hand-off. A row here answers *where does this stand*; OJS answers *what next*.
 */
export default async function AdminSubmissionsPage() {
  await requireAdminPage()

  return (
    <AdminSubmissions
      journals={journals.map((journal) => ({
        slug: journal.slug,
        code: journalCode(journal),
        title: journal.title,
      }))}
    />
  )
}
