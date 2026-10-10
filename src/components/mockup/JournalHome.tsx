'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useToday } from '@/lib/hooks/client-state'
import { deadlineState } from '@/lib/format'
import { JournalMasthead, type JournalMastheadProps, type MastheadGroup } from './JournalMasthead'

export type HomeArticle = {
  id: string
  href: string
  type: string
  title: string
  authorLine: string
  vol: number
  issue: number
  pages: string
  date: string
  doi: string
}

export type HomeCall = {
  theme: string
  deadlineIso: string
  deadline: string
  guest: string
}

export type JournalHomeProps = {
  masthead: JournalMastheadProps
  topics: string[]
  pool: HomeArticle[]
  calls: HomeCall[]
  todayIso: string
  issueLine: string
  issueMeta: string
  groups: MastheadGroup[]
}

const chip = (s: string): [string, string] =>
  s === 'Open'
    ? ['#E7F3EB', '#1E6B3A']
    : s === 'Closing soon'
      ? ['#FDF1DE', '#8A5300']
      : ['var(--line-soft,#EEF1F4)', 'var(--ink-3,#3C4854)']

export function JournalHome({ masthead, topics, pool, calls, todayIso, issueLine, issueMeta, groups }: JournalHomeProps) {
  const j = masthead.j
  const [artTab, setArtTab] = useState(0)
  const clientToday = useToday()
  const today = clientToday ?? todayIso

  const subjLower = j.subject.toLowerCase()
  const P = (id: string) => `/journals/${j.slug}/${id}`
  const scopeHref = P('aims-scope')
  const insightsHref = P('peer-review-process')
  const oaHref = P('open-access')
  const cfpHref = P('call-for-papers')
  const guideHref = P('author-instructions')
  const submitHref = `/submit?journal=${j.slug}`
  const issueHref = `/journals/${j.slug}/current-issue`
  const searchHref = `/search?tab=articles&journal=${j.slug}`

  const ordered = artTab === 1 ? [...pool].reverse() : artTab === 2 ? [...pool.slice(2), ...pool.slice(0, 2)] : pool
  const latest = ordered.slice(0, 4)

  const artTabs = ['Latest published', 'Most downloaded', 'Top cited'].map((label, i) => ({
    label,
    sel: i === artTab,
    weight: i === artTab ? 600 : 500,
    fg: i === artTab ? 'var(--ink,#101B27)' : 'var(--muted,#505C68)',
    bar: i === artTab ? 'var(--accent,#0C8375)' : 'transparent',
    pick: () => setArtTab(i),
  }))

  const statusOf = (iso: string) => {
    const s = deadlineState(iso, today)
    return s === 'closed' ? 'Closed' : s === 'closing-soon' ? 'Closing soon' : 'Open'
  }
  const callsList = calls.map((c) => {
    const status = statusOf(c.deadlineIso)
    const [bg, fg] = chip(status)
    return { ...c, status, chipBg: bg, chipFg: fg }
  })

  const insights = [
    { v: '38 days', l: 'Submission to first decision (median)' },
    { v: '84 days', l: 'Submission to acceptance (median)' },
    { v: '18 days', l: 'Acceptance to online publication' },
    { v: '31%', l: 'Acceptance rate' },
  ]

  const promises = [
    { l: 'Fees', v: 'None', d: 'No submission fee or APC for manuscripts submitted during the launch period.' },
    { l: 'Target first decision', v: '6 weeks', d: 'From submission, with a technical check within 3 working days.' },
    { l: 'After acceptance', v: '3 weeks', d: 'To online publication with a registered DOI.' },
  ]

  const newsItems = [
    {
      date: '2 September 2026',
      type: 'Announcement',
      title: j.code + ' is now accepting submissions',
      summary: 'Regular submissions are open, with no submission fee or APC during the launch period.',
    },
    {
      date: '18 August 2026',
      type: 'Infrastructure',
      title: 'Crossref DOI registration confirmed',
      summary: 'Every article published in ' + j.code + ' receives a Crossref DOI and machine-readable citation metadata.',
    },
    {
      date: '29 July 2026',
      type: 'Editorial',
      title: 'Call for founding editorial board members',
      summary: 'Researchers with an established record in ' + subjLower + ' can apply to serve as Senior or Associate Editors.',
    },
  ]

  const board = [
    { ini: 'HA', name: 'Prof. Helen Achterberg', role: 'Editor-in-Chief', aff: 'Leiden University Medical Center' },
    { ini: 'RM', name: 'Dr Rahul Mehta', role: 'Senior Editor', aff: 'University of Toronto' },
    { ini: 'CS', name: 'Dr Chiara Santoro', role: 'Senior Editor', aff: 'Politecnico di Milano' },
  ]

  return (
    <>
      <JournalMasthead {...masthead} />
      <div id="main-content" style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 32px 0', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 56 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 48, minWidth: 0 }}>
          <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Aims and scope</h2>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: 'var(--ink-2,#1F2A36)', maxWidth: '68ch', textWrap: 'pretty' }}>
              {j.title} publishes rigorous, reproducible research in {subjLower}. The journal considers original research articles, reviews, short communications, case studies and perspectives on topics including:
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: 6, maxWidth: '72ch' }}>
              {topics.map((t) => (
                <li key={t} style={{ fontSize: 13, padding: '4px 10px', border: '1px solid var(--line,#DCE1E6)', borderRadius: 2, color: 'var(--ink-2,#1F2A36)', background: 'var(--surface-3,#FAFBFB)' }}>
                  {t}
                </li>
              ))}
            </ul>
            <Link href={scopeHref} style={{ fontSize: 14, fontWeight: 500 }}>
              Read the full aims and scope
            </Link>
          </section>

          <section>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderBottom: '2px solid var(--accent,#0B7265)', paddingBottom: 10 }}>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Latest articles</h2>
              <Link href={searchHref} style={{ fontSize: 14 }}>
                All articles in {j.code}
              </Link>
            </div>
            <div role="tablist" aria-label="Sort articles" style={{ display: 'flex', gap: 22, borderBottom: '1px solid var(--line,#DCE1E6)' }}>
              {artTabs.map((t) => (
                <button
                  key={t.label}
                  role="tab"
                  aria-selected={t.sel ? 'true' : 'false'}
                  onClick={t.pick}
                  style={{ border: 0, background: 'none', padding: '12px 0 10px', font: 'inherit', fontSize: 14, fontWeight: t.weight, color: t.fg, cursor: 'pointer', borderBottom: `2px solid ${t.bar}`, marginBottom: -1 }}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {latest.map((a) => (
              <article key={a.id} style={{ padding: '18px 0', borderBottom: '1px solid var(--line,#DCE1E6)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', gap: 10, fontSize: 12 }}>
                  <span style={{ fontWeight: 600, color: 'var(--warm,#B5400F)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{a.type}</span>
                  <span style={{ color: '#6E4600', fontWeight: 500 }}>● Open access</span>
                </div>
                <Link href={a.href} style={{ fontFamily: 'var(--font-serif)', fontSize: 18, lineHeight: 1.35, color: 'var(--ink,#101B27)', fontWeight: 600 }}>
                  {a.title}
                </Link>
                <span style={{ fontSize: 14 }}>{a.authorLine}</span>
                <span style={{ fontSize: 13, color: 'var(--muted,#505C68)' }}>
                  Vol. {a.vol}, Issue {a.issue}, pp. {a.pages} · {a.date} · <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>doi.org/{a.doi}</span>
                </span>
              </article>
            ))}
            <div style={{ marginTop: 24, display: 'flex', gap: 20, border: '1px solid var(--line,#DCE1E6)', borderRadius: 3, padding: 20, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ width: 64, height: 86, background: 'var(--brand,#0F2B46)', borderTop: `4px solid ${j.color}`, borderRadius: 2, display: 'flex', alignItems: 'flex-end', padding: 6, boxSizing: 'border-box', color: '#fff', fontFamily: 'var(--font-serif)', fontSize: 12, fontWeight: 600 }}>
                {j.code}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 200 }}>
                <span style={{ fontSize: 12, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted,#505C68)' }}>Current issue</span>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: 19, fontWeight: 600, color: 'var(--ink,#101B27)' }}>{issueLine}</span>
                <span style={{ fontSize: 13, color: 'var(--muted,#505C68)' }}>{issueMeta}</span>
              </div>
              <Link href={issueHref} style={{ border: '1px solid var(--line-strong,#B9C1C9)', color: 'var(--ink,#101B27)', padding: '9px 16px', borderRadius: 3, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
                View issue
              </Link>
            </div>
          </section>

          <section>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderBottom: '2px solid var(--accent,#0B7265)', paddingBottom: 10 }}>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Now accepting submissions for Volume 1</h2>
              <Link href={cfpHref} style={{ fontSize: 14 }}>
                Call for papers
              </Link>
            </div>
            <p style={{ margin: '16px 0 0', fontSize: 15, lineHeight: 1.65, color: 'var(--ink-2,#1F2A36)', maxWidth: '68ch' }}>
              Articles are published online as soon as they are accepted and typeset, and are assigned to Volume 1 (2026). The first articles will appear here and in the <Link href={issueHref}>current issue</Link> on publication.
            </p>
            <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', border: '1px solid var(--line,#DCE1E6)', borderRadius: 3 }}>
              {promises.map((p) => (
                <div key={p.l} style={{ padding: '18px 20px', borderRight: '1px solid var(--line,#DCE1E6)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 13, color: 'var(--muted,#505C68)' }}>{p.l}</span>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, color: 'var(--ink,#101B27)' }}>{p.v}</span>
                  <span style={{ fontSize: 13, color: 'var(--ink-3,#3C4854)', lineHeight: 1.45 }}>{p.d}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderBottom: '2px solid var(--accent,#0B7265)', paddingBottom: 10 }}>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Journal insights</h2>
              <Link href={insightsHref} style={{ fontSize: 14 }}>
                Peer review policy
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', border: '1px solid var(--line,#DCE1E6)', borderRadius: 3, marginTop: 20 }}>
              {insights.map((i) => (
                <div key={i.l} style={{ padding: '18px 20px', borderRight: '1px solid var(--line-soft,#EEF1F4)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 600, color: 'var(--accent-dark,#0A685C)', fontVariantNumeric: 'tabular-nums' }}>{i.v}</span>
                  <span style={{ fontSize: 13, color: 'var(--ink-3,#3C4854)', lineHeight: 1.4 }}>{i.l}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderBottom: '2px solid var(--accent,#0B7265)', paddingBottom: 10 }}>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Open access and fees</h2>
              <Link href={oaHref} style={{ fontSize: 14 }}>
                Open access policy
              </Link>
            </div>
            <dl style={{ margin: '20px 0 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', border: '1px solid var(--line,#DCE1E6)', borderRadius: 3 }}>
              <div style={{ padding: '16px 20px', borderRight: '1px solid var(--line-soft,#EEF1F4)' }}>
                <dt style={{ fontSize: 12, color: 'var(--muted,#505C68)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Publishing model</dt>
                <dd style={{ margin: '6px 0 0', fontSize: 15, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Gold open access</dd>
              </div>
              <div style={{ padding: '16px 20px', borderRight: '1px solid var(--line-soft,#EEF1F4)' }}>
                <dt style={{ fontSize: 12, color: 'var(--muted,#505C68)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Article processing charge</dt>
                <dd style={{ margin: '6px 0 0', fontSize: 15, fontWeight: 600, color: 'var(--ink,#101B27)' }}>None during launch</dd>
              </div>
              <div style={{ padding: '16px 20px', borderRight: '1px solid var(--line-soft,#EEF1F4)' }}>
                <dt style={{ fontSize: 12, color: 'var(--muted,#505C68)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Licence</dt>
                <dd style={{ margin: '6px 0 0', fontSize: 15, fontWeight: 600, color: 'var(--ink,#101B27)' }}>CC BY 4.0</dd>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <dt style={{ fontSize: 12, color: 'var(--muted,#505C68)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Copyright</dt>
                <dd style={{ margin: '6px 0 0', fontSize: 15, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Retained by authors</dd>
              </div>
            </dl>
          </section>

          <section>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderBottom: '2px solid var(--accent,#0B7265)', paddingBottom: 10 }}>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Calls for papers</h2>
              <Link href={cfpHref} style={{ fontSize: 14 }}>
                View all calls
              </Link>
            </div>
            {callsList.map((c) => (
              <div key={c.theme} style={{ padding: '18px 0', borderBottom: '1px solid var(--line,#DCE1E6)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--muted,#505C68)' }}>
                  <span style={{ padding: '1px 7px', borderRadius: 2, fontWeight: 500, background: c.chipBg, color: c.chipFg }}>{c.status}</span> · Submission deadline: {c.deadline}
                </span>
                <Link href={cfpHref} style={{ fontFamily: 'var(--font-serif)', fontSize: 18, lineHeight: 1.35, color: 'var(--ink,#101B27)', fontWeight: 600 }}>
                  {c.theme}
                </Link>
                <span style={{ fontSize: 13, color: 'var(--muted,#505C68)' }}>Guest editors: {c.guest}</span>
              </div>
            ))}
            {callsList.length === 0 ? (
              <p style={{ margin: '16px 0 0', fontSize: 14, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)' }}>
                There are no open thematic calls at the moment. Regular submissions are welcome year-round.
              </p>
            ) : null}
          </section>

          <section>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderBottom: '2px solid var(--accent,#0B7265)', paddingBottom: 10 }}>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, color: 'var(--ink,#101B27)' }}>News and announcements</h2>
              <Link href="/#news" style={{ fontSize: 14 }}>
                All news
              </Link>
            </div>
            {newsItems.map((n) => (
              <article key={n.title} style={{ padding: '16px 0', borderBottom: '1px solid var(--line,#DCE1E6)', display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontSize: 12, color: 'var(--muted,#505C68)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--warm,#B5400F)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{n.type}</span> · {n.date}
                </span>
                <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink,#101B27)', lineHeight: 1.4 }}>{n.title}</span>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--ink-3,#3C4854)' }}>{n.summary}</p>
              </article>
            ))}
          </section>
        </div>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div style={{ border: '1px solid var(--line,#DCE1E6)', borderRadius: 3, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Submit to {j.code}</h2>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--ink-3,#3C4854)' }}>
              No submission fee and no APC during the launch period. Drafts save automatically and can be resumed from your dashboard.
            </p>
            <Link href={submitHref} style={{ background: 'var(--accent,#1D5DA8)', color: '#fff', padding: '10px 16px', borderRadius: 3, fontSize: 14, fontWeight: 500, textAlign: 'center', textDecoration: 'none' }}>
              Submit manuscript
            </Link>
            <Link href={guideHref} style={{ fontSize: 13, textAlign: 'center' }}>
              Read the author instructions first
            </Link>
          </div>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: 13, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink,#101B27)', paddingBottom: 10, borderBottom: '2px solid var(--accent,#0B7265)' }}>Editorial board</h2>
            {board.map((b) => (
              <div key={b.ini} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--line,#DCE1E6)', alignItems: 'center' }}>
                <span style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--line-soft,#EEF1F4)', color: 'var(--ink-3,#3C4854)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{b.ini}</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink,#101B27)' }}>{b.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--muted,#505C68)' }}>{b.role} · {b.aff}</span>
                </div>
              </div>
            ))}
          </div>
          <nav aria-label="Journal information">
            <h2 style={{ margin: 0, fontSize: 13, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink,#101B27)', paddingBottom: 10, borderBottom: '2px solid var(--accent,#0B7265)' }}>Journal information</h2>
            {groups.map((g) => (
              <div key={g.group} style={{ padding: '12px 0', borderBottom: '1px solid var(--line,#DCE1E6)' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3,#3C4854)' }}>{g.group}</span>
                <ul style={{ listStyle: 'none', margin: '6px 0 0', padding: 0, display: 'flex', flexWrap: 'wrap', gap: '4px 14px' }}>
                  {g.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} style={{ fontSize: 13 }}>
                        {l.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>
      </div>
    </>
  )
}
