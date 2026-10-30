import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicationCard } from '@/components/content/PublicationCard'
import { magazines, periodicalBase } from '@/data/registry'
import { withSharing } from '@/lib/metadata'
import { publicationCards } from '@/lib/publication'

export const metadata: Metadata = withSharing({
  title: 'Magazines',
  description:
    'Open-access, peer-reviewed magazines from NextGenIQ Press: short, accessible technical features, reviews, tutorials, case studies and expert perspectives.',
  alternates: { canonical: '/magazines' },
})

export default function MagazinesIndex() {
  const cards = publicationCards().magazines
  return (
    <div id="main-content" style={{ maxWidth: 1280, margin: '0 auto', padding: '20px var(--shell-pad) 0' }}>
      <nav aria-label="Breadcrumb" style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--muted,#505C68)' }}>
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span style={{ color: 'var(--ink-2,#1F2A36)' }}>Magazines</span>
      </nav>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '20px 0 24px', borderBottom: '1px solid var(--line,#DCE1E6)' }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 38, fontWeight: 600, color: 'var(--ink,#101B27)', letterSpacing: '-.01em' }}>Magazines</h1>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)', maxWidth: '66ch' }}>
          Our magazines publish short, accessible articles for a broad technical readership: technical features, reviews, tutorials, case studies and expert perspectives. Articles are peer reviewed double-blind, limited to five pages, and freely available under CC BY 4.0.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,280px),1fr))', gap: 20, marginTop: 20 }}>
        {cards.map((m) => (
          <PublicationCard key={m.slug} {...m} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: '8px 18px', flexWrap: 'wrap', fontSize: 14, fontWeight: 500, marginTop: 24 }}>
        {magazines.map((m) => (
          <Link key={m.slug} href={`${periodicalBase(m.slug)}/author-guidelines`}>
            {m.shortTitle} author guidelines and length limits
          </Link>
        ))}
      </div>
    </div>
  )
}
