import Link from 'next/link'
import type { ReactNode } from 'react'

/** Page frame shared by /cart and /checkout: breadcrumb, heading, and the phone layout for the order summary. */
export function ShopShell({ crumb, title, children }: { crumb: string; title: string; children: ReactNode }) {
  return (
    <div id="main-content" style={{ maxWidth: 1280, margin: '0 auto', padding: '20px var(--shell-pad) 56px' }}>
      <style>{`@media (max-width:900px){.co-wrap{flex-direction:column!important}.co-summary{position:static!important;flex:1 1 auto!important;width:100%}}`}</style>
      <nav aria-label="Breadcrumb" style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--muted,#505C68)' }}>
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/series">Book series</Link>
        <span aria-hidden="true">/</span>
        <span style={{ color: 'var(--ink-2,#1F2A36)' }}>{crumb}</span>
      </nav>
      <h1 style={{ margin: '18px 0 24px', fontFamily: 'var(--font-serif)', fontSize: 34, fontWeight: 600, color: 'var(--ink,#101B27)' }}>{title}</h1>
      {children}
    </div>
  )
}
