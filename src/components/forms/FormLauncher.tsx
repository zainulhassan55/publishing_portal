'use client'

import Link from 'next/link'
import { useSession } from '@/components/auth/SessionProvider'
import { registerHref, signInHref } from '@/lib/auth/links'

/**
 * Stands where a form used to be embedded. Forms open on their own page, and
 * only for signed-in members, so content pages carry this button instead.
 *
 * Signed out, the button goes to sign-in and returns to the form. While the
 * session is still loading it links straight to the form, whose page checks
 * the session on the server and redirects if needed, so a slow session fetch
 * never strands anyone.
 */
export function FormLauncher({
  id,
  href,
  title,
  description,
  label = 'Fill the form',
}: {
  id?: string
  href: string
  title: string
  description: string
  label?: string
}) {
  const { user, loading } = useSession()
  const signedOut = !loading && !user

  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-h` : undefined}
      style={{ scrollMarginTop: 24, border: '1px solid var(--line,#DCE1E6)', borderTop: '3px solid var(--accent,#1D5DA8)', borderRadius: 3, background: 'var(--surface,#fff)', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      <h2 id={id ? `${id}-h` : undefined} style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 600, color: 'var(--ink,#101B27)' }}>
        {title}
      </h2>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)', maxWidth: '66ch' }}>{description}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginTop: 4 }}>
        <Link
          href={signedOut ? signInHref(href) : href}
          style={{ background: 'var(--accent,#1D5DA8)', color: '#fff', padding: '10px 18px', borderRadius: 3, fontSize: 15, fontWeight: 500, textDecoration: 'none' }}
        >
          {signedOut ? `Sign in to ${label.charAt(0).toLowerCase()}${label.slice(1)}` : label}
        </Link>
        {signedOut ? (
          <span style={{ fontSize: 14, color: 'var(--ink-3,#3C4854)' }}>
            No account? <Link href={registerHref(href)}>Create one</Link>
          </span>
        ) : null}
      </div>
    </section>
  )
}
