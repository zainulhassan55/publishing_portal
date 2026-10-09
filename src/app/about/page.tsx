import type { Metadata } from 'next'
import Link from 'next/link'
import { journals, series } from '@/data/registry'
import { editorialEmail, licenceShort, siteName } from '@/lib/site'

export const metadata: Metadata = {
  title: 'About the publisher',
  description:
    'NextGenIQ Press is an independent open-access publisher of ten peer-reviewed journals, two book series and two proceedings series. How we publish, what we charge, and who is accountable.',
  alternates: { canonical: '/about' },
}

const principles = [
  {
    title: 'Review that is actually blind',
    body: 'Every research article goes to a minimum of two independent reviewers who do not know who wrote it, and whose identities the authors do not learn. Manuscripts are screened for similarity before they reach a reviewer.',
  },
  {
    title: 'Open by default, not by purchase',
    body: `Every article is free to read from the moment it is published, under a ${licenceShort} licence, with copyright retained by the authors. There is no embargo, no subscription tier and no paywalled version of record.`,
  },
  {
    title: 'Publication on acceptance',
    body: 'Articles appear online as soon as they are accepted, copy-edited and typeset, and are citable from that date. Nobody waits for an issue to fill.',
  },
  {
    title: 'Methods over perceived impact',
    body: 'Editors are asked whether the methods support the conclusions, not whether the result is exciting. Replications, negative results and methodological papers are in scope everywhere.',
  },
]

export default function AboutPage() {
  const metrics = [
    { v: String(journals.length), l: 'Peer-reviewed journals' },
    { v: String(series.length), l: 'Book and proceedings series' },
    { v: 'Double-blind', l: 'Review model in every journal' },
    { v: 'None', l: 'Submission fee or APC at launch' },
  ]

  return (
    <>
      <div style={{ background: 'linear-gradient(135deg,var(--accent-tint,#F3F9F8) 25%,var(--accent-soft,#CDF0E7))', borderBottom: '1px solid var(--line,#DCE1E6)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 32px 36px' }}>
          <nav aria-label="Breadcrumb" style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--muted,#505C68)' }}>
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span style={{ color: 'var(--ink-2,#1F2A36)' }}>About</span>
          </nav>
          <span style={{ display: 'block', margin: '18px 0 0', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted,#505C68)', fontWeight: 600 }}>About</span>
          <h1 style={{ margin: '6px 0 10px', fontFamily: 'var(--font-serif)', fontSize: 40, lineHeight: 1.15, fontWeight: 600, color: 'var(--ink,#101B27)', letterSpacing: '-.01em', maxWidth: '34ch' }}>
            An independent publisher, built for research that needs to be verifiable.
          </h1>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)', maxWidth: '68ch' }}>
            {siteName} publishes {journals.length} peer-reviewed open-access journals, two book series and two
            proceedings series across digital, computational and interdisciplinary science. We are new, and we would
            rather say so plainly than imply a history we do not have.
          </p>
        </div>
      </div>

      <section aria-label="Key metrics" style={{ background: 'linear-gradient(100deg,var(--brand,#0F2B46),color-mix(in oklab,var(--brand,#0F2B46) 52%,var(--accent,#0C8375)))' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
          {metrics.map((m) => (
            <div key={m.l} style={{ padding: '24px 24px 24px 0', display: 'flex', flexDirection: 'column', gap: 4, borderRight: '1px solid rgba(255,255,255,.16)' }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 600, color: '#fff', fontVariantNumeric: 'tabular-nums', letterSpacing: '-.01em' }}>{m.v}</span>
              <span style={{ fontSize: 13, color: '#C3CFDB' }}>{m.l}</span>
            </div>
          ))}
        </div>
      </section>

      <div id="main-content" style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 32px 0' }}>
        <section>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 600, color: 'var(--ink,#101B27)', borderBottom: '2px solid var(--accent,#0B7265)', paddingBottom: 10 }}>How we publish</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap: 20, marginTop: 24 }}>
            {principles.map((principle) => (
              <div key={principle.title} style={{ border: '1px solid var(--line,#DCE1E6)', borderRadius: 3, background: 'var(--surface,#fff)', padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600, color: 'var(--ink,#101B27)' }}>{principle.title}</h3>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)' }}>{principle.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 64, display: 'flex', gap: 56, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 300, maxWidth: 720 }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 600, color: 'var(--ink,#101B27)', borderBottom: '2px solid var(--accent,#0B7265)', paddingBottom: 10 }}>Where we are today</h2>
            <p style={{ margin: '18px 0 16px', fontSize: 17, lineHeight: 1.7, color: 'var(--ink-2,#1F2A36)', maxWidth: '70ch', textWrap: 'pretty' }}>
              All ten journals are open for submissions. Founding editorial board appointments are in progress; until
              an appointment has been accepted in writing, manuscripts are handled by the editorial office under the
              oversight of the publisher&rsquo;s editorial director, and the board page for each journal says so.
            </p>
            <p style={{ margin: '0 0 16px', fontSize: 17, lineHeight: 1.7, color: 'var(--ink-2,#1F2A36)', maxWidth: '70ch', textWrap: 'pretty' }}>
              ISSN registration is under way. Until a number is assigned, every journal page shows
              &ldquo;Applied for&rdquo; rather than a placeholder — an ISSN is checkable, and a fabricated one fails
              the check.
            </p>
            <p style={{ margin: '0 0 16px', fontSize: 17, lineHeight: 1.7, color: 'var(--ink-2,#1F2A36)', maxWidth: '70ch', textWrap: 'pretty' }}>
              Articles receive a Crossref DOI on publication. Applications to indexing services are made when each
              service&rsquo;s eligibility criteria are met, which for most of them means a minimum number of published
              articles or a period of continuous publication. The{' '}
              <Link href="/indexing">indexing page</Link> lists the real status of each service rather than a
              wish list.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
              <Link href="/journals" style={{ background: 'var(--accent,#1D5DA8)', color: '#fff', padding: '10px 18px', borderRadius: 3, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Browse the journals</Link>
              <Link href="/authors" style={{ border: '1px solid var(--line-strong,#B9C1C9)', color: 'var(--ink,#101B27)', padding: '9px 18px', borderRadius: 3, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Read the author guidance</Link>
            </div>
          </div>

          <aside style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ border: '1px solid var(--line,#DCE1E6)', borderRadius: 3, background: 'var(--surface,#fff)', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Publisher</h3>
              <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'max-content minmax(0,1fr)', gap: '8px 16px', fontSize: 14 }}>
                <dt style={{ color: 'var(--muted,#505C68)' }}>Name</dt>
                <dd style={{ margin: 0, fontWeight: 500, color: 'var(--ink-2,#1F2A36)' }}>{siteName}</dd>
                <dt style={{ color: 'var(--muted,#505C68)' }}>Editorial office</dt>
                <dd style={{ margin: 0, fontWeight: 500 }}>
                  <a href={`mailto:${editorialEmail}`}>{editorialEmail}</a>
                </dd>
                <dt style={{ color: 'var(--muted,#505C68)' }}>Response time</dt>
                <dd style={{ margin: 0, fontWeight: 500, color: 'var(--ink-2,#1F2A36)' }}>Two working days</dd>
              </dl>
            </div>

            <div style={{ border: '1px solid var(--line,#DCE1E6)', borderRadius: 3, background: 'var(--surface,#fff)', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Get involved</h3>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Link href="/contact" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderTop: '1px solid var(--line-soft,#EEF1F4)', fontSize: 14, color: 'var(--ink,#101B27)', textDecoration: 'none' }}>
                  Apply to an editorial board<span aria-hidden="true" style={{ color: 'var(--muted,#6B7682)' }}>→</span>
                </Link>
                <Link href="/authors#reviewers" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderTop: '1px solid var(--line-soft,#EEF1F4)', fontSize: 14, color: 'var(--ink,#101B27)', textDecoration: 'none' }}>
                  Register as a reviewer<span aria-hidden="true" style={{ color: 'var(--muted,#6B7682)' }}>→</span>
                </Link>
                <Link href="/propose-journal" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderTop: '1px solid var(--line-soft,#EEF1F4)', fontSize: 14, color: 'var(--ink,#101B27)', textDecoration: 'none' }}>
                  Propose a new journal<span aria-hidden="true" style={{ color: 'var(--muted,#6B7682)' }}>→</span>
                </Link>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </>
  )
}
