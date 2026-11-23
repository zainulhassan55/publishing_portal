import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ShopShell } from '@/components/cart/ShopShell'
import { registerHref, safeNext, signInHref } from '@/lib/auth/links'
import { getBuyer, shopGoogleEnabled } from '@/lib/shop/buyer'

export const metadata: Metadata = { title: 'Sign in to buy', robots: { index: false, follow: false } }

/**
 * The shop's sign-in page. Two ways in, kept separate:
 *
 *   - Continue with Google: for buying only. Not an OJS account.
 *   - The NextGenIQ Press (OJS) account, through the normal /sign-in page.
 *
 * Without Google configured this page is skipped and the reader goes straight
 * to /sign-in, as before.
 */
export default async function ShopSignInPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const params = await searchParams
  const next = safeNext(params.next, '/checkout')

  if (!shopGoogleEnabled()) redirect(signInHref(next))
  if (await getBuyer()) redirect(next)

  const card = { padding: '22px 24px', border: '1px solid var(--line,#DCE1E6)', borderRadius: 4, background: 'var(--surface,#fff)' } as const
  const muted = { margin: '8px 0 0', fontSize: 14, lineHeight: 1.55, color: 'var(--muted,#505C68)' } as const

  return (
    <ShopShell crumb="Sign in" title="Sign in to buy">
      <div style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {params.error === 'google' ? (
          <p role="alert" style={{ margin: 0, padding: '10px 14px', border: '1px solid #E8C4C4', background: '#FBF1F1', borderRadius: 3, fontSize: 14.5, color: '#A52A2A' }}>
            Google sign-in did not complete. Please try again, or sign in with a NextGenIQ Press account below.
          </p>
        ) : null}

        <section style={card}>
          <a
            href={`/api/shop/google/start?next=${encodeURIComponent(next)}`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '12px 16px', border: '1px solid var(--line-strong,#B9C1C9)', borderRadius: 3, background: '#fff', color: '#1F1F1F', fontSize: 16, fontWeight: 600, textDecoration: 'none' }}
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.2l7.9 6.2C12.5 13.6 17.8 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.8c4.3-4 6.9-9.9 6.9-17.2z" />
              <path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.2C1 16.6 0 20.2 0 24s1 7.4 2.7 10.8l7.9-6.2z" />
              <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.8c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.1-13.4-9.8l-7.9 6.2C6.6 42.6 14.6 48 24 48z" />
            </svg>
            Continue with Google
          </a>
          <p style={muted}>The quickest way to buy chapters and books. This sign-in is for the shop only. It does not create a journal account.</p>
        </section>

        <section style={card}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Have a NextGenIQ Press account?</h2>
          <p style={muted}>Authors, reviewers and editors can buy with the account they already use for the journals.</p>
          <p style={{ margin: '12px 0 0', fontSize: 15 }}>
            <Link href={signInHref(next)} style={{ fontWeight: 600 }}>
              Sign in with your account
            </Link>
            <span style={{ color: 'var(--muted,#505C68)' }}> · </span>
            <Link href={registerHref(next)}>Register</Link>
          </p>
        </section>
      </div>
    </ShopShell>
  )
}
