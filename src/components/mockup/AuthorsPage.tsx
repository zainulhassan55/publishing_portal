'use client'

/**
 * Authors.dc.html, replicated verbatim per docs/REPLICATION.md.
 *
 * The only departures from the mockup markup:
 * - the template rows list each journal's real files from src/data/templates.ts
 *   (the mockup's generic rows linked to the section itself);
 * - the email-alert form posts to /api/alerts (202 → the mockup's success
 *   state) instead of flipping local state;
 * - the days-left countdown is computed client-side after mount so the
 *   statically rendered HTML never bakes in a build-time date.
 */

import Link from 'next/link'
import { useState } from 'react'
import { useToday } from '@/lib/hooks/client-state'
import { daysUntil } from '@/lib/format'
import { journalTemplates, magazineTemplates } from '@/data/templates'
import { periodicalBase } from '@/data/registry'
import { FormLauncher } from '@/components/forms/FormLauncher'
import { SectionToc } from '@/components/nav/SectionToc'

export type AuthorsJournalRef = { slug: string; code: string; title: string; magazine?: boolean }

export type AuthorsCall = {
  id: string
  journalSlug: string
  code: string
  theme: string
  guest: string
  deadlineIso: string
  /** Pre-formatted "31 October 2026" — deterministic, so safe to server-render. */
  deadline: string
  href: string
}


/** Mockup's status chip colours. */
const chip = (s: string): [string, string] =>
  s === 'Open'
    ? ['#E7F3EB', '#1E6B3A']
    : s === 'Closing soon'
      ? ['#FDF1DE', '#8A5300']
      : ['var(--line-soft,#EEF1F4)', 'var(--ink-3,#3C4854)']

const quick = [
  { h: 'Find a journal', p: 'Open-access journals and book series', href: '/journals' },
  { h: 'Prepare your manuscript', p: 'Templates and article-type limits', href: '#templates' },
  { h: 'Fees', p: 'No APC during the launch period', href: '#apc' },
  { h: 'Track a submission', p: 'Sign in to your author dashboard', href: '/sign-in' },
]

const nav = [
  ['#steps', 'How to submit'],
  ['#templates', 'Templates'],
  ['#types', 'Article types'],
  ['#apc', 'Open access and fees'],
  ['#cfp', 'Calls for papers'],
  ['#policies', 'Policies and ethics'],
  ['#reviewers', 'Reviewers and editors'],
  ['#alerts', 'Email alerts'],
].map(([href, label]) => ({ id: href.slice(1), label }))

const steps = [
  { n: '01', h: 'Journal and section', p: 'Choose the journal, article type and, if relevant, a special issue.' },
  { n: '02', h: 'Requirements', p: 'Confirm originality, ethics approval, anonymisation and template use.' },
  { n: '03', h: 'Metadata', p: 'Title, abstract (with word count), 3–8 keywords and subject categories.' },
  { n: '04', h: 'Authors', p: 'All authors with affiliations, ORCID iDs and CRediT contribution roles.' },
  { n: '05', h: 'Files', p: 'Anonymised manuscript, title page, figures, tables and supplementary files.' },
  { n: '06', h: 'Declarations', p: 'Funding, competing interests, data availability, AI use and suggested reviewers.' },
  { n: '07', h: 'Review and submit', p: 'Check everything in one view and submit. You receive a submission ID by email.' },
]

/** File extension badge from a download's format label, e.g. "Word (.docx)" → "DOCX". */
const extOf = (format: string) => (/\.(\w+)\)/.exec(format)?.[1] ?? '').toUpperCase()

/** "Manuscript template" → "manuscript template", for "IJIC manuscript template"; "LaTeX" keeps its casing. */
const lowerFirst = (label: string) => (label.startsWith('LaTeX') ? label : label.charAt(0).toLowerCase() + label.slice(1))

/** data.js typesTable, copied literally (see REPLICATION.md data map). */
const typesHead = ['Article type', 'Word limit', 'Abstract', 'Structure', 'Review model']
const typesRows = [
  ['Research Article', '8,000', 'Structured, 250 words', 'Introduction, Methods, Results, Discussion', 'Double-blind, 2+ reviewers'],
  ['Review', '10,000', 'Unstructured, 250 words', 'Free, with stated search method', 'Double-blind, 2+ reviewers'],
  ['Short Communication', '3,000', 'Unstructured, 150 words', 'Condensed IMRaD', 'Double-blind, 2+ reviewers'],
  ['Case Study', '5,000', 'Unstructured, 200 words', 'Context, Case, Analysis, Lessons', 'Double-blind, 2+ reviewers'],
  ['Perspective', '3,000', 'Unstructured, 150 words', 'Free', 'Double-blind, 2+ reviewers'],
  ['Editorial', '1,500', 'None', 'Free', 'Editor review'],
]

const policyGroups = [
  {
    h: 'Ethics and integrity',
    items: [
      { t: 'Publication ethics', href: '/policies/publication-ethics' },
      { t: 'Peer review policy', href: '/policies/peer-review-policy' },
      { t: 'Generative AI policy', href: '/policies/generative-ai-policy' },
      { t: 'Corrections and retractions', href: '/policies/corrections-retractions' },
    ],
  },
  {
    h: 'Access and data',
    items: [
      { t: 'Open access and licensing', href: '/policies/open-access' },
      { t: 'Copyright', href: '/policies/copyright-licensing' },
      { t: 'Research data policy', href: '/policies/research-data-policy' },
      { t: 'Archiving and preservation', href: '/policies/archiving-preservation' },
    ],
  },
  {
    h: 'Publisher',
    items: [
      { t: 'Complaints and appeals', href: '/policies/complaints-appeals' },
      { t: 'Privacy policy', href: '/policies/privacy' },
      { t: 'Advertising policy', href: '/policies/advertising' },
      { t: 'Accessibility statement', href: '/policies/accessibility' },
    ],
  },
]

export function AuthorsPage({ journals, calls }: { journals: AuthorsJournalRef[]; calls: AuthorsCall[] }) {
  const [cfpJ, setCfpJ] = useState('all')
  const [showClosed, setShowClosed] = useState(false)
  // Deadline countdowns depend on "today", which a statically generated page
  // does not know. Null until hydration; the badges render only after that.
  const todayIso = useToday()

  const cfps = calls
    .filter((c) => cfpJ === 'all' || c.journalSlug === cfpJ)
    .map((c) => {
      const dl = todayIso === null ? null : daysUntil(c.deadlineIso, todayIso)
      const status = dl === null ? null : dl < 0 ? 'Closed' : dl <= 30 ? 'Closing soon' : 'Open'
      const soon = dl !== null && dl > 0 && dl <= 30
      return {
        ...c,
        dl,
        status,
        soon,
        daysLeft: dl === null ? '' : dl > 0 ? dl + (dl === 1 ? ' day left' : ' days left') : 'Deadline passed',
      }
    })
    .filter((c) => showClosed || c.status !== 'Closed')
    .sort((a, b) => a.deadlineIso.localeCompare(b.deadlineIso))
  const noCfps = cfps.length === 0


  return (
    <>
      <style>{`body{margin:0;background:var(--page,#fff);color:var(--ink-2,#1F2A36);font-family:var(--font-sans);-webkit-font-smoothing:antialiased}a{color:var(--accent,#1D5DA8);text-decoration:none}a:hover{text-decoration:underline}*:focus-visible{outline:2px solid var(--accent,#1D5DA8);outline-offset:2px}html{scroll-behavior:smooth}
@keyframes ngiqPulse{0%,100%{box-shadow:0 0 0 0 rgba(165,42,42,.45)}50%{box-shadow:0 0 0 6px rgba(165,42,42,0)}}
.au-quick:hover{background:var(--surface-3,#FAFBFB)}
.au-policy:hover{color:var(--accent,#1D5DA8)}
.au-m-only{display:none}
@media (max-width:760px){
.au-toc{position:static!important;width:100%!important}
.au-step{grid-template-columns:28px minmax(0,1fr)!important;row-gap:4px!important}
.au-step>:nth-child(3){grid-column:2}
.au-tpl{flex-wrap:wrap;padding:13px 14px!important}
.au-tpl-st{flex-basis:100%;padding-left:58px}
.au-fees{min-width:0!important}
.au-cfp-r{grid-template-columns:64px minmax(0,1fr)!important;row-gap:8px!important}
.au-cfp-r>:nth-child(n+3){grid-column:2}
.au-cfp-r>:nth-child(3){flex-direction:row!important;flex-wrap:wrap}
.au-cfp-hx{display:none}
.au-m-only{display:inline}
.au-pol{row-gap:24px}
}`}</style>
      <div style={{ background: 'linear-gradient(135deg,var(--accent-tint,#F3F9F8) 25%,var(--accent-soft,#CDF0E7))', borderBottom: '1px solid var(--line,#DCE1E6)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px var(--shell-pad) 36px' }}>
          <nav aria-label="Breadcrumb" style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--muted,#505C68)' }}>
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span style={{ color: 'var(--ink-2,#1F2A36)' }}>For authors</span>
          </nav>
          <h1 style={{ margin: '18px 0 10px', fontFamily: 'var(--font-serif)', fontSize: 40, fontWeight: 600, color: 'var(--ink,#101B27)', letterSpacing: '-.01em' }}>For authors</h1>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)', maxWidth: '64ch' }}>Everything you need to prepare and submit a manuscript to a NextGenIQ Press journal: article types, templates, fees, ethics requirements and open calls. Book series proposals are made on each series’ Propose a volume page.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 0, marginTop: 28, border: '1px solid var(--line,#DCE1E6)', background: 'var(--surface,#fff)', borderRadius: 3 }}>
            {quick.map((q) =>
              q.href.startsWith('#') ? (
                <a key={q.h} href={q.href} className="au-quick" style={{ padding: '16px 18px', borderRight: '1px solid var(--line,#DCE1E6)', display: 'flex', flexDirection: 'column', gap: 4, textDecoration: 'none' }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink,#101B27)' }}>{q.h}</span>
                  <span style={{ fontSize: 13, color: 'var(--muted,#505C68)', lineHeight: 1.45 }}>{q.p}</span>
                </a>
              ) : (
                <Link key={q.h} href={q.href} className="au-quick" style={{ padding: '16px 18px', borderRight: '1px solid var(--line,#DCE1E6)', display: 'flex', flexDirection: 'column', gap: 4, textDecoration: 'none' }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink,#101B27)' }}>{q.h}</span>
                  <span style={{ fontSize: 13, color: 'var(--muted,#505C68)', lineHeight: 1.45 }}>{q.p}</span>
                </Link>
              ),
            )}
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px var(--shell-pad) 0', display: 'flex', gap: 56, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Kept on phones: here the list sits above the content, not below it. */}
        <div className="au-toc" style={{ width: 200, flexShrink: 0, position: 'sticky', top: 16 }}>
          <SectionToc entries={nav} hideOnMobile={false} />
        </div>
        <div id="main-content" className="m-full" style={{ flex: 1, minWidth: 300, maxWidth: 880, display: 'flex', flexDirection: 'column', gap: 64 }}>
          <section id="steps" data-sec="1" style={{ scrollMarginTop: 20 }}>
            <h2 style={{ margin: '0 0 6px', fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Submitting in seven steps</h2>
            <p style={{ margin: '0 0 20px', fontSize: 15, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)', maxWidth: '66ch' }}>The submission system saves your progress after every step. Most authors complete it in 20–30 minutes once files are prepared.</p>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0, borderTop: '2px solid #101B27' }}>
              {steps.map((s) => (
                <li key={s.n} className="au-step" style={{ display: 'grid', gridTemplateColumns: '40px 220px minmax(0,1fr)', gap: 16, padding: '14px 0', borderBottom: '1px solid var(--line,#DCE1E6)', alignItems: 'baseline' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted,#505C68)' }}>{s.n}</span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink,#101B27)' }}>{s.h}</span>
                  <span style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--ink-3,#3C4854)' }}>{s.p}</span>
                </li>
              ))}
            </ol>
            <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
              <Link href="/submit" style={{ background: 'var(--accent,#1D5DA8)', color: '#fff', padding: '10px 18px', borderRadius: 3, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Start a submission</Link>
              <Link href="/sign-in" style={{ border: '1px solid var(--line-strong,#B9C1C9)', color: 'var(--ink,#101B27)', padding: '9px 18px', borderRadius: 3, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Resume a draft</Link>
            </div>
          </section>

          <section id="templates" data-sec="1" style={{ scrollMarginTop: 20 }}>
            <h2 style={{ margin: '0 0 6px', fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Templates</h2>
            <p style={{ margin: '0 0 18px', fontSize: 15, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)', maxWidth: '66ch' }}>Each journal and magazine has its own Word and LaTeX templates, set up for double-blind review. Magazine templates use the shorter two-column magazine format. Book series chapter templates are on each series’ <Link href="/series">author and editor guidelines</Link> page.</p>
            <div style={{ border: '1px solid var(--line,#DCE1E6)', borderRadius: 3 }}>
              {journals.flatMap((j) =>
                ((j.magazine ? magazineTemplates : journalTemplates)(j.slug, j.code).downloads ?? []).map((d) => (
                  <div key={d.href} className="au-tpl" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', borderBottom: '1px solid var(--line-soft,#EEF1F4)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '3px 6px', border: '1px solid var(--line-strong,#B9C1C9)', borderRadius: 2, width: 44, textAlign: 'center' }}>{extOf(d.format)}</span>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink,#101B27)' }}>
                        {j.code} {lowerFirst(d.label)}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--muted,#505C68)' }}>{d.format}</span>
                    </div>
                    <a href={d.href} download className="au-tpl-st" style={{ fontSize: 13, fontWeight: 500 }}>
                      Download<span className="sr-only"> {j.code} {lowerFirst(d.label)}</span>
                    </a>
                  </div>
                )),
              )}
            </div>
          </section>

          <section id="types" data-sec="1" style={{ scrollMarginTop: 20 }}>
            <h2 style={{ margin: '0 0 16px', fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Article types</h2>
            <div style={{ overflowX: 'auto', borderTop: '2px solid #101B27' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 640 }}>
                <thead>
                  <tr>
                    {typesHead.map((h) => (
                      <th key={h} scope="col" style={{ textAlign: 'left', padding: '10px 12px 10px 0', fontSize: 12, color: 'var(--muted,#505C68)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', borderBottom: '1px solid var(--line-strong,#B9C1C9)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {typesRows.map((r) => (
                    <tr key={r[0]}>
                      {r.map((c, i) => (
                        <td key={i} style={{ padding: '11px 12px 11px 0', borderBottom: '1px solid var(--line,#DCE1E6)', verticalAlign: 'top', lineHeight: 1.45 }}>{c}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="apc" data-sec="1" style={{ scrollMarginTop: 20 }}>
            <h2 style={{ margin: '0 0 6px', fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Open access and fees</h2>
            <p style={{ margin: '0 0 18px', fontSize: 15, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)', maxWidth: '66ch' }}>All articles are published open access under CC BY 4.0. Copyright ownership and publishing rights are specified in the applicable publishing agreement and displayed with the work.</p>
            <div style={{ overflowX: 'auto', borderTop: '2px solid #101B27' }}>
              <table className="au-fees" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 560 }}>
                <thead>
                  <tr>
                    <th scope="col" style={{ textAlign: 'left', padding: '10px 12px 10px 0', fontSize: 12, color: 'var(--muted,#505C68)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', borderBottom: '1px solid var(--line-strong,#B9C1C9)' }}>Journal</th>
                    <th scope="col" style={{ textAlign: 'left', padding: '10px 12px', fontSize: 12, color: 'var(--muted,#505C68)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', borderBottom: '1px solid var(--line-strong,#B9C1C9)' }}>Submission fee</th>
                    <th scope="col" style={{ textAlign: 'left', padding: '10px 0 10px 12px', fontSize: 12, color: 'var(--muted,#505C68)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', borderBottom: '1px solid var(--line-strong,#B9C1C9)' }}>APC</th>
                  </tr>
                </thead>
                <tbody>
                  {journals.map((j) => (
                    <tr key={j.slug}>
                      <td style={{ padding: '10px 12px 10px 0', borderBottom: '1px solid var(--line,#DCE1E6)' }}>
                        <Link href={periodicalBase(j.slug)} style={{ color: 'var(--ink,#101B27)' }}>{j.title}</Link>{' '}
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted,#505C68)' }}>{j.code}</span>
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--line,#DCE1E6)' }}>None</td>
                      <td style={{ padding: '10px 0 10px 12px', borderBottom: '1px solid var(--line,#DCE1E6)' }}>None during launch period</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ margin: '14px 0 0', fontSize: 14, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)', maxWidth: '72ch' }}>Any introduction of, or change to, article processing charges (APCs) will be announced at least six months before taking effect and will apply only to manuscripts submitted on or after the effective date. Full or partial waivers will be available under the publisher’s published waiver policy, with priority given to authors based in low- and lower-middle-income countries and those facing financial hardship. Waiver requests will be handled confidentially by the publishing office and will not be disclosed to handling editors or reviewers. Editorial decisions will be made independently of authors’ ability to pay.</p>
          </section>

          <section id="cfp" data-sec="1" style={{ scrollMarginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Calls for papers and special issues</h2>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ fontSize: 13, color: 'var(--ink-3,#3C4854)', display: 'flex', gap: 6, alignItems: 'center' }}>
                  Journal{' '}
                  <select value={cfpJ} onChange={(e) => setCfpJ(e.target.value)} style={{ font: 'inherit', fontSize: 13, padding: '5px 8px', border: '1px solid var(--line-strong,#B9C1C9)', borderRadius: 3, background: 'var(--surface,#fff)' }}>
                    <option value="all">All journals</option>
                    {journals.map((j) => (
                      <option key={j.slug} value={j.slug}>{j.code}</option>
                    ))}
                  </select>
                </label>
                <label style={{ fontSize: 13, color: 'var(--ink-3,#3C4854)', display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input type="checkbox" checked={showClosed} onChange={() => setShowClosed((s) => !s)} style={{ accentColor: 'var(--accent,#1D5DA8)' }} />Show closed
                </label>
              </div>
            </div>
            <div role="table" style={{ borderTop: '2px solid #101B27' }}>
              <div role="row" className="au-cfp-r" style={{ display: 'grid', gridTemplateColumns: '80px minmax(0,1fr) 130px 140px', gap: 16, padding: '10px 0', borderBottom: '1px solid var(--line-strong,#B9C1C9)', fontSize: 12, color: 'var(--muted,#505C68)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>
                <span role="columnheader">Journal</span>
                <span role="columnheader">Theme</span>
                <span role="columnheader" className="au-cfp-hx">Status</span>
                <span role="columnheader" className="au-cfp-hx">Deadline ↑</span>
              </div>
              {cfps.map((c) => {
                const [bg, fg] = c.status === null ? ['transparent', 'transparent'] : chip(c.status)
                return (
                  <div key={c.id} role="row" className="au-cfp-r" style={{ display: 'grid', gridTemplateColumns: '80px minmax(0,1fr) 130px 140px', gap: 16, padding: '14px 0', borderBottom: '1px solid var(--line,#DCE1E6)', alignItems: 'baseline' }}>
                    <span role="cell" style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{c.code}</span>
                    <div role="cell" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <Link href={c.href} style={{ fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 600, color: 'var(--ink,#101B27)', lineHeight: 1.35 }}>{c.theme}</Link>
                      <span style={{ fontSize: 13, color: 'var(--muted,#505C68)' }}>Guest editor: {c.guest}</span>
                    </div>
                    <span role="cell" style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                      {c.status !== null ? (
                        <>
                          <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 2, fontWeight: 500, background: bg, color: fg }}>{c.status}</span>
                          <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 2, fontWeight: 600, background: c.soon ? '#FBEAEA' : 'var(--surface-2,#F5F6F7)', color: c.soon ? '#A52A2A' : 'var(--ink-3,#3C4854)', animation: c.soon ? 'ngiqPulse 1.8s ease-in-out infinite' : 'none' }}>{c.daysLeft}</span>
                        </>
                      ) : null}
                    </span>
                    <span role="cell" style={{ fontSize: 14, color: 'var(--ink-2,#1F2A36)' }}><span className="au-m-only">Deadline: </span>{c.deadline}</span>
                  </div>
                )
              })}
              {noCfps ? (
                <p style={{ padding: '20px 0', margin: 0, fontSize: 14, color: 'var(--ink-3,#3C4854)' }}>No open calls for this journal. Regular submissions within scope are welcome at any time.</p>
              ) : null}
            </div>
            <p style={{ margin: '14px 0 0', fontSize: 14, color: 'var(--ink-3,#3C4854)' }}>Planning a special issue? <Link href="/editors/special-issues">Read the special issue guidelines</Link>.</p>
          </section>

          <section id="policies" data-sec="1" style={{ scrollMarginTop: 20 }}>
            <h2 style={{ margin: '0 0 16px', fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Policies and ethics</h2>
            <div className="au-pol" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', columnGap: 40 }}>
              {policyGroups.map((g) => (
                <div key={g.h}>
                  <span style={{ display: 'block', fontSize: 12, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-3,#3C4854)', fontWeight: 600, paddingBottom: 8, borderBottom: '2px solid var(--accent,#0B7265)' }}>{g.h}</span>
                  {g.items.map((p) => (
                    <Link key={p.t} href={p.href} className="au-policy" style={{ display: 'block', padding: '10px 0', borderBottom: '1px solid var(--line,#DCE1E6)', fontSize: 14, color: 'var(--ink,#101B27)' }}>{p.t}</Link>
                  ))}
                </div>
              ))}
            </div>
          </section>

          <section id="reviewers" data-sec="1" style={{ scrollMarginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 32, borderTop: '2px solid #101B27', paddingTop: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--ink,#101B27)' }}>For reviewers</h2>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)' }}>Contribute your expertise to rigorous and constructive peer review. Explore our reviewer guidelines, ethical responsibilities, and opportunities to review submissions in your field.</p>
              <Link href="/reviewers" style={{ fontSize: 14, fontWeight: 500 }}>Reviewer guidelines</Link>
              <Link href="/reviewers#become-a-reviewer" style={{ fontSize: 14, fontWeight: 500 }}>Become a reviewer</Link>
            </div>
            <div id="editors" style={{ display: 'flex', flexDirection: 'column', gap: 8, scrollMarginTop: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--ink,#101B27)' }}>For editors</h2>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)' }}>Help shape the direction of scholarly publishing in your field. Express your interest in joining an editorial board, propose a journal special issue, or submit a proposal for an edited book or conference proceedings.</p>
              <Link href="/editors#join-a-board" style={{ fontSize: 14, fontWeight: 500 }}>Join an editorial board</Link>
              <Link href="/editors/special-issues" style={{ fontSize: 14, fontWeight: 500 }}>Special issue guidelines</Link>
              <Link href="/propose-journal" style={{ fontSize: 14, fontWeight: 500 }}>Submit a new journal proposal</Link>
            </div>
            <div id="librarians" style={{ display: 'flex', flexDirection: 'column', gap: 8, scrollMarginTop: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--ink,#101B27)' }}>For librarians</h2>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)' }}>Explore our publications and find the information needed to support discovery, access, and collection development. Consult individual title pages for indexing status, identifiers, access options, licensing terms, and available preservation information.</p>
              <Link href="/librarians#browse-publications" style={{ fontSize: 14, fontWeight: 500 }}>Browse publications</Link>
              <Link href="/librarians#indexing-and-discovery" style={{ fontSize: 14, fontWeight: 500 }}>Indexing and discovery</Link>
              <Link href="/librarians#access-and-licensing" style={{ fontSize: 14, fontWeight: 500 }}>Access and licensing</Link>
            </div>
          </section>

          <FormLauncher
            id="alerts"
            href="/alerts/form"
            title="Email alerts"
            description="Receive new tables of contents and calls for papers for the journals you choose. Unsubscribe at any time."
            label="Subscribe to alerts"
          />
        </div>
      </div>
    </>
  )
}
