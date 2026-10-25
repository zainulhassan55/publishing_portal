import Link from 'next/link'

const COLUMNS: { label: string; links: [string, string][] }[] = [
  {
    label: 'Publishing',
    links: [
      ['Journals', '/journals'],
      ['Book series', '/series'],
    ],
  },
  {
    label: 'Contribute',
    links: [
      ['Submit a manuscript', '/submit'],
      ['Propose a volume', '/series'],
      ['For reviewers', '/reviewers'],
      ['For editors', '/editors'],
    ],
  },
  {
    label: 'Policies',
    links: [
      ['Publication ethics', '/policies/publication-ethics'],
      ['Peer review', '/policies/peer-review-policy'],
      ['Open access and licensing', '/policies/open-access'],
      ['Generative AI', '/policies/generative-ai-policy'],
      ['Complaints and appeals', '/policies/complaints-appeals'],
    ],
  },
  {
    label: 'Publisher',
    links: [
      ['About', '/#about'],
      ['For librarians', '/librarians'],
      ['For authors', '/authors'],
      ['Contact', '/contact'],
    ],
  },
]

/** Replicated from Footer.dc.html; the columns follow the publisher's site structure. */
export function Footer() {
  return (
    <footer style={{ fontFamily: 'var(--font-sans)', background: 'var(--brand, #0F2B46)', borderTop: '4px solid', borderImage: 'linear-gradient(90deg,var(--accent, #0C8375),var(--warm, #C2410C)) 1', color: '#D5DEE7', marginTop: 80 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 32px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, gridColumn: 'span 1', minWidth: 220 }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, color: '#fff' }}>NextGenIQ Press</span>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: '#C3CFDB', maxWidth: '32ch' }}>Independent academic publisher of open-access journals, book series and conference proceedings.</p>
          <p style={{ margin: 0, fontSize: 13, color: '#C3CFDB' }}>contact@nextgeniqpress.com</p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.label} style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
            <span style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9FB1C3', marginBottom: 4 }}>{col.label}</span>
            {col.links.map(([label, href]) => (
              <Link key={label} href={href} style={{ color: '#fff' }}>{label}</Link>
            ))}
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid #2A4763' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 32px', display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 12, color: '#9FB1C3' }}>
          <span>© 2026 NextGenIQ Press. Content published under CC BY 4.0 unless otherwise stated.</span>
          <div style={{ flex: 1 }}></div>
          <Link href="/policies/privacy" style={{ color: '#C3CFDB' }}>Privacy</Link>
          <Link href="/policies/terms" style={{ color: '#C3CFDB' }}>Terms</Link>
          <Link href="/policies/cookies" style={{ color: '#C3CFDB' }}>Cookies</Link>
          <Link href="/policies/accessibility" style={{ color: '#C3CFDB' }}>Accessibility</Link>
        </div>
      </div>
    </footer>
  )
}
