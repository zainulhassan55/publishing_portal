import Link from 'next/link'
import type { ReactNode } from 'react'
import type { PublisherSection } from '@/types/content'

export type PublisherPageProps = {
  /** Breadcrumb trail after "Home"; the last entry is the current page. */
  trail: { label: string; href?: string }[]
  kicker: string
  title: string
  lead: string
  sections: PublisherSection[]
  aside?: ReactNode
  /** Rendered after the sections, such as a form. */
  children?: ReactNode
}

const p = { margin: '0 0 16px', fontSize: 17, lineHeight: 1.7, color: 'var(--ink-2,#1F2A36)', textWrap: 'pretty' } as const
const ul = { margin: '0 0 20px', paddingLeft: 22, fontSize: 17, lineHeight: 1.7, color: 'var(--ink-2,#1F2A36)' } as const

/** Layout for the publisher-wide guidance pages: reviewers, editors, librarians. */
export function PublisherPage({ trail, kicker, title, lead, sections, aside, children }: PublisherPageProps) {
  return (
    <>
      <style>{`@media (max-width:760px){.pp-aside{position:static!important}.pp-h1{font-size:30px!important}}`}</style>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px var(--shell-pad) 0' }}>
        <nav aria-label="Breadcrumb" style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--muted,#505C68)', flexWrap: 'wrap' }}>
          <Link href="/">Home</Link>
          {trail.map((t) => (
            <span key={t.label} style={{ display: 'flex', gap: 8 }}>
              <span aria-hidden="true">/</span>
              {t.href ? <Link href={t.href}>{t.label}</Link> : <span style={{ color: 'var(--ink-2,#1F2A36)' }}>{t.label}</span>}
            </span>
          ))}
        </nav>
      </div>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px var(--shell-pad) 0', display: 'flex', gap: 56, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <article id="main-content" style={{ flex: '1 1 560px', minWidth: 0, maxWidth: 760 }}>
          <span style={{ fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted,#505C68)', fontWeight: 500 }}>{kicker}</span>
          <h1 className="pp-h1" style={{ margin: '6px 0 12px', fontFamily: 'var(--font-serif)', fontSize: 38, lineHeight: 1.15, fontWeight: 600, color: 'var(--ink,#101B27)', letterSpacing: '-.01em' }}>{title}</h1>
          <p style={{ margin: '0 0 32px', fontSize: 18, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)', maxWidth: '66ch' }}>{lead}</p>

          {sections.map((s) => (
            <section key={s.id} id={s.id} style={{ scrollMarginTop: 24, paddingBottom: 12 }}>
              {s.title ? (
                <h2 style={{ margin: '0 0 14px', fontFamily: 'var(--font-serif)', fontSize: 24, lineHeight: 1.25, fontWeight: 600, color: 'var(--ink,#101B27)' }}>{s.title}</h2>
              ) : null}
              {s.paragraphs?.map((t) => (
                <p key={t} style={p}>
                  {t}
                </p>
              ))}
              {s.bullets ? (
                <ul style={ul}>
                  {s.bullets.map((li) => (
                    <li key={li} style={{ paddingLeft: 4, marginBottom: 4 }}>
                      {li}
                    </li>
                  ))}
                </ul>
              ) : null}
              {s.closing?.map((t) => (
                <p key={t} style={p}>
                  {t}
                </p>
              ))}
              {s.links ? (
                <div style={{ display: 'flex', gap: '8px 20px', flexWrap: 'wrap', margin: '0 0 20px', fontSize: 15, fontWeight: 500 }}>
                  {s.links.map((l) => (
                    <Link key={l.href + l.label} href={l.href}>
                      {l.label} →
                    </Link>
                  ))}
                </div>
              ) : null}
            </section>
          ))}

          {children}
        </article>
        {aside ? <aside className="pp-aside m-full" style={{ flex: '0 1 300px', display: 'flex', flexDirection: 'column', gap: 24, position: 'sticky', top: 16 }}>{aside}</aside> : null}
      </div>
    </>
  )
}

export function AsideBox({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ border: '1px solid var(--line,#DCE1E6)', borderRadius: 3, padding: 18, display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--surface,#fff)' }}>
      <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--ink,#101B27)' }}>{title}</h2>
      {children}
    </div>
  )
}

export function AsideLinks({ links }: { links: { label: string; href: string }[] }) {
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
      {links.map((l) => (
        <li key={l.href + l.label} style={{ borderTop: '1px solid var(--line-soft,#EEF1F4)' }}>
          <Link href={l.href} style={{ display: 'block', padding: '9px 0', fontSize: 14 }}>
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  )
}
