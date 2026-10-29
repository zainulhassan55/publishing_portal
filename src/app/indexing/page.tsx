import type { Metadata } from 'next'
import Link from 'next/link'
import { doiPrefix, licenceShort } from '@/lib/site'
import { withSharing } from '@/lib/metadata'

export const metadata: Metadata = withSharing({
  title: 'Indexing and discoverability',
  description:
    'The real indexing status of NextGenIQ Press journals, service by service, including what each service requires before an application can be made.',
  alternates: { canonical: '/indexing' },
})

/**
 * Audit finding F-04: the site advertised "DOI-ready articles" with no Crossref
 * membership or deposit workflow behind it. This page states the status of each
 * service and, where the status is "planned", what has to be true first. An
 * author can verify every row.
 */
const services = {
  head: ['Service', 'Status', 'What it depends on'],
  rows: [
    ['Crossref (DOI registration)', 'In progress', 'Publisher membership, then DOI deposit on publication'],
    ['Google Scholar', 'Ready', 'Citation metadata is served in the HTML of every article page'],
    ['OAI-PMH', 'Ready', 'Open endpoint for harvesters; served by the editorial system'],
    ['PKP Preservation Network', 'In progress', 'Required by DOAJ; archives content independently of this server'],
    ['Directory of Open Access Journals (DOAJ)', 'Planned', 'Eligible after one year of publication and a preservation arrangement'],
    ['Scopus', 'Planned', 'Eligible after roughly two years of consistent publication'],
    ['Web of Science (ESCI)', 'Planned', 'Application after sustained publication and a named editorial board'],
  ],
}

/** Status chip colours follow the mockups' Open / Closing soon / Closed set. */
const statusChip = (status: string): [string, string] =>
  status === 'Ready'
    ? ['#E7F3EB', '#1E6B3A']
    : status === 'In progress'
      ? ['#FDF1DE', '#8A5300']
      : ['var(--line-soft,#EEF1F4)', 'var(--ink-3,#3C4854)']

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px 10px 0',
  fontSize: 12,
  color: 'var(--muted,#505C68)',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '.04em',
  borderBottom: '1px solid var(--line-strong,#B9C1C9)',
}

const td: React.CSSProperties = {
  padding: '11px 12px 11px 0',
  borderBottom: '1px solid var(--line,#DCE1E6)',
  verticalAlign: 'top',
  lineHeight: 1.45,
}

export default function IndexingPage() {
  return (
    <div id="main-content" style={{ maxWidth: 1280, margin: '0 auto', padding: '20px var(--shell-pad) 0' }}>
      <style>{`@media (max-width:760px){.idxTbl{min-width:0!important}.idxTbl thead{display:none}.idxTbl tr{display:block;padding:12px 0;border-bottom:1px solid var(--line,#DCE1E6)}.idxTbl td{display:block;border:0!important;padding:3px 0!important}}`}</style>
      <nav aria-label="Breadcrumb" style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--muted,#505C68)' }}>
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span style={{ color: 'var(--ink-2,#1F2A36)' }}>Indexing</span>
      </nav>

      <div style={{ padding: '20px 0 24px', borderBottom: '1px solid var(--line,#DCE1E6)' }}>
        <span style={{ display: 'block', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted,#505C68)', fontWeight: 600 }}>Indexing</span>
        <h1 style={{ margin: '6px 0 10px', fontFamily: 'var(--font-serif)', fontSize: 36, lineHeight: 1.15, fontWeight: 600, color: 'var(--ink,#101B27)', letterSpacing: '-.01em' }}>Indexing and discoverability</h1>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)', maxWidth: '70ch' }}>
          Indexing services set their own eligibility criteria, and most of them require a publication history before
          they will consider an application. Rather than list services we hope to join, this page states where each one
          actually stands and what has to happen first.
        </p>
      </div>

      <section style={{ marginTop: 32, maxWidth: 960 }}>
        <h2 style={{ margin: '0 0 16px', fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Service by service</h2>
        <div style={{ overflowX: 'auto', borderTop: '2px solid #101B27' }}>
          <table className="idxTbl" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 640 }}>
            <thead>
              <tr>
                {services.head.map((h) => (
                  <th key={h} scope="col" style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {services.rows.map((row) => {
                const [bg, fg] = statusChip(row[1])
                return (
                  <tr key={row[0]}>
                    <td style={{ ...td, color: 'var(--ink,#101B27)', fontWeight: 500 }}>{row[0]}</td>
                    <td style={td}>
                      <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 2, fontWeight: 500, background: bg, color: fg, whiteSpace: 'nowrap' }}>{row[1]}</span>
                    </td>
                    <td style={{ ...td, color: 'var(--ink-3,#3C4854)' }}>{row[2]}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ marginTop: 56, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,280px),1fr))', gap: 20 }}>
        <div style={{ border: '1px solid var(--line,#DCE1E6)', borderRadius: 3, background: 'var(--surface,#fff)', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Metadata we publish</h2>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.7, color: 'var(--ink-3,#3C4854)' }}>
            <li>Google Scholar <span style={{ fontFamily: 'var(--font-mono)' }}>citation_*</span> tags on every article</li>
            <li>Dublin Core metadata</li>
            <li><span style={{ fontFamily: 'var(--font-mono)' }}>ScholarlyArticle</span> JSON-LD</li>
            <li>A sitemap covering every article, journal and guidance page</li>
          </ul>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: 'var(--muted,#505C68)' }}>
            Served in the page HTML, not assembled by JavaScript — Google Scholar does not run scripts.
          </p>
        </div>

        <div style={{ border: '1px solid var(--line,#DCE1E6)', borderRadius: 3, background: 'var(--surface,#fff)', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Persistent identifiers</h2>
          <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'max-content minmax(0,1fr)', gap: '8px 16px', fontSize: 14 }}>
            <dt style={{ color: 'var(--muted,#505C68)' }}>DOI prefix</dt>
            <dd style={{ margin: 0, fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--ink-2,#1F2A36)' }}>{doiPrefix}</dd>
            <dt style={{ color: 'var(--muted,#505C68)' }}>ISSN</dt>
            <dd style={{ margin: 0, fontWeight: 500, color: 'var(--ink-2,#1F2A36)' }}>Applied for</dd>
            <dt style={{ color: 'var(--muted,#505C68)' }}>ORCID</dt>
            <dd style={{ margin: 0, fontWeight: 500, color: 'var(--ink-2,#1F2A36)' }}>Collected for every author, required for the corresponding author</dd>
          </dl>
        </div>

        <div style={{ border: '1px solid var(--line,#DCE1E6)', borderRadius: 3, background: 'var(--surface,#fff)', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Reuse and archiving</h2>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)' }}>
            Articles are published under {licenceShort} with copyright retained by the authors, so anyone may archive
            and redistribute them. Authors may deposit the published version in an institutional repository
            immediately, with no embargo.
          </p>
          <Link href="/policies/copyright-licensing" style={{ fontSize: 14, fontWeight: 500 }}>Copyright and licensing</Link>
        </div>
      </section>
    </div>
  )
}
