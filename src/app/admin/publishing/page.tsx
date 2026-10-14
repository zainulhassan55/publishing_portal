import { requireAdminPage } from '@/lib/admin/guard'
import { AdminPublishing } from '@/components/admin/AdminPublishing'

export const dynamic = 'force-dynamic'

/**
 * The publish-to-public gate (docs/ADMIN-PANEL-PLAN.md, Phase 4).
 *
 * Two different decisions are easy to collapse here, so the page keeps them
 * apart by what it offers. *Publishing* — galleys, issue, DOI — is OJS's and
 * happens in OJS; this page never offers it. *Displaying* a published paper on
 * the portal is the publisher's, and this page is where it is made. A paper
 * listed here is already public in OJS; the switch decides whether the portal
 * website shows it too.
 */
export default async function AdminPublishingPage() {
  const { csrfToken } = await requireAdminPage()
  return (
    <section>
      <h2 style={{ margin: '0 0 6px', fontSize: 18, color: 'var(--ink,#101B27)' }}>Published papers</h2>
      <p style={{ margin: '0 0 18px', fontSize: 13, color: 'var(--muted,#505C68)', lineHeight: 1.5 }}>
        Everything OJS has published, and whether the portal website is showing it. Papers are shown by default and
        appear here within fifteen minutes of their issue being published in OJS.
      </p>
      <AdminPublishing csrfToken={csrfToken} />
    </section>
  )
}
