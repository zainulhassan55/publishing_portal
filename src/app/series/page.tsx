import type { Metadata } from 'next'
import Link from 'next/link'
import { series, seriesPageHref } from '@/data/registry'
import { subjects } from '@/data/subjects'

export const metadata: Metadata = {
  title: 'Book series',
  description:
    'Open-access, peer-reviewed book series from NextGenIQ Press publishing research monographs, edited volumes and conference proceedings.',
  alternates: { canonical: '/series' },
}

export default function SeriesIndex() {
  return (
    <div id="main-content" style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 32px 0' }}>
      <nav aria-label="Breadcrumb" style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--muted,#505C68)' }}>
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span style={{ color: 'var(--ink-2,#1F2A36)' }}>Book series</span>
      </nav>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '20px 0 24px', borderBottom: '1px solid var(--line,#DCE1E6)' }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 38, fontWeight: 600, color: 'var(--ink,#101B27)', letterSpacing: '-.01em' }}>Book series</h1>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)', maxWidth: '66ch' }}>
          Our book series publish research monographs, edited volumes, and conference proceedings. Every volume is peer reviewed and freely available online under CC BY 4.0. Proposals are welcome throughout the year.
        </p>
      </div>

      {series.map((s) => {
        const subject = subjects[s.subjectKey]
        return (
          <section key={s.slug} aria-labelledby={`series-${s.slug}`} style={{ display: 'grid', gridTemplateColumns: '96px minmax(0,1fr)', gap: 24, padding: '28px 0', borderBottom: '1px solid var(--line,#DCE1E6)' }}>
            <Link
              href={`/series/${s.slug}`}
              tabIndex={-1}
              aria-hidden="true"
              style={{ width: 96, height: 128, background: 'var(--brand,#0F2B46)', borderTop: `4px solid ${subject.color}`, borderRadius: 2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 9, boxSizing: 'border-box', textDecoration: 'none' }}
            >
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 600, color: '#fff' }}>{s.code}</span>
              <span style={{ fontSize: 7, lineHeight: 1.3, color: '#C3CFDB' }}>{s.title}</span>
            </Link>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
              <span style={{ fontSize: 12, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-3,#3C4854)' }}>{s.profile.kicker}</span>
              <h2 id={`series-${s.slug}`} style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, lineHeight: 1.25 }}>
                <Link href={`/series/${s.slug}`} style={{ color: 'var(--ink,#101B27)' }}>
                  {s.title}
                </Link>
              </h2>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)', maxWidth: '75ch' }}>{s.scope}</p>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--muted,#505C68)' }}>
                {s.profile.editorsLabel}: {s.profile.editors.map((e) => e.name).join(', ')}
              </p>
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 14, fontWeight: 500, marginTop: 4 }}>
                <Link href={`/series/${s.slug}`}>Series home</Link>
                <Link href={seriesPageHref(s.slug, 'propose-volume')}>Propose a volume</Link>
                <Link href={seriesPageHref(s.slug, 'volumes')}>Published volumes</Link>
              </div>
            </div>
          </section>
        )
      })}
    </div>
  )
}
