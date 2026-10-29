import type { Metadata } from 'next'
import Link from 'next/link'
import { policies, policyGroups } from '@/data/policies'
import { withSharing } from '@/lib/metadata'

export const metadata: Metadata = withSharing({
  title: 'Policies',
  description:
    'Ethics and integrity, access and data, and publisher policies that apply to every NextGenIQ Press journal and book series.',
  alternates: { canonical: '/policies' },
})

export default function PoliciesIndex() {
  return (
    <div id="main-content" style={{ maxWidth: 1280, margin: '0 auto', padding: '20px var(--shell-pad) 0' }}>
      <style>{`.pol-card:hover{border-color:var(--accent,#1D5DA8)!important}`}</style>
      <nav aria-label="Breadcrumb" style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--muted,#505C68)' }}>
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span style={{ color: 'var(--ink-2,#1F2A36)' }}>Policies</span>
      </nav>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '20px 0 8px' }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 38, fontWeight: 600, color: 'var(--ink,#101B27)', letterSpacing: '-.01em' }}>Policies</h1>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)', maxWidth: '66ch' }}>
          These policies apply to every NextGenIQ Press journal and book series. Individual publication pages state how a title applies them.
        </p>
      </div>

      {policyGroups.map((group) => (
        <section key={group} aria-labelledby={`g-${group}`} style={{ marginTop: 40 }}>
          <h2 id={`g-${group}`} style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 600, color: 'var(--ink,#101B27)', borderBottom: '2px solid var(--accent,#0B7265)', paddingBottom: 10 }}>
            {group}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,380px),1fr))', gap: 20, marginTop: 20 }}>
            {policies
              .filter((p) => p.group === group)
              .map((p) => (
                <Link
                  key={p.slug}
                  href={`/policies/${p.slug}`}
                  className="pol-card"
                  style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 20, border: '1px solid var(--line,#DCE1E6)', borderRadius: 3, background: 'var(--surface,#fff)', textDecoration: 'none' }}
                >
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: 19, fontWeight: 600, color: 'var(--ink,#101B27)' }}>{p.title}</span>
                  <span style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)' }}>{p.summary}</span>
                </Link>
              ))}
          </div>
        </section>
      ))}
    </div>
  )
}
