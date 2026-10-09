'use client'

import Link from 'next/link'
import { useState } from 'react'

export type JournalsRow = {
  slug: string
  code: string
  title: string
  subject: string
  sk: string
  color: string
  scope: string
}

export type SubjectChip = {
  k: string
  label: string
  color: string
}

export type SeriesRow = {
  slug: string
  kind: string
  code: string
  id: string
  title: string
  desc: string
  cta: string
}

export function JournalsPage({ rows, subjects, series }: { rows: JournalsRow[]; subjects: SubjectChip[]; series: SeriesRow[] }) {
  const [view, setView] = useState<'list' | 'subj'>('list')
  const [subj, setSubj] = useState('all')

  const on = (v: boolean) => (v ? ['var(--brand,#0F2B46)', '#fff'] : ['var(--surface,#fff)', 'var(--ink-2,#1F2A36)'])

  const chips = [{ k: 'all', label: 'All subjects', color: 'var(--line-strong,#B9C1C9)' }, ...subjects].map((c) => {
    const a = subj === c.k
    return {
      ...c,
      pressed: a,
      bg: a ? 'var(--accent-soft,#E8F0FA)' : 'var(--surface,#fff)',
      fg: a ? 'var(--accent-dark,#174C8A)' : 'var(--ink-2,#1F2A36)',
      border: a ? 'var(--accent,#1D5DA8)' : 'var(--line,#DCE1E6)',
    }
  })

  const items = rows
    .filter((j) => subj === 'all' || j.sk === subj)
    .slice()
    .sort((a, b) => a.title.localeCompare(b.title))

  type Group = { label: string; color: string; showHead: boolean; first: boolean; items: JournalsRow[] }
  let groups: Group[]
  if (view === 'list') groups = [{ label: '', color: '', showHead: false, first: true, items }]
  else
    groups = subjects
      .map((s) => ({ label: s.label, color: s.color, showHead: true, first: false, items: items.filter((j) => j.sk === s.k) }))
      .filter((g) => g.items.length > 0)

  const [listBg, listFg] = on(view === 'list')
  const [subjBg, subjFg] = on(view === 'subj')

  return (
    <div id="main-content" style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 32px 0' }}>
      <nav aria-label="Breadcrumb" style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--muted,#505C68)' }}>
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span style={{ color: 'var(--ink-2,#1F2A36)' }}>Journals</span>
      </nav>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap', padding: '20px 0 24px', borderBottom: '1px solid var(--line,#DCE1E6)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 38, fontWeight: 600, color: 'var(--ink,#101B27)', letterSpacing: '-.01em' }}>Journals</h1>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)', maxWidth: '66ch' }}>
            Ten open-access journals with double-blind peer review and continuous publication. All accept submissions year-round.
          </p>
        </div>
        <div role="group" aria-label="View" style={{ display: 'flex', border: '1px solid var(--line-strong,#B9C1C9)', borderRadius: 3, overflow: 'hidden' }}>
          <button
            onClick={() => setView('list')}
            aria-pressed={view === 'list' ? 'true' : 'false'}
            style={{ border: 0, padding: '8px 14px', font: 'inherit', fontSize: 13, cursor: 'pointer', background: listBg, color: listFg }}
          >
            A–Z list
          </button>
          <button
            onClick={() => setView('subj')}
            aria-pressed={view === 'subj' ? 'true' : 'false'}
            style={{ border: 0, borderLeft: '1px solid var(--line-strong,#B9C1C9)', padding: '8px 14px', font: 'inherit', fontSize: 13, cursor: 'pointer', background: subjBg, color: subjFg }}
          >
            By subject
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '16px 0', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--muted,#505C68)', marginRight: 4 }}>Subject</span>
        {chips.map((c) => (
          <button
            key={c.k}
            onClick={() => setSubj(c.k)}
            aria-pressed={c.pressed ? 'true' : 'false'}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 2, font: 'inherit', fontSize: 13, cursor: 'pointer', border: `1px solid ${c.border}`, background: c.bg, color: c.fg }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.color }}></span>
            {c.label}
          </button>
        ))}
      </div>
      {groups.map((g, gi) => (
        <section key={g.label || gi} style={{ marginTop: 8 }}>
          {g.showHead ? (
            <h2 style={{ margin: '24px 0 0', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink,#101B27)', paddingBottom: 10, borderBottom: '2px solid var(--accent,#0B7265)' }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: g.color }}></span>
              {g.label}
            </h2>
          ) : null}
          <div role="table" aria-label="Journals" style={{ display: 'flex', flexDirection: 'column' }}>
            {g.first ? (
              <div role="row" style={{ display: 'grid', gridTemplateColumns: '72px minmax(0,1fr) 90px 150px 120px', gap: 20, padding: '10px 0', borderBottom: '1px solid var(--line-strong,#B9C1C9)', fontSize: 12, color: 'var(--muted,#505C68)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                <span role="columnheader">Cover</span>
                <span role="columnheader">Journal</span>
                <span role="columnheader">Code</span>
                <span role="columnheader">ISSN</span>
                <span role="columnheader"></span>
              </div>
            ) : null}
            {g.items.map((j) => (
              <div key={j.slug} role="row" style={{ display: 'grid', gridTemplateColumns: '72px minmax(0,1fr) 90px 150px 120px', gap: 20, padding: '18px 0', borderBottom: '1px solid var(--line,#DCE1E6)', alignItems: 'start' }}>
                <Link
                  href={`/journals/${j.slug}`}
                  tabIndex={-1}
                  aria-hidden="true"
                  style={{ width: 72, height: 96, background: 'var(--brand,#0F2B46)', borderTop: `4px solid ${j.color}`, borderRadius: 2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 7, boxSizing: 'border-box', textDecoration: 'none' }}
                >
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 600, color: '#fff' }}>{j.code}</span>
                  <span style={{ fontSize: 6, lineHeight: 1.3, color: '#C3CFDB' }}>{j.title}</span>
                </Link>
                <div role="cell" style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                  <Link href={`/journals/${j.slug}`} style={{ fontFamily: 'var(--font-serif)', fontSize: 19, fontWeight: 600, color: 'var(--ink,#101B27)', lineHeight: 1.3 }}>
                    {j.title}
                  </Link>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--ink-3,#3C4854)', maxWidth: '72ch' }}>{j.scope}</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-3,#3C4854)', padding: '1px 8px', border: '1px solid var(--line,#DCE1E6)', borderRadius: 2 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: j.color }}></span>
                      {j.subject}
                    </span>
                    <span style={{ fontSize: 12, padding: '1px 8px', borderRadius: 2, background: '#FBF1DA', color: '#6E4600', border: '1px solid #EBD39A' }}>Open access</span>
                    <span style={{ fontSize: 12, color: 'var(--ink-3,#3C4854)', padding: '1px 8px', border: '1px solid var(--line,#DCE1E6)', borderRadius: 2 }}>Double-blind</span>
                  </div>
                </div>
                <span role="cell" style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink-2,#1F2A36)', paddingTop: 4 }}>{j.code}</span>
                <span role="cell" style={{ fontSize: 13, color: 'var(--muted,#505C68)', paddingTop: 4 }}>Applied for</span>
                <div role="cell" style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 2, fontSize: 14, fontWeight: 500 }}>
                  <Link href={`/journals/${j.slug}`}>Journal home</Link>
                  <Link href={`/submit?journal=${j.slug}`}>Submit</Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section id="series" style={{ marginTop: 72 }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 600, color: 'var(--ink,#101B27)', borderBottom: '2px solid var(--accent,#0B7265)', paddingBottom: 10 }}>Book series and proceedings</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,520px),1fr))', columnGap: 48 }}>
          {series.map((s) => (
            <div key={s.code} style={{ padding: '20px 0', borderBottom: '1px solid var(--line,#DCE1E6)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--muted,#505C68)' }}>
                <span style={{ fontWeight: 600, color: 'var(--warm,#B5400F)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{s.kind}</span>
                {' · '}
                <span style={{ fontFamily: 'var(--font-mono)' }}>{s.code}</span>
              </span>
              <Link href={`/series/${s.slug}`} style={{ fontFamily: 'var(--font-serif)', fontSize: 19, fontWeight: 600, color: 'var(--ink,#101B27)' }}>
                {s.title}
              </Link>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--ink-3,#3C4854)', maxWidth: '62ch' }}>{s.desc}</p>
              <div style={{ display: 'flex', gap: 16, fontSize: 14, fontWeight: 500, marginTop: 4 }}>
                <Link href="/propose-journal">{s.cta}</Link>
                <span style={{ fontWeight: 400, fontSize: 13, color: 'var(--muted,#505C68)' }}>{s.id}: applied for</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
