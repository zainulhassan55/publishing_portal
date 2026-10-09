import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSeries, series } from '@/data/registry'
import { subjects } from '@/data/subjects'
import { PENDING_ISSN_LABEL } from '@/data/issn'
import { licenceShort } from '@/lib/site'

export function generateStaticParams() {
  return series.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const item = getSeries(slug)
  if (!item) return { title: 'Series not found' }

  return {
    title: `${item.title} (${item.code})`,
    description: item.scope,
    alternates: { canonical: `/series/${item.slug}` },
  }
}

export default async function SeriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const item = getSeries(slug)

  if (!item) notFound()

  const subject = subjects[item.subjectKey]
  const isProceedings = item.kind === 'proceedings'

  const metrics = [
    { v: 'Open access', l: 'Access model' },
    { v: licenceShort, l: 'Licence' },
    { v: 'Peer reviewed', l: 'Every volume' },
    { v: 'None', l: 'Submission fee' },
  ]

  const steps = [
    {
      n: '1',
      t: `Send a proposal: scope, rationale,${isProceedings ? ' conference details, expected paper count' : ' outline and author or editor biographies'}, and a timeline.`,
    },
    { n: '2', t: 'We acknowledge within five working days and assess scope and overlap.' },
    { n: '3', t: 'On acceptance we agree a review process and schedule in writing.' },
    { n: '4', t: 'Each chapter or paper is peer reviewed before the volume is published.' },
  ]

  const others = series.filter((other) => other.slug !== item.slug)

  return (
    <>
      <style>{`.ser-other:hover{color:var(--accent,#1D5DA8)}`}</style>
      <div style={{ background: 'linear-gradient(135deg,var(--accent-tint,#F3F9F8) 25%,var(--accent-soft,#CDF0E7))', borderBottom: '1px solid var(--line,#DCE1E6)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 32px 0' }}>
          <nav aria-label="Breadcrumb" style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--muted,#505C68)', flexWrap: 'wrap' }}>
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/journals#series">Books and proceedings</Link>
            <span aria-hidden="true">/</span>
            <span style={{ color: 'var(--ink-2,#1F2A36)' }}>{item.code}</span>
          </nav>
          <div style={{ display: 'flex', gap: 28, padding: '20px 0 24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <span
              aria-hidden="true"
              style={{ width: 112, height: 150, flexShrink: 0, background: 'var(--brand,#0F2B46)', borderRadius: 2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 12, boxSizing: 'border-box', borderTop: `5px solid ${subject.color}` }}
            >
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, color: '#fff', letterSpacing: '.02em' }}>{item.code}</span>
              <span style={{ fontSize: 9, lineHeight: 1.3, color: '#C3CFDB' }}>{item.title}</span>
            </span>
            <div style={{ flex: 1, minWidth: 300, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-3,#3C4854)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: subject.color }}></span>
                {subject.label}
              </span>
              <h1 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 34, lineHeight: 1.15, fontWeight: 600, color: 'var(--ink,#101B27)', letterSpacing: '-.01em', textWrap: 'balance' }}>{item.title}</h1>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 13, color: 'var(--muted,#505C68)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-2,#1F2A36)' }}>{item.code}</span>
                <span>·</span>
                <span>ISSN: {item.issn ?? PENDING_ISSN_LABEL}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 500, padding: '2px 8px', borderRadius: 2, background: '#FBF1DA', color: '#6E4600', border: '1px solid #EBD39A' }}>Open access</span>
                <span style={{ fontSize: 12, fontWeight: 500, padding: '2px 8px', borderRadius: 2, background: 'var(--surface-2,#F5F6F7)', color: 'var(--ink-2,#1F2A36)', border: '1px solid var(--line,#DCE1E6)' }}>{isProceedings ? 'Proceedings series' : 'Book series'}</span>
                <span style={{ fontSize: 12, fontWeight: 500, padding: '2px 8px', borderRadius: 2, background: 'var(--surface-2,#F5F6F7)', color: 'var(--ink-2,#1F2A36)', border: '1px solid var(--line,#DCE1E6)' }}>{licenceShort}</span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 16, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)', maxWidth: '68ch' }}>{item.scope}</p>
            </div>
          </div>
        </div>
      </div>

      <section aria-label="Series facts" style={{ background: 'linear-gradient(100deg,var(--brand,#0F2B46),color-mix(in oklab,var(--brand,#0F2B46) 52%,var(--accent,#0C8375)))' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
          {metrics.map((m) => (
            <div key={m.l} style={{ padding: '24px 24px 24px 0', display: 'flex', flexDirection: 'column', gap: 4, borderRight: '1px solid rgba(255,255,255,.16)' }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 600, color: '#fff', letterSpacing: '-.01em' }}>{m.v}</span>
              <span style={{ fontSize: 13, color: '#C3CFDB' }}>{m.l}</span>
            </div>
          ))}
        </div>
      </section>

      <div id="main-content" style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 32px 0', display: 'flex', gap: 56, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 300, maxWidth: 720 }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 600, color: 'var(--ink,#101B27)', borderBottom: '2px solid var(--accent,#0B7265)', paddingBottom: 10 }}>Volumes</h2>
          <div style={{ marginTop: 20, border: '1px solid var(--line,#DCE1E6)', borderRadius: 3, background: 'var(--surface,#fff)', padding: 24, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 19, fontWeight: 600, color: 'var(--ink,#101B27)' }}>
              {isProceedings ? 'Accepting conference proposals' : 'Accepting volume proposals'}
            </h3>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)', maxWidth: '68ch' }}>
              {isProceedings
                ? 'No proceedings have been published in this series yet. We are accepting proposals from conference organisers; each paper is peer reviewed to the same standard as a journal submission.'
                : 'No volumes have been published in this series yet. We are accepting proposals for monographs and edited collections within the series scope.'}
            </p>
            <Link href="/propose-journal" style={{ marginTop: 4, background: 'var(--accent,#1D5DA8)', color: '#fff', padding: '10px 18px', borderRadius: 3, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
              {isProceedings ? 'Propose a proceedings volume' : 'Propose a volume'}
            </Link>
          </div>
        </div>

        <aside style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ border: '1px solid var(--line,#DCE1E6)', borderRadius: 3, background: 'var(--surface,#fff)', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--ink,#101B27)' }}>{isProceedings ? 'Publishing a conference' : 'Proposing a volume'}</h2>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {steps.map((s) => (
                <li key={s.n} style={{ display: 'grid', gridTemplateColumns: '22px minmax(0,1fr)', gap: 10, padding: '10px 0', borderTop: '1px solid var(--line-soft,#EEF1F4)', alignItems: 'baseline' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted,#505C68)' }}>{s.n}</span>
                  <span style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--ink-3,#3C4854)' }}>{s.t}</span>
                </li>
              ))}
            </ol>
          </div>

          <div style={{ border: '1px solid var(--line,#DCE1E6)', borderRadius: 3, background: 'var(--surface,#fff)', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Other series</h2>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {others.map((other) => (
                <Link key={other.slug} href={`/series/${other.slug}`} className="ser-other" style={{ display: 'flex', gap: 8, padding: '10px 0', borderTop: '1px solid var(--line-soft,#EEF1F4)', fontSize: 14, lineHeight: 1.45, color: 'var(--ink,#101B27)', textDecoration: 'none' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted,#505C68)', flexShrink: 0 }}>{other.code}</span>
                  {other.title}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}
