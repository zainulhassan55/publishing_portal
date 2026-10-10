import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Article not found',
  robots: { index: false, follow: true },
}

/**
 * Audit finding F-04: every unknown URL returned HTTP 200 and soft-redirected
 * to the homepage, so a mistyped DOI link looked like a working page and search
 * engines indexed duplicates of the homepage. This renders a real 404.
 */
export default function ArticleNotFound() {
  return (
    <div id="main-content" style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 32px 0' }}>
      <nav aria-label="Breadcrumb" style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--muted,#505C68)', flexWrap: 'wrap' }}>
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/search?tab=articles">Articles</Link>
        <span aria-hidden="true">/</span>
        <span style={{ color: 'var(--ink-2,#1F2A36)' }}>Not found</span>
      </nav>

      <div style={{ maxWidth: 680, marginTop: 24, border: '1px solid var(--line,#DCE1E6)', borderRadius: 3, background: 'var(--surface,#fff)', padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted,#505C68)', fontWeight: 500 }}>Error 404</span>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 28, lineHeight: 1.2, fontWeight: 600, color: 'var(--ink,#101B27)', letterSpacing: '-.01em' }}>We could not find that article</h1>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: 'var(--ink-2,#1F2A36)', maxWidth: '68ch' }}>
          The link may be mistyped, or the article may not have been published yet. Articles appear here on the day
          the version of record is released.
        </p>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: 'var(--ink-3,#3C4854)', maxWidth: '68ch' }}>
          If you followed a DOI, try resolving it again at doi.org — it always points at the current location of the
          version of record.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
          <Link href="/search" style={{ background: 'var(--accent,#1D5DA8)', color: '#fff', padding: '9px 16px', borderRadius: 3, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Search all content</Link>
          <Link href="/journals" style={{ border: '1px solid var(--line-strong,#B9C1C9)', color: 'var(--ink,#101B27)', padding: '8px 16px', borderRadius: 3, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Browse the journals</Link>
        </div>
      </div>
    </div>
  )
}
