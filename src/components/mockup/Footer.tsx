import Link from 'next/link'

/** Replicated from Footer.dc.html. */
export function Footer() {
  return (
    <footer style={{ fontFamily: 'var(--font-sans)', background: 'var(--brand, #0F2B46)', borderTop: '4px solid', borderImage: 'linear-gradient(90deg,var(--accent, #0C8375),var(--warm, #C2410C)) 1', color: '#D5DEE7', marginTop: 80 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 32px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, gridColumn: 'span 1', minWidth: 220 }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, color: '#fff' }}>NextGenIQ Press</span>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: '#C3CFDB', maxWidth: '32ch' }}>Independent publisher of peer-reviewed, open-access journals, book series and conference proceedings.</p>
          {/* The mockup shipped editorial@…, but the publisher's real inbox is contact@…. */}
          <p style={{ margin: 0, fontSize: 13, color: '#C3CFDB' }}>contact@nextgeniqpress.com</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
          <span style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9FB1C3', marginBottom: 4 }}>Publishing</span>
          <Link href="/journals" style={{ color: '#fff' }}>Journals</Link>
          <Link href="/journals#series" style={{ color: '#fff' }}>Book series</Link>
          <Link href="/journals#series" style={{ color: '#fff' }}>Proceedings</Link>
          <Link href="/search?tab=articles" style={{ color: '#fff' }}>Articles</Link>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
          <span style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9FB1C3', marginBottom: 4 }}>Authors</span>
          <Link href="/authors" style={{ color: '#fff' }}>For authors</Link>
          <Link href="/submit" style={{ color: '#fff' }}>Submit a manuscript</Link>
          <Link href="/authors#cfp" style={{ color: '#fff' }}>Calls for papers</Link>
          <Link href="/authors#apc" style={{ color: '#fff' }}>Open access and APC</Link>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
          <span style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9FB1C3', marginBottom: 4 }}>Policies</span>
          <Link href="/policies/publication-ethics" style={{ color: '#fff' }}>Publication ethics</Link>
          <Link href="/journals/ijdh/peer-review-process" style={{ color: '#fff' }}>Peer review</Link>
          <Link href="/policies/open-access" style={{ color: '#fff' }}>Open access and licensing</Link>
          <Link href="/policies/generative-ai-policy" style={{ color: '#fff' }}>Generative AI</Link>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
          <span style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9FB1C3', marginBottom: 4 }}>Publisher</span>
          <Link href="/#about" style={{ color: '#fff' }}>About</Link>
          <Link href="/authors#librarians" style={{ color: '#fff' }}>Indexing and archiving</Link>
          <Link href="/#news" style={{ color: '#fff' }}>News</Link>
          <Link href="/journals/ijdh/editorial-office" style={{ color: '#fff' }}>Contact</Link>
        </div>
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
