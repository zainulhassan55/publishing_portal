'use client'

import Link from 'next/link'
import { useEffect, useState, type ReactNode } from 'react'
import { JournalMasthead, type JournalMastheadProps } from './JournalMasthead'

export type PageTable = { head: string[]; rows: string[][] }

export type PageDownload = { label: string; href: string; format: string; note?: string }

export type PageSub = {
  id: string
  n: string
  h: string
  p: string[]
  ul: string[]
  table: PageTable | null
}

export type PageBlock = {
  id: string
  /** 0 for an untitled block, which renders without a heading. */
  n: number
  h: string
  lead: string
  p: string[]
  ul: string[]
  /** Show `ul` as a column topic list. */
  topics: boolean
  closing: string[]
  table: PageTable | null
  downloads: PageDownload[]
  sub: PageSub[]
}

export type SideGroup = {
  group: string
  links: { title: string; href: string; current: boolean }[]
}

export type PageNavItem = { href: string; title: string }

export type PageListItem = { href: string; title: string; meta: string }

export type PageCta = { title: string; text: string; label: string; href: string }

export type JournalStaticPageProps = {
  masthead: JournalMastheadProps
  group: string
  title: string
  blocks: PageBlock[]
  side: SideGroup[]
  prev: PageNavItem
  next: PageNavItem
  cta: PageCta
  /** Records listed under the page text, such as a journal's published articles. */
  list?: PageListItem[]
  /** Rendered after the page text, such as a proposal form. */
  children?: ReactNode
}

function BlockTable({ table }: { table: PageTable }) {
  return (
    <div style={{ overflowX: 'auto', margin: '4px 0 24px', borderTop: '2px solid #101B27' }}>
      <table className={table.head.length > 2 ? 'jsp-tbl jsp-tbl-lab' : 'jsp-tbl'} style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 520 }}>
        <thead>
          <tr>
            {table.head.map((th) => (
              <th key={th} scope="col" style={{ textAlign: 'left', padding: '10px 12px 10px 0', fontSize: 12, color: 'var(--muted,#505C68)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', borderBottom: '1px solid var(--line-strong,#B9C1C9)' }}>
                {th}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} data-label={table.head[ci]} style={{ padding: '11px 12px 11px 0', borderBottom: '1px solid var(--line,#DCE1E6)', verticalAlign: 'top', lineHeight: 1.45, fontWeight: ci === 0 ? 600 : 400, color: ci === 0 ? 'var(--ink,#101B27)' : 'var(--ink-2,#1F2A36)' }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DownloadList({ files }: { files: PageDownload[] }) {
  return (
    <ul style={{ listStyle: 'none', margin: '4px 0 24px', padding: 0, borderTop: '1px solid var(--line,#DCE1E6)' }}>
      {files.map((f) => (
        <li key={f.href} style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--line,#DCE1E6)' }}>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink,#101B27)' }}>{f.label}</span>
            {f.note ? <span style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--muted,#505C68)' }}>{f.note}</span> : null}
          </span>
          <a href={f.href} download className="jsp-dl" style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 12px', border: '1px solid var(--line-strong,#B9C1C9)', borderRadius: 3, fontSize: 14, fontWeight: 500, color: 'var(--ink,#101B27)', textDecoration: 'none' }}>
            <span aria-hidden="true">↓</span>
            Download {f.format}
          </a>
        </li>
      ))}
    </ul>
  )
}

const para = { margin: '0 0 16px', fontSize: 17, lineHeight: 1.7, color: 'var(--ink-2,#1F2A36)', textWrap: 'pretty' } as const
const list = { margin: '0 0 20px', paddingLeft: 22, fontSize: 17, lineHeight: 1.7, color: 'var(--ink-2,#1F2A36)' } as const

export function JournalStaticPage({ masthead, group, title, blocks, side, prev, next, cta, list: records, children }: JournalStaticPageProps) {
  const j = masthead.j
  const [active, setActive] = useState('s1')

  useEffect(() => {
    const onScroll = () => {
      const els = Array.from(document.querySelectorAll('[data-sec]'))
      let cur = els[0] && els[0].id
      for (const el of els) if (el.getBoundingClientRect().top < 140) cur = el.id
      if (cur) setActive((prevActive) => (cur !== prevActive ? cur : prevActive))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const toc = blocks
    .filter((b) => b.h !== '')
    .flatMap((b) => [{ id: b.id, label: b.h, indent: '12px' }].concat(b.sub.map((s) => ({ id: s.id, label: s.h, indent: '24px' }))))
    .map((t) => ({
      ...t,
      href: '#' + t.id,
      bar: t.id === active ? 'var(--accent,#1D5DA8)' : 'var(--line,#DCE1E6)',
      fg: t.id === active ? 'var(--ink,#101B27)' : 'var(--ink-3,#3C4854)',
      weight: t.id === active ? 600 : 400,
    }))

  return (
    <>
      <style>{`html{scroll-behavior:smooth}@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}.jsp-side a:hover{color:var(--accent,#1D5DA8)}.jsp-pn:hover,.jsp-dl:hover{border-color:var(--accent,#1D5DA8)!important}@media (max-width:760px){.jsp-aside{position:static!important}.jsp-h1{font-size:30px!important}.jsp-tbl{min-width:0!important}.jsp-tbl thead{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}.jsp-tbl tr{display:block;padding:10px 0;border-bottom:1px solid var(--line,#DCE1E6)}.jsp-tbl td{display:block;padding:2px 0!important;border:0!important}.jsp-tbl-lab td+td::before{content:attr(data-label) ': ';color:var(--muted,#505C68);font-size:12px;text-transform:uppercase;letter-spacing:.04em}}`}</style>
      <JournalMasthead {...masthead} />
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px var(--shell-pad) 0', display: 'flex', gap: 48, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <nav aria-label={masthead.kind === 'journal' ? 'Journal pages' : 'Series pages'} className="jsp-side m-hide" style={{ width: 230, flexShrink: 0, position: 'sticky', top: 16, fontSize: 14 }}>
          {side.map((g) => (
            <div key={g.group} style={{ padding: '0 0 16px' }}>
              <span style={{ display: 'block', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted,#505C68)', fontWeight: 600, padding: '0 0 6px 12px' }}>{g.group}</span>
              {g.links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={l.current ? 'page' : 'false'}
                  style={{ display: 'block', padding: '5px 12px', borderLeft: `2px solid ${l.current ? 'var(--accent,#1D5DA8)' : 'transparent'}`, color: l.current ? 'var(--ink,#101B27)' : 'var(--ink-3,#3C4854)', fontWeight: l.current ? 600 : 400, background: l.current ? 'var(--surface-2,#F5F6F7)' : 'transparent', textDecoration: 'none' }}
                >
                  {l.title}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div id="main-content" className="m-full" style={{ flex: 1, minWidth: 300, maxWidth: 720 }}>
          <span style={{ fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted,#505C68)', fontWeight: 500 }}>{group}</span>
          <h1 className="jsp-h1" style={{ margin: '6px 0 10px', fontFamily: 'var(--font-serif)', fontSize: 36, lineHeight: 1.15, fontWeight: 600, color: 'var(--ink,#101B27)', letterSpacing: '-.01em' }}>{title}</h1>
          <p style={{ margin: '0 0 28px', fontSize: 13, color: 'var(--muted,#505C68)' }}>{j.title}</p>

          {blocks.map((b) => (
            <section key={b.id} id={b.id} data-sec="1" style={{ scrollMarginTop: 24, paddingBottom: 12 }}>
              {b.h ? (
                <h2 style={{ margin: '0 0 14px', fontFamily: 'var(--font-serif)', fontSize: 24, lineHeight: 1.25, fontWeight: 600, color: 'var(--ink,#101B27)', display: 'flex', gap: 12 }}>
                  {blocks.filter((x) => x.h).length > 1 ? <span style={{ color: 'var(--muted,#6B7682)', fontWeight: 400 }}>{b.n}</span> : null}
                  {b.h}
                </h2>
              ) : null}
              {b.lead ? (
                <p style={{ margin: '0 0 20px', fontFamily: 'var(--font-serif)', fontSize: 21, lineHeight: 1.4, fontStyle: 'italic', color: 'var(--ink,#101B27)', textWrap: 'balance' }}>{b.lead}</p>
              ) : null}
              {b.p.map((t) => (
                <p key={t} style={para}>
                  {t}
                </p>
              ))}
              {b.topics && b.ul.length > 0 ? (
                <ul className="jsp-topics" style={{ listStyle: 'none', margin: '4px 0 24px', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,260px),1fr))', gap: '0 28px', borderTop: '1px solid var(--line,#DCE1E6)' }}>
                  {b.ul.map((li) => (
                    <li key={li} style={{ display: 'flex', gap: 10, alignItems: 'baseline', padding: '10px 0', borderBottom: '1px solid var(--line,#DCE1E6)', fontSize: 16, lineHeight: 1.45, color: 'var(--ink-2,#1F2A36)' }}>
                      <span aria-hidden="true" style={{ width: 6, height: 6, flexShrink: 0, borderRadius: '50%', background: 'var(--accent,#0B7265)', transform: 'translateY(-2px)' }}></span>
                      {li}
                    </li>
                  ))}
                </ul>
              ) : b.ul.length > 0 ? (
                <ul style={list}>
                  {b.ul.map((li) => (
                    <li key={li} style={{ paddingLeft: 4, marginBottom: 4 }}>
                      {li}
                    </li>
                  ))}
                </ul>
              ) : null}
              {b.table ? <BlockTable table={b.table} /> : null}
              {b.downloads.length > 0 ? <DownloadList files={b.downloads} /> : null}
              {b.closing.map((t) => (
                <p key={t} style={para}>
                  {t}
                </p>
              ))}
              {b.sub.map((s) => (
                <div key={s.id} id={s.id} data-sec="1" style={{ scrollMarginTop: 24 }}>
                  <h3 style={{ margin: '8px 0 10px', fontSize: 18, fontWeight: 600, color: 'var(--ink,#101B27)', display: 'flex', gap: 10 }}>
                    <span style={{ color: 'var(--muted,#6B7682)', fontWeight: 400 }}>{s.n}</span>
                    {s.h}
                  </h3>
                  {s.p.map((t) => (
                    <p key={t} style={para}>
                      {t}
                    </p>
                  ))}
                  {s.ul.length > 0 ? (
                    <ul style={list}>
                      {s.ul.map((li) => (
                        <li key={li} style={{ paddingLeft: 4, marginBottom: 4 }}>
                          {li}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {s.table ? <BlockTable table={s.table} /> : null}
                </div>
              ))}
            </section>
          ))}

          {records && records.length > 0 ? (
            <div style={{ borderTop: '2px solid #101B27', marginTop: 8 }}>
              {records.map((r) => (
                <article key={r.href} style={{ padding: '16px 0', borderBottom: '1px solid var(--line,#DCE1E6)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Link href={r.href} style={{ fontFamily: 'var(--font-serif)', fontSize: 18, lineHeight: 1.35, color: 'var(--ink,#101B27)', fontWeight: 600 }}>
                    {r.title}
                  </Link>
                  <span style={{ fontSize: 13, color: 'var(--muted,#505C68)' }}>{r.meta}</span>
                </article>
              ))}
            </div>
          ) : null}

          {children ? <div style={{ marginTop: 16 }}>{children}</div> : null}

          <nav aria-label="Previous and next page" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 40, borderTop: '1px solid var(--line,#DCE1E6)', paddingTop: 20 }}>
            <Link href={prev.href} className="jsp-pn" style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '14px 16px', border: '1px solid var(--line,#DCE1E6)', borderRadius: 3, textDecoration: 'none' }}>
              <span style={{ fontSize: 12, color: 'var(--muted,#505C68)' }}>← Previous</span>
              <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink,#101B27)' }}>{prev.title}</span>
            </Link>
            <Link href={next.href} className="jsp-pn" style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '14px 16px', border: '1px solid var(--line,#DCE1E6)', borderRadius: 3, textAlign: 'right', textDecoration: 'none' }}>
              <span style={{ fontSize: 12, color: 'var(--muted,#505C68)' }}>Next →</span>
              <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink,#101B27)' }}>{next.title}</span>
            </Link>
          </nav>
        </div>

        <aside className="jsp-aside m-full" style={{ width: 220, flexShrink: 0, position: 'sticky', top: 16, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {toc.length > 1 ? (
            <nav aria-label="On this page" className="m-hide">
              <span style={{ display: 'block', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted,#505C68)', fontWeight: 600, marginBottom: 8 }}>On this page</span>
              {toc.map((t) => (
                <a key={t.id} href={t.href} style={{ display: 'block', fontSize: 13, lineHeight: 1.4, padding: `5px 0 5px ${t.indent}`, borderLeft: `2px solid ${t.bar}`, color: t.fg, fontWeight: t.weight, textDecoration: 'none' }}>
                  {t.label}
                </a>
              ))}
            </nav>
          ) : null}
          <div style={{ border: '1px solid var(--line,#DCE1E6)', borderRadius: 3, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink,#101B27)' }}>{cta.title}</span>
            <span style={{ fontSize: 13, color: 'var(--ink-3,#3C4854)', lineHeight: 1.5 }}>{cta.text}</span>
            <Link href={cta.href} style={{ background: 'var(--accent,#1D5DA8)', color: '#fff', padding: '9px 12px', borderRadius: 3, fontSize: 14, fontWeight: 500, textAlign: 'center', textDecoration: 'none' }}>
              {cta.label}
            </Link>
          </div>
        </aside>
      </div>
    </>
  )
}
