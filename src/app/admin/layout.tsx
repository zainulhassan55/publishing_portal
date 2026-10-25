import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdminPage } from '@/lib/admin/guard'

export const metadata: Metadata = {
  title: 'Administration',
  // Belt and braces with the guard: the panel is already a 404 to anyone
  // without the role, and nothing here should ever be followed or indexed even
  // if a URL leaks into a referrer header.
  robots: { index: false, follow: false },
}

/**
 * The admin shell.
 *
 * Deliberately a **layout** rather than a check repeated per page: the guard
 * runs once for every route beneath `/admin`, so a page added later is
 * protected by existing — nobody has to remember. Pages still call
 * `requireAdminPage()` themselves when they need the user or the CSRF token,
 * which is cheap (one session read, already cached per request).
 *
 * `force-dynamic` because the guard reads cookies. Without it Next would try to
 * statically render the panel at build time, where there is no session, and the
 * whole thing would prerender as a 404.
 */
export const dynamic = 'force-dynamic'

const NAV = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/journals', label: 'Journals' },
  { href: '/admin/publishing', label: 'Published papers' },
  { href: '/admin/proposals', label: 'Journal proposals' },
  { href: '/admin/forms', label: 'Editorial forms' },
  { href: '/admin/volumes', label: 'Book volumes' },
  { href: '/admin/submissions', label: 'All submissions' },
  { href: '/admin/activity', label: 'Activity' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdminPage()

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 32px 100px' }}>
      <header
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
          borderBottom: '1px solid var(--line,#DCE1E6)',
          paddingBottom: 14,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 24, lineHeight: 1.2, color: 'var(--ink,#101B27)' }}>Administration</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted,#505C68)' }}>
            Signed in as {user.fullName} · site administrator
          </p>
        </div>
        <Link href="/dashboard" style={{ fontSize: 13 }}>
          Back to my submissions
        </Link>
      </header>

      <nav
        aria-label="Administration"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 4, margin: '14px 0 24px' }}
      >
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              padding: '7px 12px',
              borderRadius: 3,
              border: '1px solid var(--line,#DCE1E6)',
              fontSize: 13,
              color: 'var(--ink-2,#1F2A36)',
              textDecoration: 'none',
            }}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  )
}
