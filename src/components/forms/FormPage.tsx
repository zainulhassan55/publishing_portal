import Link from 'next/link'
import type { ReactNode } from 'react'
import type { SessionUser } from '@/lib/auth/session'

/**
 * The page a form opens on. Every form has one of these instead of sitting
 * inside a content page; the content page links here with FormLauncher.
 */
export function FormPage({
  trail,
  kicker,
  title,
  intro,
  back,
  user,
  children,
}: {
  /** Breadcrumb after "Home"; the form itself is appended as the last entry. */
  trail: { label: string; href: string }[]
  kicker: string
  title: string
  intro?: ReactNode
  /** The guidance page this form belongs to. */
  back: { label: string; href: string }
  user: SessionUser
  children: ReactNode
}) {
  return (
    <div id="main-content" className="fkPage" style={{ maxWidth: 860, margin: '0 auto', padding: '20px var(--shell-pad) 0' }}>
      {/* Phones: 16px controls so iOS does not zoom on focus, 44px tap targets, and a full-width submit button. */}
      <style>{`@media (max-width:760px){.fkPage h1{font-size:28px!important}.fkPage input:not([type=checkbox]):not([type=radio]),.fkPage select,.fkPage textarea{font-size:16px!important}.fkPage input:not([type=checkbox]):not([type=radio]):not([type=file]),.fkPage select{min-height:44px}.fkPage input[type=checkbox]{width:18px;height:18px;flex-shrink:0;margin-top:2px!important}.fkPage form button[type=submit]{width:100%;min-height:46px;margin-top:0!important}}`}</style>
      <nav aria-label="Breadcrumb" style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--muted,#505C68)', flexWrap: 'wrap' }}>
        <Link href="/">Home</Link>
        {trail.map((t) => (
          <span key={t.href} style={{ display: 'contents' }}>
            <span aria-hidden="true">/</span>
            <Link href={t.href}>{t.label}</Link>
          </span>
        ))}
        <span aria-hidden="true">/</span>
        <span style={{ color: 'var(--ink-2,#1F2A36)' }}>Form</span>
      </nav>

      <div style={{ padding: '20px 0 24px', borderBottom: '1px solid var(--line,#DCE1E6)', marginBottom: 28 }}>
        <span style={{ display: 'block', fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted,#505C68)', fontWeight: 500 }}>{kicker}</span>
        <h1 style={{ margin: '6px 0 10px', fontFamily: 'var(--font-serif)', fontSize: 34, lineHeight: 1.15, fontWeight: 600, color: 'var(--ink,#101B27)', letterSpacing: '-.01em' }}>{title}</h1>
        {intro ? <div style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)', maxWidth: '68ch' }}>{intro}</div> : null}
        <p style={{ margin: '12px 0 0', fontSize: 14, color: 'var(--ink-3,#3C4854)' }}>
          Signed in as <strong style={{ fontWeight: 600 }}>{user.fullName || user.userName}</strong>. Fields marked * are required. Read the{' '}
          <Link href={back.href}>{back.label}</Link> before you start.
        </p>
      </div>

      {children}
    </div>
  )
}

/** Form pages hold personal data entry and are reachable only when signed in; none of them is for search engines. */
export const formPageRobots = { index: false, follow: false } as const
