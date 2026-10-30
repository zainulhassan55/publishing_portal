import Link from 'next/link'
import { journals } from '@/data/registry'
import { journalCode, periodicalBase } from '@/data/registry'

/**
 * Audit finding F-08: every unknown URL returned HTTP 200 and soft-redirected
 * to the homepage. That told crawlers the page existed and told readers
 * nothing. This returns a real 404 and offers somewhere useful to go.
 */
export default function NotFound() {
  return (
    <>
      <style>{`.nf-journal:hover{color:var(--accent,#1D5DA8)}`}</style>
      <div id="main-content" style={{ maxWidth: 1280, margin: '0 auto', padding: '20px var(--shell-pad) 0' }}>
        <nav aria-label="Breadcrumb" style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--muted,#505C68)' }}>
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span style={{ color: 'var(--ink-2,#1F2A36)' }}>Page not found</span>
        </nav>

        <div style={{ maxWidth: 720, padding: '24px 0 0' }}>
          <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted,#505C68)', fontWeight: 500 }}>Error 404</span>
          <h1 style={{ margin: '8px 0 12px', fontFamily: 'var(--font-serif)', fontSize: 36, lineHeight: 1.15, fontWeight: 600, color: 'var(--ink,#101B27)', letterSpacing: '-.01em' }}>That page does not exist</h1>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.7, color: 'var(--ink-2,#1F2A36)', maxWidth: '70ch', textWrap: 'pretty' }}>
            The address may be mistyped, or the page may have moved. If you arrived from a citation or a link elsewhere,
            the editorial office would like to know — a broken link to an article is a problem we should fix.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
            <Link href="/search" style={{ background: 'var(--accent,#1D5DA8)', color: '#fff', padding: '10px 18px', borderRadius: 3, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Search the site</Link>
            <Link href="/journals" style={{ border: '1px solid var(--line-strong,#B9C1C9)', color: 'var(--ink,#101B27)', padding: '9px 18px', borderRadius: 3, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Browse journals</Link>
            <Link href="/contact" style={{ border: '1px solid var(--line-strong,#B9C1C9)', color: 'var(--ink,#101B27)', padding: '9px 18px', borderRadius: 3, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Report a broken link</Link>
          </div>
        </div>

        <nav aria-label="Journals" style={{ marginTop: 48, borderTop: '1px solid var(--line,#DCE1E6)', paddingTop: 20 }}>
          <span style={{ display: 'block', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted,#505C68)', fontWeight: 600, marginBottom: 8 }}>Journals</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', columnGap: 32 }}>
            {journals.map((journal) => (
              <Link key={journal.slug} href={periodicalBase(journal.slug)} className="nf-journal" style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--line,#DCE1E6)', fontSize: 14, lineHeight: 1.45, color: 'var(--ink,#101B27)', textDecoration: 'none' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted,#505C68)', flexShrink: 0, width: 48 }}>{journalCode(journal)}</span>
                {journal.title}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </>
  )
}
