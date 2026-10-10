'use client'

import Link from 'next/link'
import { JournalMasthead, type JournalMastheadProps } from './JournalMasthead'

export type IssueArticle = {
  id: string
  href: string
  type: string
  title: string
  authorLine: string
  pages: string
  date: string
  doi: string
}

export type IssueSectionRow = {
  name: string
  n: string
  items: IssueArticle[]
}

export type ArchiveRow = {
  label: string
  meta: string
  current: boolean
}

export type IssuePageProps = {
  masthead: JournalMastheadProps
  vol: number
  num: number
  monthYear: string
  sections: IssueSectionRow[]
  count: number
  archive: ArchiveRow[]
}

const appear = [
  { h: 'On acceptance', p: 'The accepted manuscript is listed under Articles in press with its DOI.' },
  { h: 'On publication', p: 'The typeset version of record replaces it, with full text, PDF and citation export.' },
  { h: 'At issue close', p: 'Articles are grouped by section into the issue table of contents.' },
]

export function IssuePage({ masthead, vol, num, monthYear, sections, count, archive }: IssuePageProps) {
  const j = masthead.j
  const submitHref = `/submit?journal=${j.slug}`

  const cur = { bar: 'var(--accent,#1D5DA8)', bg: 'var(--surface-2,#F5F6F7)', weight: 600 }
  const oth = { bar: 'var(--line,#DCE1E6)', bg: 'transparent', weight: 400 }

  return (
    <>
      <JournalMasthead {...masthead} />
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 32px 0', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: 56 }}>
        <div id="main-content" style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 24, paddingBottom: 24, borderBottom: '2px solid var(--accent,#0B7265)', flexWrap: 'wrap' }}>
            <div style={{ width: 96, height: 128, background: 'var(--brand,#0F2B46)', borderTop: `5px solid ${j.color}`, borderRadius: 2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 9, boxSizing: 'border-box' }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, color: '#fff' }}>{j.code}</span>
              <span style={{ fontSize: 9, color: '#C3CFDB' }}>Vol. {vol} · Issue {num}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 240 }}>
              <span style={{ fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted,#505C68)', fontWeight: 500 }}>Current issue</span>
              <h1 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Volume {vol}, Issue {num}</h1>
              <span style={{ fontSize: 14, color: 'var(--ink-3,#3C4854)' }}>{monthYear} · {count} articles · Published continuously 1 May – 30 June 2026</span>
              <div style={{ display: 'flex', gap: 16, fontSize: 14, fontWeight: 500, marginTop: 4 }}>
                <a href="#archive">Previous issues</a>
                <Link href="/authors#alerts">Get issue alerts</Link>
              </div>
            </div>
          </div>
          {sections.map((s) => (
            <section key={s.name} style={{ marginTop: 32 }}>
              <h2 style={{ margin: 0, fontSize: 13, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink,#101B27)', paddingBottom: 10, borderBottom: '1px solid var(--line-strong,#B9C1C9)', display: 'flex', justifyContent: 'space-between' }}>
                {s.name}
                <span style={{ fontWeight: 400, color: 'var(--muted,#505C68)', letterSpacing: 0, textTransform: 'none' }}>{s.n}</span>
              </h2>
              {s.items.map((a) => (
                <article key={a.id} style={{ padding: '16px 0', borderBottom: '1px solid var(--line,#DCE1E6)', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div style={{ display: 'flex', gap: 10, fontSize: 12 }}>
                      <span style={{ fontWeight: 600, color: 'var(--warm,#B5400F)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{a.type}</span>
                      <span style={{ color: '#6E4600', fontWeight: 500 }}>● Open access</span>
                    </div>
                    <Link href={a.href} style={{ fontFamily: 'var(--font-serif)', fontSize: 18, lineHeight: 1.35, color: 'var(--ink,#101B27)', fontWeight: 600 }}>
                      {a.title}
                    </Link>
                    <span style={{ fontSize: 14 }}>{a.authorLine}</span>
                    <span style={{ fontSize: 13, color: 'var(--muted,#505C68)' }}>
                      pp. {a.pages} · {a.date} · <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>doi.org/{a.doi}</span>
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 500, textAlign: 'right' }}>
                    <Link href={a.href}>Full text</Link>
                    <Link href={a.href}>PDF</Link>
                  </div>
                </article>
              ))}
            </section>
          ))}

          <div style={{ marginTop: 28, borderTop: '2px solid #101B27' }}>
            {appear.map((r) => (
              <div key={r.h} style={{ display: 'grid', gridTemplateColumns: '200px minmax(0,1fr)', gap: 20, padding: '16px 0', borderBottom: '1px solid var(--line,#DCE1E6)' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--warm,#B5400F)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{r.h}</span>
                <span style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--ink-2,#1F2A36)' }}>{r.p}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href={submitHref} style={{ background: 'var(--accent,#1D5DA8)', color: '#fff', padding: '10px 18px', borderRadius: 3, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
              Submit to Volume 1
            </Link>
            <Link href="/authors#alerts" style={{ border: '1px solid var(--line-strong,#B9C1C9)', color: 'var(--ink,#101B27)', padding: '9px 18px', borderRadius: 3, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
              Notify me when articles are published
            </Link>
          </div>
        </div>
        <aside id="archive" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 13, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink,#101B27)', paddingBottom: 10, borderBottom: '2px solid var(--accent,#0B7265)' }}>Issue archive</h2>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, color: 'var(--ink,#101B27)', padding: '8px 0' }}>2026</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-3,#3C4854)', padding: '4px 0 8px' }}>Volume 1</span>
            {archive.map((i) => {
              const st = i.current ? cur : oth
              return (
                <div key={i.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 12px', borderLeft: `2px solid ${st.bar}`, background: st.bg, fontSize: 14 }}>
                  <span style={{ color: 'var(--ink,#101B27)', fontWeight: st.weight }}>{i.label}</span>
                  <span style={{ color: 'var(--muted,#505C68)', fontSize: 13 }}>{i.meta}</span>
                </div>
              )
            })}
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 13, lineHeight: 1.5, color: 'var(--muted,#505C68)' }}>Earlier volumes are listed here by year once published.</p>
        </aside>
      </div>
    </>
  )
}
