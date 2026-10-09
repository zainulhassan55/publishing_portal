'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useToday } from '@/lib/hooks/client-state'
import { deadlineState } from '@/lib/format'
import { JournalMasthead, type JournalMastheadProps } from './JournalMasthead'

export type PageTable = { head: string[]; rows: string[][] }

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
  n: number
  h: string
  p: string[]
  ul: string[]
  table: PageTable | null
  sub: PageSub[]
}

export type SideGroup = {
  group: string
  links: { title: string; href: string; current: boolean }[]
}

export type PageNavItem = { href: string; title: string }

export type StaticPageCall = {
  theme: string
  deadlineIso: string
  deadline: string
  guest: string
}

export type JournalStaticPageProps = {
  masthead: JournalMastheadProps
  group: string
  title: string
  blocks: PageBlock[]
  isInstructions: boolean
  showCalls: boolean
  calls: StaticPageCall[]
  todayIso: string
  side: SideGroup[]
  prev: PageNavItem
  next: PageNavItem
}

const chip = (s: string): [string, string] =>
  s === 'Open'
    ? ['#E7F3EB', '#1E6B3A']
    : s === 'Closing soon'
      ? ['#FDF1DE', '#8A5300']
      : ['var(--line-soft,#EEF1F4)', 'var(--ink-3,#3C4854)']

const templates = [
  { ext: 'DOCX', name: 'Word manuscript template', meta: 'Microsoft Word · 64 KB', href: '#s3' },
  { ext: 'ZIP', name: 'LaTeX template and class file', meta: 'LaTeX · Overleaf compatible · 212 KB', href: '#s3' },
  { ext: 'DOCX', name: 'Title page and declarations form', meta: 'Microsoft Word · 38 KB', href: '#s6' },
]

function BlockTable({ table }: { table: PageTable }) {
  return (
    <div style={{ overflowX: 'auto', margin: '4px 0 24px', borderTop: '2px solid #101B27' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 520 }}>
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
                <td key={ci} style={{ padding: '11px 12px 11px 0', borderBottom: '1px solid var(--line,#DCE1E6)', verticalAlign: 'top', lineHeight: 1.45 }}>
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

export function JournalStaticPage({ masthead, group, title, blocks, isInstructions, showCalls, calls, todayIso, side, prev, next }: JournalStaticPageProps) {
  const j = masthead.j
  const [active, setActive] = useState('s1')
  const clientToday = useToday()
  const today = clientToday ?? todayIso

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

  const submitHref = `/submit?journal=${j.slug}`

  const toc = blocks
    .flatMap((b) => [{ id: b.id, label: b.h, indent: '12px' }].concat(b.sub.map((s) => ({ id: s.id, label: s.h, indent: '24px' }))))
    .map((t) => ({
      ...t,
      href: '#' + t.id,
      bar: t.id === active ? 'var(--accent,#1D5DA8)' : 'var(--line,#DCE1E6)',
      fg: t.id === active ? 'var(--ink,#101B27)' : 'var(--ink-3,#3C4854)',
      weight: t.id === active ? 600 : 400,
    }))

  const statusOf = (iso: string) => {
    const s = deadlineState(iso, today)
    return s === 'closed' ? 'Closed' : s === 'closing-soon' ? 'Closing soon' : 'Open'
  }
  const callsList = calls.map((c) => {
    const status = statusOf(c.deadlineIso)
    const [bg, fg] = chip(status)
    return { ...c, status, bg, fg }
  })

  return (
    <>
      <style>{`html{scroll-behavior:smooth}@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}.jsp-side a:hover{color:var(--accent,#1D5DA8)}.jsp-pn:hover{border-color:var(--accent,#1D5DA8)!important}`}</style>
      <JournalMasthead {...masthead} />
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 32px 0', display: 'flex', gap: 48, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <nav aria-label="Journal pages" className="jsp-side" style={{ width: 230, flexShrink: 0, position: 'sticky', top: 16, fontSize: 14 }}>
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

        <div id="main-content" style={{ flex: 1, minWidth: 300, maxWidth: 720 }}>
          <span style={{ fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted,#505C68)', fontWeight: 500 }}>{group}</span>
          <h1 style={{ margin: '6px 0 10px', fontFamily: 'var(--font-serif)', fontSize: 36, lineHeight: 1.15, fontWeight: 600, color: 'var(--ink,#101B27)', letterSpacing: '-.01em' }}>{title}</h1>
          <p style={{ margin: '0 0 28px', fontSize: 13, color: 'var(--muted,#505C68)' }}>{j.title} · Last updated 1 September 2026</p>

          {isInstructions ? (
            <div style={{ border: '1px solid var(--line,#DCE1E6)', borderRadius: 3, marginBottom: 36 }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line,#DCE1E6)', fontSize: 14, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Manuscript templates</div>
              {templates.map((t) => (
                <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', borderBottom: '1px solid var(--line-soft,#EEF1F4)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500, padding: '3px 6px', border: '1px solid var(--line-strong,#B9C1C9)', borderRadius: 2, color: 'var(--ink-2,#1F2A36)', width: 44, textAlign: 'center' }}>{t.ext}</span>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 14, color: 'var(--ink,#101B27)', fontWeight: 500 }}>{t.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--muted,#505C68)' }}>{t.meta}</span>
                  </div>
                  <a href={t.href} style={{ fontSize: 13, fontWeight: 500 }}>
                    Download
                  </a>
                </div>
              ))}
            </div>
          ) : null}

          {blocks.map((b) => (
            <section key={b.id} id={b.id} data-sec="1" style={{ scrollMarginTop: 24, paddingBottom: 12 }}>
              <h2 style={{ margin: '0 0 14px', fontFamily: 'var(--font-serif)', fontSize: 24, lineHeight: 1.25, fontWeight: 600, color: 'var(--ink,#101B27)', display: 'flex', gap: 12 }}>
                <span style={{ color: 'var(--muted,#6B7682)', fontWeight: 400 }}>{b.n}</span>
                {b.h}
              </h2>
              {b.p.map((para) => (
                <p key={para} style={{ margin: '0 0 16px', fontSize: 17, lineHeight: 1.7, color: 'var(--ink-2,#1F2A36)', textWrap: 'pretty' }}>
                  {para}
                </p>
              ))}
              {b.ul.length > 0 ? (
                <ul style={{ margin: '0 0 20px', paddingLeft: 22, fontSize: 17, lineHeight: 1.7, color: 'var(--ink-2,#1F2A36)' }}>
                  {b.ul.map((li) => (
                    <li key={li} style={{ paddingLeft: 4, marginBottom: 4 }}>
                      {li}
                    </li>
                  ))}
                </ul>
              ) : null}
              {b.table ? <BlockTable table={b.table} /> : null}
              {b.sub.length > 0
                ? b.sub.map((s) => (
                    <div key={s.id} id={s.id} data-sec="1" style={{ scrollMarginTop: 24 }}>
                      <h3 style={{ margin: '8px 0 10px', fontSize: 18, fontWeight: 600, color: 'var(--ink,#101B27)', display: 'flex', gap: 10 }}>
                        <span style={{ color: 'var(--muted,#6B7682)', fontWeight: 400 }}>{s.n}</span>
                        {s.h}
                      </h3>
                      {s.p.map((para) => (
                        <p key={para} style={{ margin: '0 0 16px', fontSize: 17, lineHeight: 1.7, color: 'var(--ink-2,#1F2A36)' }}>
                          {para}
                        </p>
                      ))}
                      {s.ul.length > 0 ? (
                        <ul style={{ margin: '0 0 20px', paddingLeft: 22, fontSize: 17, lineHeight: 1.7, color: 'var(--ink-2,#1F2A36)' }}>
                          {s.ul.map((li) => (
                            <li key={li} style={{ paddingLeft: 4, marginBottom: 4 }}>
                              {li}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {s.table ? <BlockTable table={s.table} /> : null}
                    </div>
                  ))
                : null}
            </section>
          ))}

          {showCalls ? (
            <div style={{ borderTop: '2px solid #101B27', marginTop: 8 }}>
              {callsList.map((c) => (
                <div key={c.theme} style={{ padding: '16px 0', borderBottom: '1px solid var(--line,#DCE1E6)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--muted,#505C68)' }}>
                    <span style={{ padding: '1px 7px', borderRadius: 2, fontWeight: 500, background: c.bg, color: c.fg }}>{c.status}</span> · Deadline {c.deadline}
                  </span>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: 19, fontWeight: 600, color: 'var(--ink,#101B27)' }}>{c.theme}</span>
                  <span style={{ fontSize: 13, color: 'var(--muted,#505C68)' }}>Guest editor: {c.guest}</span>
                </div>
              ))}
              {callsList.length === 0 ? (
                <p style={{ fontSize: 15, color: 'var(--ink-3,#3C4854)', padding: '16px 0', margin: 0, lineHeight: 1.6 }}>
                  There is no thematic call for this journal at present. Regular submissions on any topic within scope are welcome.
                </p>
              ) : null}
            </div>
          ) : null}

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

        <aside style={{ width: 220, flexShrink: 0, position: 'sticky', top: 16, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <nav aria-label="On this page">
            <span style={{ display: 'block', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted,#505C68)', fontWeight: 600, marginBottom: 8 }}>On this page</span>
            {toc.map((t) => (
              <a key={t.id} href={t.href} style={{ display: 'block', fontSize: 13, lineHeight: 1.4, padding: `5px 0 5px ${t.indent}`, borderLeft: `2px solid ${t.bar}`, color: t.fg, fontWeight: t.weight, textDecoration: 'none' }}>
                {t.label}
              </a>
            ))}
          </nav>
          <div style={{ border: '1px solid var(--line,#DCE1E6)', borderRadius: 3, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Ready to submit?</span>
            <span style={{ fontSize: 13, color: 'var(--ink-3,#3C4854)', lineHeight: 1.5 }}>{j.code} accepts submissions year-round.</span>
            <Link href={submitHref} style={{ background: 'var(--accent,#1D5DA8)', color: '#fff', padding: '9px 12px', borderRadius: 3, fontSize: 14, fontWeight: 500, textAlign: 'center', textDecoration: 'none' }}>
              Submit manuscript
            </Link>
          </div>
        </aside>
      </div>
    </>
  )
}
