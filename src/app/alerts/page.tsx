import type { Metadata } from 'next'
import Link from 'next/link'
import { editorialEmail } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Email alerts',
  description: 'Confirmation page for NextGenIQ Press email alert subscriptions.',
  robots: { index: false, follow: false },
}

/**
 * Landing page for the double-opt-in confirmation link. The four states mirror
 * what /api/alerts/confirm can redirect with. "Already confirmed" and "unknown
 * token" are reported the same way deliberately, so the endpoint cannot be used
 * to probe which tokens are valid.
 */
const states = {
  confirmed: {
    title: 'Your alerts are confirmed',
    body: 'You will receive an email when a new issue is published or a call for papers opens. Every message includes a one-click unsubscribe link.',
    tone: 'ok' as const,
  },
  already: {
    title: 'Nothing more to do',
    body: 'That link has already been used, or it has expired. If you are not receiving alerts you expected, sign up again from the author hub and we will send a fresh confirmation.',
    tone: 'info' as const,
  },
  invalid: {
    title: 'That link is not valid',
    body: 'The confirmation link was incomplete. Sign up again from the author hub and we will send a new one.',
    tone: 'warn' as const,
  },
  error: {
    title: 'We could not confirm that just now',
    body: `Something went wrong on our side, not yours. Try the link again in a few minutes, or write to ${editorialEmail}.`,
    tone: 'warn' as const,
  },
}

/** The mockups' status palette: success green, caution amber, neutral surface. */
const tones = {
  ok: { border: '#B9DCC4', background: '#E7F3EB', heading: '#1E6B3A' },
  warn: { border: '#EBCB98', background: '#FDF1DE', heading: '#8A5300' },
  info: { border: 'var(--line,#DCE1E6)', background: 'var(--surface,#fff)', heading: 'var(--ink,#101B27)' },
}

export default async function AlertsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams
  const state = states[(status as keyof typeof states) ?? 'invalid'] ?? states.invalid
  const tone = tones[state.tone]

  return (
    <div id="main-content" style={{ maxWidth: 1280, margin: '0 auto', padding: '20px var(--shell-pad) 0' }}>
      <nav aria-label="Breadcrumb" style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--muted,#505C68)' }}>
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span style={{ color: 'var(--ink-2,#1F2A36)' }}>Email alerts</span>
      </nav>

      <div style={{ maxWidth: 680, marginTop: 24, border: `1px solid ${tone.border}`, background: tone.background, borderRadius: 3, padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted,#505C68)', fontWeight: 600 }}>Email alerts</span>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 28, lineHeight: 1.2, fontWeight: 600, color: tone.heading, letterSpacing: '-.01em' }}>{state.title}</h1>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: 'var(--ink-2,#1F2A36)', maxWidth: '68ch' }}>{state.body}</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
          <Link href="/authors#alerts" style={{ border: '1px solid var(--line-strong,#B9C1C9)', background: 'var(--surface,#fff)', color: 'var(--ink,#101B27)', padding: '9px 18px', borderRadius: 3, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Manage alerts</Link>
          <Link href="/journals" style={{ border: '1px solid var(--line-strong,#B9C1C9)', background: 'var(--surface,#fff)', color: 'var(--ink,#101B27)', padding: '9px 18px', borderRadius: 3, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Browse journals</Link>
        </div>
      </div>
    </div>
  )
}
