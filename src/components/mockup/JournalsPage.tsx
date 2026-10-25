import Link from 'next/link'
import { PublicationCard, type PublicationCardData } from '@/components/content/PublicationCard'

export type JournalsCard = PublicationCardData & { slug: string }

const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,280px),1fr))', gap: 20, marginTop: 20 } as const

/** The portfolio as cards: cover and name. Each title's description is on its own home page. */
export function JournalsPage({ journals, series }: { journals: JournalsCard[]; series: JournalsCard[] }) {
  return (
    <div id="main-content" style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 32px 0' }}>
      <nav aria-label="Breadcrumb" style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--muted,#505C68)' }}>
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span style={{ color: 'var(--ink-2,#1F2A36)' }}>Journals</span>
      </nav>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '20px 0 24px', borderBottom: '1px solid var(--line,#DCE1E6)' }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 38, fontWeight: 600, color: 'var(--ink,#101B27)', letterSpacing: '-.01em' }}>Journals</h1>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)', maxWidth: '66ch' }}>
          Explore our open-access journals, featuring double-blind peer review and continuous publication. Submissions are welcome year-round.
        </p>
      </div>
      <div style={grid}>
        {journals.map((j) => (
          <PublicationCard key={j.slug} {...j} />
        ))}
      </div>

      <section id="series" style={{ marginTop: 64 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, borderBottom: '2px solid var(--accent,#0B7265)', paddingBottom: 10 }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Book series</h2>
          <Link href="/series" style={{ fontSize: 14 }}>
            All book series
          </Link>
        </div>
        <div style={grid}>
          {series.map((s) => (
            <PublicationCard key={s.slug} {...s} />
          ))}
        </div>
      </section>
    </div>
  )
}
