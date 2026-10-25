import Image from 'next/image'
import Link from 'next/link'

export type PublicationCardData = {
  href: string
  code: string
  title: string
  /** Subject colour: the card's top border, the cover tile's strip and the subject dot. */
  color: string
  subject: string
  /** Banner image; shown on the title's home page, not on the card. */
  cover?: string
  /** Portrait crop of the banner's artwork: the card's cover photo. */
  tile?: string
  /** "ISSN: applied for", or the series equivalent. */
  identifier: string
  aboutLabel: string
  action: { label: string; href: string }
}

/**
 * The mockup's journal card (Home.dc.html "Featured journals"): a portrait
 * cover tile beside the name, identifier and subject, then the actions. The
 * mockup's article-view and download counts are left out: there are no
 * published articles to count, and invented figures would be false.
 */
export function PublicationCard({ href, code, title, color, subject, tile, identifier, aboutLabel, action }: PublicationCardData) {
  return (
    <article className="pub-card" style={{ background: 'var(--surface,#fff)', border: '1px solid var(--line,#DCE1E6)', borderTop: `3px solid ${color}`, borderRadius: 3, display: 'flex', flexDirection: 'column' }}>
      <style>{`.pub-card .pub-tile{transition:transform .35s ease,box-shadow .35s ease}.pub-card:hover .pub-tile{transform:translateY(-4px);box-shadow:0 8px 16px rgba(0,0,0,.25)}.pub-card-title:hover{color:var(--accent,#1D5DA8)!important}.pub-card-about:hover{border-color:var(--accent,#1D5DA8)!important;color:var(--accent,#1D5DA8)!important}.pub-card-act:hover{filter:brightness(1.1)}@media (prefers-reduced-motion:reduce){.pub-card .pub-tile{transition:none}}`}</style>
      <div style={{ display: 'flex', gap: 14, padding: 16 }}>
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden="true"
          className="pub-tile"
          style={{ position: 'relative', overflow: 'hidden', width: 72, height: 96, flexShrink: 0, background: 'var(--brand,#0F2B46)', borderTop: `4px solid ${color}`, borderRadius: 2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 6, boxSizing: 'border-box', textDecoration: 'none' }}
        >
          {tile ? (
            <Image src={tile} alt="" fill sizes="72px" style={{ objectFit: 'cover' }} />
          ) : (
            <>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: code.length > 4 ? 11 : 13, fontWeight: 600, color: '#fff' }}>{code}</span>
              <span style={{ fontSize: 5.5, lineHeight: 1.3, color: '#C3CFDB' }}>{title}</span>
            </>
          )}
        </Link>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
          <Link href={href} className="pub-card-title" style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 600, color: 'var(--ink,#101B27)', lineHeight: 1.3, textDecoration: 'none' }}>
            {title}
          </Link>
          <span style={{ fontSize: 12, color: 'var(--muted,#505C68)' }}>{identifier}</span>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--ink-3,#3C4854)', padding: '1px 6px', border: '1px solid var(--line,#DCE1E6)', borderRadius: 2 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }}></span>
              {subject}
            </span>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '12px 16px 14px', borderTop: '1px solid var(--line-soft,#EEF1F4)' }}>
        <Link href={href} className="pub-card-about" style={{ textAlign: 'center', border: '1px solid var(--line-strong,#B9C1C9)', color: 'var(--ink,#101B27)', padding: 7, borderRadius: 3, fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
          {aboutLabel}
        </Link>
        <Link href={action.href} className="pub-card-act" style={{ textAlign: 'center', background: 'var(--accent-dark,#0A685C)', color: '#fff', padding: 8, borderRadius: 3, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
          {action.label}
        </Link>
      </div>
    </article>
  )
}
