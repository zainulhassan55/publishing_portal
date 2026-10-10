import type { Metadata } from 'next'
import Link from 'next/link'
import { getNews } from '@/data/content'
import { formatDate } from '@/lib/format'

export const metadata: Metadata = {
  title: 'News and announcements',
  description:
    'Announcements from NextGenIQ Press: calls for papers, editorial appointments, policy updates and platform changes.',
  alternates: { canonical: '/news' },
}

export default function NewsPage() {
  const items = getNews()

  return (
    <div id="main-content" style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 32px 0' }}>
      <nav aria-label="Breadcrumb" style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--muted,#505C68)' }}>
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span style={{ color: 'var(--ink-2,#1F2A36)' }}>News</span>
      </nav>

      <div style={{ padding: '20px 0 24px', borderBottom: '1px solid var(--line,#DCE1E6)' }}>
        <span style={{ display: 'block', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted,#505C68)', fontWeight: 600 }}>News</span>
        <h1 style={{ margin: '6px 0 10px', fontFamily: 'var(--font-serif)', fontSize: 36, lineHeight: 1.15, fontWeight: 600, color: 'var(--ink,#101B27)', letterSpacing: '-.01em' }}>News and announcements</h1>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)', maxWidth: '68ch' }}>
          Calls for papers, editorial appointments, policy updates and changes to how the platform works.
        </p>
      </div>

      {items.length === 0 ? (
        <div style={{ maxWidth: 720, marginTop: 32, border: '1px solid var(--line,#DCE1E6)', borderRadius: 3, background: 'var(--surface,#fff)', padding: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 19, fontWeight: 600, color: 'var(--ink,#101B27)' }}>No announcements yet</h2>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)' }}>Announcements will appear here as they are published.</p>
        </div>
      ) : (
        <div style={{ maxWidth: 820, marginTop: 32, borderTop: '2px solid #101B27' }}>
          {items.map((item) => (
            <article key={item.slug} style={{ padding: '20px 0', borderBottom: '1px solid var(--line,#DCE1E6)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--muted,#505C68)' }}>
                <span style={{ fontWeight: 600, color: 'var(--warm,#B5400F)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{item.type}</span>
                {' · '}
                <time dateTime={item.dateIso}>{formatDate(item.dateIso)}</time>
              </span>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 20, lineHeight: 1.35, fontWeight: 600 }}>
                <Link href={`/news/${item.slug}`} style={{ color: 'var(--ink,#101B27)', textDecoration: 'none' }}>{item.title}</Link>
              </h2>
              {item.body?.[0] ? (
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)', maxWidth: '70ch' }}>{item.body[0]}</p>
              ) : null}
              <Link href={`/news/${item.slug}`} style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>Read the announcement →</Link>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
