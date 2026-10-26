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
    <div id="main-content" style={{ maxWidth: 1280, margin: '0 auto', padding: '20px var(--shell-pad) 0' }}>
      <style>{`@media (max-width:760px){.srs-row{grid-template-columns:64px minmax(0,1fr)!important;gap:8px 14px!important}.srs-row>.srs-cover{width:64px!important;height:86px!important;padding:6px!important;grid-row:1/span 2}.srs-row>.srs-cover>span:first-child{font-size:13px!important}.srs-row>.srs-cover>span:last-child{font-size:5px!important}.srs-body{display:contents!important}.srs-body>*{grid-column:2}.srs-body>.srs-wide{grid-column:1/-1}.srs-body h2{font-size:20px!important}}`}</style>
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
          <section key={s.slug} aria-labelledby={`series-${s.slug}`} className="srs-row" style={{ display: 'grid', gridTemplateColumns: '96px minmax(0,1fr)', gap: 24, padding: '28px 0', borderBottom: '1px solid var(--line,#DCE1E6)' }}>
            <Link
              href={`/series/${s.slug}`}
              tabIndex={-1}
              aria-hidden="true"
              className="srs-cover"
              style={{ width: 96, height: 128, background: 'var(--brand,#0F2B46)', borderTop: `4px solid ${subject.color}`, borderRadius: 2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 9, boxSizing: 'border-box', textDecoration: 'none' }}
            >
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 600, color: '#fff' }}>{s.code}</span>
              <span style={{ fontSize: 7, lineHeight: 1.3, color: '#C3CFDB' }}>{s.title}</span>
            </Link>
            <div className="srs-body" style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
              <span style={{ fontSize: 12, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-3,#3C4854)' }}>{s.profile.kicker}</span>
              <h2 id={`series-${s.slug}`} style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, lineHeight: 1.25 }}>
                <Link href={`/series/${s.slug}`} style={{ color: 'var(--ink,#101B27)' }}>
                  {s.title}
                </Link>
              </h2>
              <p className="srs-wide" style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)', maxWidth: '75ch' }}>{s.scope}</p>
              <p className="srs-wide" style={{ margin: 0, fontSize: 13, color: 'var(--muted,#505C68)' }}>
                {s.profile.editorsLabel}: {s.profile.editors.map((e) => e.name).join(', ')}
              </p>
              <div className="srs-wide" style={{ display: 'flex', gap: '8px 18px', flexWrap: 'wrap', fontSize: 14, fontWeight: 500, marginTop: 4 }}>
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
