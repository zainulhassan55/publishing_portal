import Link from 'next/link'
import { requireAdminPage } from '@/lib/admin/guard'
import { journalCode, journals, periodicalBase } from '@/data/registry'
import { ojsEditorialUrl, ojsHandoffUrl, ojsUrl } from '@/lib/ojs/config'
import { ojsContext } from '@/lib/ojs/contexts'

export const dynamic = 'force-dynamic'

/**
 * The journal list, with a door into each journal's editorial system.
 *
 * OJS keys everything by the journal's path, and the administrator was typing
 * that path into the URL bar by hand to reach a journal — ten slugs to
 * remember, and an easy place for a typo to land on the wrong journal's
 * settings. Each row here is the journal's own set of OJS entry points, built
 * from the same registry the public pages use, so a journal added there
 * appears here without anyone remembering to.
 *
 * Every OJS link goes through the hand-off route. That is what carries the
 * portal session into OJS: a plain link would open the OJS login form, and the
 * whole point of the panel is to stop sending the administrator there.
 */

const OJS_PAGES = [
  { label: 'Editorial queue', path: (slug: string) => ojsEditorialUrl(slug) },
  { label: 'Users & roles', path: (slug: string) => ojsUrl(ojsContext(slug), '/management/settings/access') },
  { label: 'Journal settings', path: (slug: string) => ojsUrl(ojsContext(slug), '/management/settings/context') },
  { label: 'Issues', path: (slug: string) => ojsUrl(ojsContext(slug), '/manageIssues') },
] as const

const cell: React.CSSProperties = {
  padding: '12px 14px',
  borderBottom: '1px solid var(--line,#DCE1E6)',
  fontSize: 13,
  verticalAlign: 'top',
  textAlign: 'left',
}

const headCell: React.CSSProperties = {
  ...cell,
  fontWeight: 600,
  color: 'var(--ink-2,#1F2A36)',
  borderBottom: '1px solid var(--line-strong,#B9C1C9)',
  whiteSpace: 'nowrap',
}

const chip: React.CSSProperties = {
  display: 'inline-block',
  padding: '5px 10px',
  border: '1px solid var(--line,#DCE1E6)',
  borderRadius: 3,
  fontSize: 12,
  color: 'var(--ink-2,#1F2A36)',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
}

export default async function AdminJournals() {
  await requireAdminPage()

  return (
    <section>
      <h2 style={{ margin: '0 0 6px', fontSize: 18, color: 'var(--ink,#101B27)' }}>Journals</h2>
      <p style={{ margin: '0 0 18px', fontSize: 13, color: 'var(--muted,#505C68)', lineHeight: 1.5 }}>
        Every journal in the portfolio, with its editorial system pages one click away. The journal name opens its
        editorial queue in OJS; you arrive signed in.
      </p>

      <div style={{ overflowX: 'auto', background: 'var(--surface,#fff)', border: '1px solid var(--line,#DCE1E6)', borderRadius: 4 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={headCell}>Journal</th>
              <th style={headCell}>Code</th>
              <th style={headCell}>Editorial system</th>
              <th style={headCell}>Portal</th>
            </tr>
          </thead>
          <tbody>
            {journals.map((journal) => (
              <tr key={journal.slug}>
                <td style={cell}>
                  <a
                    href={ojsHandoffUrl(ojsEditorialUrl(journal.slug))}
                    style={{ fontWeight: 600, color: 'var(--ink,#101B27)' }}
                    title={`Open ${journalCode(journal)} in the editorial system`}
                  >
                    {journal.title}
                  </a>
                  <div style={{ fontSize: 12, color: 'var(--muted,#505C68)', marginTop: 3 }}>
                    /ojs/index.php/{ojsContext(journal.slug)} · ISSN {journal.eIssn || journal.issn || '—'}
                  </div>
                </td>
                <td style={{ ...cell, whiteSpace: 'nowrap' }}>{journalCode(journal)}</td>
                <td style={cell}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {OJS_PAGES.map((page) => (
                      <a key={page.label} href={ojsHandoffUrl(page.path(journal.slug))} style={chip}>
                        {page.label}
                      </a>
                    ))}
                  </div>
                </td>
                <td style={{ ...cell, whiteSpace: 'nowrap' }}>
                  <Link href={periodicalBase(journal.slug)} style={{ fontSize: 13 }}>
                    Public page
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
