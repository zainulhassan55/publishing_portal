'use client'

/**
 * Home.dc.html replicated verbatim (populated/"mature" branch).
 * Markup and inline styles are copied 1:1 from the mockup; the only mechanical
 * translations are those mandated by docs/REPLICATION.md (sc-for → map,
 * sc-if → ternary, {{ }} → {}, style-hover → the .hm-hov-* rules in the
 * <style> block below, image-slot → <img>, mockup hrefs → routes).
 */

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useHydrated, usePrefersReducedMotion } from '@/lib/hooks/client-state'
import { daysUntil, deadlineLabel, deadlineState } from '@/lib/format'

export type HomeMetric = { v: string; l: string }

export type HomeArticle = {
  id: string
  href: string
  thumb: string
  code: string
  type: string
  date: string
  title: string
  authorLine: string
  doi: string
}

export type HomeCall = {
  id: string
  code: string
  theme: string
  deadline: string
  deadlineIso: string
  jTitle: string
  guestName: string
  href: string
}

export type HomeJournal = {
  slug: string
  code: string
  title: string
  subject: string
  color: string
  scope: string
  href: string
  submit: string
  hasIndex: boolean
  index: string
  m1l: string
  m1: string
  m2l: string
  m2: string
}

export type HomeNews = { type: string; date: string; title: string; summary: string }

type Props = {
  metrics: HomeMetric[]
  featured: HomeArticle[]
  calls: HomeCall[]
  journals: HomeJournal[]
  news: HomeNews[]
}

const HERO = [
  { src: '/images/home/hero-lab.png', alt: 'Hero image — laboratory' },
  { src: '/images/home/hero-library.png', alt: 'Hero image — library' },
  { src: '/images/home/hero-network.png', alt: 'Hero image — research network' },
]

/* Audience carousel content — copied from the mockup's AUD array; hrefs mapped
   per the REPLICATION.md URL table. */
const AUD = [
  {
    who: 'Authors',
    headline: 'Publish with us',
    desc: 'Prepare, submit and track your manuscript. No submission fee or APC during the launch period.',
    links: [
      { t: 'Submit a manuscript', href: '/submit' },
      { t: 'Author instructions', href: '/journals/ijdh/author-instructions' },
      { t: 'Fees and waivers', href: '/authors#apc' },
    ],
  },
  {
    who: 'Reviewers',
    headline: 'Review for our journals',
    desc: 'Assess research in your field and receive recognition on your ORCID record.',
    links: [
      { t: 'Become a reviewer', href: '/sign-in' },
      { t: 'Reviewer guidelines', href: '/journals/ijdh/reviewer-guidelines' },
      { t: 'Open review invitations', href: '/dashboard' },
    ],
  },
  {
    who: 'Editors',
    headline: 'Shape a journal',
    desc: 'Join a founding editorial board or lead a special issue on an emerging topic.',
    links: [
      { t: 'Join an editorial board', href: '/journals/ijdh/editorial-board' },
      { t: 'Propose a special issue', href: '/journals/ijdh/special-issue-guidelines' },
      { t: 'Propose a book or proceedings', href: '/journals#series' },
    ],
  },
  {
    who: 'Librarians',
    headline: 'Evaluate our titles',
    desc: 'Indexing status, identifiers, licensing and preservation for every journal.',
    links: [
      { t: 'Indexing status', href: '/journals/ijdh/indexing' },
      { t: 'Licensing and copyright', href: '/journals/ijdh/copyright-licensing' },
      { t: 'Open access policy', href: '/journals/ijdh/open-access' },
    ],
  },
]

const FLOW = [
  { n: 1, h: 'Submission', t: 'Online, 7 steps' },
  { n: 2, h: 'Technical check', t: '3 working days' },
  { n: 3, h: 'Editorial assessment', t: '7 days' },
  { n: 4, h: 'Peer review', t: '4–6 weeks' },
  { n: 5, h: 'First decision', t: 'Target 6 weeks' },
  { n: 6, h: 'Published online', t: '3 weeks after acceptance' },
]

const POLICIES = [
  ['Editorial policies', 'peer-review-process'],
  ['Publication ethics', 'publication-ethics'],
  ['Open access policy', 'open-access'],
  ['Peer review policy', 'peer-review-process'],
  ['Licensing and copyright', 'copyright-licensing'],
  ['Generative AI policy', 'generative-ai-policy'],
  ['Research data policy', 'research-data-policy'],
  ['Corrections and retractions', 'corrections-retractions'],
].map(([t, p]) => ({ t, href: `/journals/ijdh/${p}` }))

const DUR = 6000

/* Status chip colours — the mockup's chip() helper. */
const chip = (s: string): [string, string] =>
  s === 'Open'
    ? ['#E7F3EB', '#1E6B3A']
    : s === 'Closing soon'
      ? ['#FDF1DE', '#8A5300']
      : ['var(--line-soft,#EEF1F4)', 'var(--ink-3,#3C4854)']

export function HomePage({ metrics, featured, calls, journals, news }: Props) {
  const [aud, setAud] = useState(0)
  const [tick, setTick] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hover, setHover] = useState(false)
  const [flip, setFlip] = useState<string | null>(null)
  const [heroIdx, setHeroIdx] = useState(0)
  const [heroPaused, setHeroPaused] = useState(false)
  /* Countdown is computed client-side after hydration so the static HTML
     carries only the deadline date and never a stale "N days left". */
  const mounted = useHydrated()
  const reduceMotion = usePrefersReducedMotion()

  /* Reduced motion forces both rotations off; the reader can still restart
     them with the visible controls, which is why it is OR-ed, not assigned. */
  const heroHeld = heroPaused || reduceMotion
  const audHeld = paused || reduceMotion

  useEffect(() => {
    if (heroHeld) return
    const heroT = setInterval(() => {
      if (!document.hidden) setHeroIdx((i) => (i + 1) % 3)
    }, 4000)
    return () => clearInterval(heroT)
  }, [heroHeld])

  const pick = (i: number) => {
    setAud(i)
    setTick((t) => t + 1)
    setPaused(true)
  }

  const playing = !audHeld && !hover
  const prev = (heroIdx + 2) % 3

  return (
    <>
      <style>{`@keyframes ngiqFillA{from{width:0}to{width:100%}}@keyframes ngiqFillB{from{width:0}to{width:100%}}@keyframes ngiqRise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}@keyframes ngiqPulse{0%,100%{box-shadow:0 0 0 0 rgba(165,42,42,.45)}50%{box-shadow:0 0 0 6px rgba(165,42,42,0)}}@keyframes ngiqLineFill{0%{transform:scaleY(0)}3%,14%{transform:scaleY(0)}19.66%,30.66%{transform:scaleY(0.2)}36.32%,47.32%{transform:scaleY(0.4)}52.98%,63.98%{transform:scaleY(0.6)}69.64%,80.64%{transform:scaleY(0.8)}86.3%,97.3%{transform:scaleY(1)}96%{transform:scaleY(1)}100%{transform:scaleY(0)}}@keyframes ngiqStep0{0%,2.50%{background:var(--page,#fff);border-color:var(--brand,#0F2B46);color:var(--brand,#0F2B46);box-shadow:0 0 0 0 rgba(30,107,58,0)}3%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 0 rgba(30,107,58,.45)}7%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 7px rgba(30,107,58,.18)}14%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 7px rgba(30,107,58,.18)}16%,96%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 0 rgba(30,107,58,0)}100%{background:var(--page,#fff);border-color:var(--brand,#0F2B46);color:var(--brand,#0F2B46);box-shadow:0 0 0 0 rgba(30,107,58,0)}}@keyframes ngiqStep1{0%,19.16%{background:var(--page,#fff);border-color:var(--brand,#0F2B46);color:var(--brand,#0F2B46);box-shadow:0 0 0 0 rgba(30,107,58,0)}19.66%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 0 rgba(30,107,58,.45)}23.66%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 7px rgba(30,107,58,.18)}30.66%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 7px rgba(30,107,58,.18)}32.66%,96%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 0 rgba(30,107,58,0)}100%{background:var(--page,#fff);border-color:var(--brand,#0F2B46);color:var(--brand,#0F2B46);box-shadow:0 0 0 0 rgba(30,107,58,0)}}@keyframes ngiqStep2{0%,35.82%{background:var(--page,#fff);border-color:var(--brand,#0F2B46);color:var(--brand,#0F2B46);box-shadow:0 0 0 0 rgba(30,107,58,0)}36.32%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 0 rgba(30,107,58,.45)}40.32%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 7px rgba(30,107,58,.18)}47.32%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 7px rgba(30,107,58,.18)}49.32%,96%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 0 rgba(30,107,58,0)}100%{background:var(--page,#fff);border-color:var(--brand,#0F2B46);color:var(--brand,#0F2B46);box-shadow:0 0 0 0 rgba(30,107,58,0)}}@keyframes ngiqStep3{0%,52.48%{background:var(--page,#fff);border-color:var(--brand,#0F2B46);color:var(--brand,#0F2B46);box-shadow:0 0 0 0 rgba(30,107,58,0)}52.98%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 0 rgba(30,107,58,.45)}56.98%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 7px rgba(30,107,58,.18)}63.98%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 7px rgba(30,107,58,.18)}65.98%,96%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 0 rgba(30,107,58,0)}100%{background:var(--page,#fff);border-color:var(--brand,#0F2B46);color:var(--brand,#0F2B46);box-shadow:0 0 0 0 rgba(30,107,58,0)}}@keyframes ngiqStep4{0%,69.14%{background:var(--page,#fff);border-color:var(--brand,#0F2B46);color:var(--brand,#0F2B46);box-shadow:0 0 0 0 rgba(30,107,58,0)}69.64%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 0 rgba(30,107,58,.45)}73.64%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 7px rgba(30,107,58,.18)}80.64%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 7px rgba(30,107,58,.18)}82.64%,96%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 0 rgba(30,107,58,0)}100%{background:var(--page,#fff);border-color:var(--brand,#0F2B46);color:var(--brand,#0F2B46);box-shadow:0 0 0 0 rgba(30,107,58,0)}}@keyframes ngiqStep5{0%,85.80%{background:var(--page,#fff);border-color:var(--brand,#0F2B46);color:var(--brand,#0F2B46);box-shadow:0 0 0 0 rgba(30,107,58,0)}86.3%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 0 rgba(30,107,58,.45)}90.3%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 7px rgba(30,107,58,.18)}97.3%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 7px rgba(30,107,58,.18)}99.3%,96%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 0 rgba(30,107,58,0)}100%{background:var(--page,#fff);border-color:var(--brand,#0F2B46);color:var(--brand,#0F2B46);box-shadow:0 0 0 0 rgba(30,107,58,0)}}@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}a{color:var(--accent,#1D5DA8);text-decoration:none}a:hover{text-decoration:underline}*:focus-visible{outline:2px solid var(--accent,#1D5DA8);outline-offset:2px}.hm-hov-zoom:hover{transform:scale(1.05)}.hm-hov-link:hover{color:var(--accent,#1D5DA8)!important}.hm-hov-aud:hover{padding-left:6px!important;color:var(--accent,#1D5DA8)!important}`}</style>

      <section style={{ background: 'linear-gradient(135deg,var(--accent-tint,#F3F9F8) 25%,var(--accent-soft,#CDF0E7))', borderBottom: '1px solid var(--line,#DCE1E6)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '62%' }}>
          {HERO.map((h, n) => {
            const on = n === heroIdx
            return (
              <div key={h.src} aria-hidden={on ? 'false' : 'true'} style={{ position: 'absolute', inset: 0, opacity: on ? 1 : 0, transform: on ? 'translateX(0) scale(1)' : n === prev ? 'translateX(-6%) scale(1.02)' : 'translateX(6%) scale(1.02)', transition: 'opacity 1s ease,transform 1.2s cubic-bezier(.2,.7,.2,1)', pointerEvents: on ? 'auto' : 'none' }}>
                <img src={h.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            )
          })}
          <div style={{ position: 'absolute', right: 20, bottom: 16, zIndex: 3, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(16,27,39,.55)', padding: '6px 10px', borderRadius: 14 }}>
            {[0, 1, 2].map((i) => (
              <button key={i} onClick={() => setHeroIdx(i)} aria-label={`Show image ${i + 1}`} aria-current={i === heroIdx ? 'true' : 'false'} style={{ width: i === heroIdx ? '22px' : '8px', height: 8, borderRadius: 4, border: 0, padding: 0, cursor: 'pointer', background: i === heroIdx ? '#fff' : 'rgba(255,255,255,.5)', transition: 'width .35s ease,background .35s ease' }}></button>
            ))}
            <button onClick={() => setHeroPaused((p) => !p)} aria-label={heroHeld ? 'Play slideshow' : 'Pause slideshow'} style={{ border: 0, background: 'none', color: '#fff', font: 'inherit', fontSize: 11, cursor: 'pointer', padding: '0 0 0 4px' }}>{heroHeld ? 'Play' : 'Pause'}</button>
          </div>
        </div>
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(90deg,var(--accent-tint,#F3F9F8) 0%,var(--accent-tint,#F3F9F8) 38%,color-mix(in srgb,var(--accent-tint,#F3F9F8) 85%,transparent) 50%,transparent 75%)' }}></div>
        <div style={{ position: 'relative', pointerEvents: 'none', maxWidth: 1280, margin: '0 auto', padding: '72px 32px 68px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,440px),1fr))', gap: 56, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, pointerEvents: 'auto' }}>
            <span style={{ fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--warm,#B5400F)', fontWeight: 600 }}>Peer-reviewed · Open access · Continuous publication</span>
            <h1 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 44, lineHeight: 1.12, fontWeight: 600, color: 'var(--ink,#101B27)', letterSpacing: '-.015em', textWrap: 'balance' }}>Research in digital, computational and interdisciplinary science, published openly.</h1>
            <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)', maxWidth: '62ch', textWrap: 'pretty' }}>NextGenIQ Press publishes ten double-blind peer-reviewed journals, two book series and two proceedings series. Every article is free to read and reuse under a CC BY 4.0 licence.</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/submit" style={{ background: 'var(--accent,#1D5DA8)', color: '#fff', padding: '11px 20px', borderRadius: 3, fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>Submit a manuscript</Link>
              <Link href="/journals" style={{ background: 'var(--surface,#fff)', border: '1px solid var(--line-strong,#B9C1C9)', color: 'var(--ink,#101B27)', padding: '10px 20px', borderRadius: 3, fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>Browse journals</Link>
            </div>
          </div>
          <div style={{ background: 'var(--surface,#fff)', border: '1px solid var(--line,#DCE1E6)', borderRadius: 3, pointerEvents: 'auto', boxShadow: '0 8px 24px rgba(16,27,39,.10)', maxWidth: 520, justifySelf: 'end', width: '100%' }}>
            <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocus={() => setHover(true)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px 0' }}>
                <h2 style={{ margin: 0, fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted,#505C68)', fontWeight: 600 }}>Start here</h2>
                <button onClick={() => setPaused((p) => !p)} aria-label={paused ? 'Resume rotation' : 'Pause rotation'} style={{ border: '1px solid var(--line,#DCE1E6)', background: 'var(--surface,#fff)', borderRadius: 2, padding: '2px 8px', font: 'inherit', fontSize: 11, color: 'var(--ink-3,#3C4854)', cursor: 'pointer' }}>{paused ? 'Play' : 'Pause'}</button>
              </div>
              <div role="tablist" aria-label="Choose your role" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', padding: '10px 20px 0', borderBottom: '1px solid var(--line,#DCE1E6)' }}>
                {AUD.map((t, i) => (
                  <button key={t.who} role="tab" aria-selected={i === aud ? 'true' : 'false'} onClick={() => pick(i)} style={{ border: 0, background: 'none', padding: '8px 0 10px', font: 'inherit', fontSize: 14, fontWeight: i === aud ? 600 : 500, color: i === aud ? 'var(--ink,#101B27)' : 'var(--muted,#505C68)', cursor: 'pointer', position: 'relative', textAlign: 'left', transition: 'color .2s' }}>
                    {t.who}
                    <span style={{ position: 'absolute', left: 0, right: 8, bottom: -1, height: 2, background: 'var(--line-soft,#EEF1F4)' }}></span>
                    <span
                      style={{ position: 'absolute', left: 0, bottom: -1, height: 2, background: 'var(--accent,#1D5DA8)', width: '0', animation: i === aud ? `${tick % 2 ? 'ngiqFillA' : 'ngiqFillB'} ${DUR}ms linear forwards` : 'none', animationPlayState: playing ? 'running' : 'paused' }}
                      onAnimationEnd={() => {
                        setAud((v) => (v + 1) % 4)
                        setTick((v) => v + 1)
                      }}
                    ></span>
                  </button>
                ))}
              </div>
              <div style={{ display: 'grid', padding: '20px 20px 22px', minHeight: 236 }}>
                {AUD.map((a, i) => {
                  const on = i === aud
                  return (
                    <div key={a.who} role="tabpanel" aria-hidden={on ? 'false' : 'true'} style={{ gridArea: '1/1', display: 'flex', flexDirection: 'column', gap: 12, opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(10px)', visibility: on ? 'visible' : 'hidden', transition: 'opacity .45s ease,transform .45s ease,visibility .45s' }}>
                      <span style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 600, color: 'var(--ink,#101B27)' }}>{a.headline}</span>
                      <span style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--ink-3,#3C4854)' }}>{a.desc}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--line-soft,#EEF1F4)' }}>
                        {a.links.map((l, k) => {
                          const delay = on ? `${120 + k * 70}ms` : '0ms'
                          return (
                            <Link key={l.t} href={l.href} className="hm-hov-aud" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--line-soft,#EEF1F4)', fontSize: 14, fontWeight: 500, color: 'var(--ink,#101B27)', textDecoration: 'none', opacity: on ? 1 : 0, transform: on ? 'none' : 'translateX(-8px)', transition: `opacity .4s ease ${delay},transform .4s ease ${delay},padding-left .2s` }}>
                              {l.t}<span aria-hidden="true" style={{ color: 'var(--accent,#1D5DA8)' }}>→</span>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Key metrics" style={{ background: 'linear-gradient(100deg,var(--brand,#0F2B46),color-mix(in oklab,var(--brand,#0F2B46) 52%,var(--accent,#0C8375)))' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
          {metrics.map((m) => (
            <div key={m.l} style={{ padding: '24px 24px 24px 0', display: 'flex', flexDirection: 'column', gap: 4, borderRight: '1px solid rgba(255,255,255,.16)' }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 600, color: '#fff', fontVariantNumeric: 'tabular-nums', letterSpacing: '-.01em' }} data-count="1">{m.v}</span>
              <span style={{ fontSize: 13, color: '#C3CFDB' }}>{m.l}</span>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 32px 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderBottom: '2px solid var(--accent,#0B7265)', paddingBottom: 10 }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Featured articles</h2>
          <Link href="/search?tab=articles" style={{ fontSize: 14 }}>View all articles</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,290px),1fr))', gap: '0 32px' }}>
          {featured.map((a, i) => (
            <article key={a.id} style={{ padding: '20px 0', borderBottom: '1px solid var(--line,#DCE1E6)', display: 'flex', flexDirection: 'column', gap: 8, animation: 'ngiqRise .6s ease both', animationDelay: `${i * 70}ms` }}>
              <Link href={a.href} tabIndex={-1} aria-hidden="true" style={{ display: 'block', position: 'relative', aspectRatio: '16/9', overflow: 'hidden', borderRadius: 2, marginBottom: 6, background: 'var(--surface-2,#F5F6F7)' }}>
                <div className="hm-hov-zoom" style={{ position: 'absolute', inset: 0, transition: 'transform .6s ease' }}>
                  <img src={a.thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
                <span style={{ position: 'absolute', left: 8, top: 8, background: 'color-mix(in srgb,var(--accent-dark,#0A685C) 90%,transparent)', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 11, padding: '2px 6px', borderRadius: 2, pointerEvents: 'none' }}>{a.code}</span>
              </Link>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12 }}>
                <span style={{ fontWeight: 600, color: 'var(--warm,#B5400F)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{a.type}</span>
                <span style={{ color: 'var(--muted,#505C68)' }}>{a.date}</span>
              </div>
              <Link href={a.href} className="hm-hov-link" style={{ fontFamily: 'var(--font-serif)', fontSize: 17, lineHeight: 1.38, color: 'var(--ink,#101B27)', fontWeight: 600, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.title}</Link>
              <span style={{ fontSize: 13, color: 'var(--ink-2,#1F2A36)' }}>{a.authorLine}</span>
              <span style={{ fontSize: 12, color: 'var(--muted,#505C68)', display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 'auto' }}><span style={{ fontStyle: 'italic', color: 'var(--ink-2,#1F2A36)' }}>{a.code}</span>·<span style={{ fontFamily: 'var(--font-mono)' }}>DOI: {a.doi}</span></span>
            </article>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 32px 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', borderBottom: '2px solid var(--accent,#0B7265)', paddingBottom: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Calls for papers</h2>
            <span style={{ fontSize: 14, color: 'var(--muted,#505C68)' }}>Thematic collections led by guest editors. Regular submissions are welcome year-round.</span>
          </div>
          <Link href="/authors#cfp" style={{ fontSize: 14 }}>All calls</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,280px),1fr))', gap: 20, marginTop: 20 }}>
          {calls.map((c) => {
            const state = mounted ? deadlineState(c.deadlineIso) : null
            const dl = mounted ? daysUntil(c.deadlineIso) : 0
            const status = state === 'closed' ? 'Closed' : state === 'closing-soon' ? 'Closing soon' : 'Open'
            const soon = state === 'closing-soon'
            const [bg, fg] = chip(status)
            return (
              <div key={c.id} style={{ background: 'color-mix(in srgb,var(--warm,#C2410C) 6%,var(--surface,#fff))', border: '1px solid var(--line,#DCE1E6)', borderTop: '3px solid var(--warm,#C2410C)', borderRadius: 3, padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-2,#1F2A36)' }}>{c.code}</span>
                  <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {mounted ? (
                      <>
                        <span style={{ padding: '1px 7px', borderRadius: 2, fontWeight: 600, fontVariantNumeric: 'tabular-nums', background: soon ? '#FBEAEA' : 'var(--surface-2,#F5F6F7)', color: soon ? '#A52A2A' : 'var(--ink-3,#3C4854)', animation: soon && dl > 0 ? 'ngiqPulse 1.8s ease-in-out infinite' : 'none' }}>{deadlineLabel(c.deadlineIso)}</span>
                        <span style={{ padding: '1px 7px', borderRadius: 2, fontWeight: 500, background: bg, color: fg }}>{status}</span>
                      </>
                    ) : null}
                  </span>
                </div>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: 17, lineHeight: 1.35, fontWeight: 600, color: 'var(--ink,#101B27)' }}>{c.theme}</span>
                <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '4px 10px', fontSize: 13 }}>
                  <dt style={{ color: 'var(--muted,#505C68)' }}>Deadline</dt><dd style={{ margin: 0, color: 'var(--ink,#101B27)', fontWeight: 500 }}>{c.deadline}</dd>
                  <dt style={{ color: 'var(--muted,#505C68)' }}>Journal</dt><dd style={{ margin: 0, color: 'var(--ink-2,#1F2A36)' }}>{c.jTitle}</dd>
                  <dt style={{ color: 'var(--muted,#505C68)' }}>Guest editor</dt><dd style={{ margin: 0, color: 'var(--ink-2,#1F2A36)' }}>{c.guestName}</dd>
                </dl>
                <Link href={c.href} style={{ marginTop: 'auto', fontSize: 14, fontWeight: 500 }}>View details</Link>
              </div>
            )
          })}
        </div>
      </section>

      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 32px 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderBottom: '2px solid var(--accent,#0B7265)', paddingBottom: 10 }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Featured journals</h2>
          <Link href="/journals" style={{ fontSize: 14 }}>Browse all journals</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,280px),1fr))', gap: 20, marginTop: 20 }}>
          {journals.map((j) => {
            const lifted = flip === j.slug
            return (
              <div key={j.slug} onMouseEnter={() => setFlip(j.slug)} onMouseLeave={() => setFlip((f) => (f === j.slug ? null : f))} onFocus={() => setFlip(j.slug)} onBlur={() => setFlip((f) => (f === j.slug ? null : f))} style={{ perspective: 1100, height: 256 }}>
                <div style={{ position: 'relative', height: '100%', transformStyle: 'preserve-3d', transition: 'transform .7s cubic-bezier(.2,.7,.2,1)', transform: 'none' }}>
                  <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', background: 'var(--surface,#fff)', border: '1px solid var(--line,#DCE1E6)', borderTop: `3px solid ${j.color}`, borderRadius: 3, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', gap: 14, padding: 16 }}>
                      <Link href={j.href} tabIndex={-1} aria-hidden="true" style={{ transition: 'transform .35s ease,box-shadow .35s ease', transform: lifted ? 'translateY(-4px)' : 'none', boxShadow: lifted ? '0 8px 16px rgba(0,0,0,.25)' : 'none', width: 64, height: 86, flexShrink: 0, background: 'var(--brand,#0F2B46)', borderTop: `4px solid ${j.color}`, borderRadius: 2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 6, boxSizing: 'border-box', textDecoration: 'none' }}><span style={{ fontFamily: 'var(--font-serif)', fontSize: 13, fontWeight: 600, color: '#fff' }}>{j.code}</span><span style={{ fontSize: 5.5, lineHeight: 1.3, color: '#C3CFDB' }}>{j.title}</span></Link>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                        <Link href={j.href} style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 600, color: 'var(--ink,#101B27)', lineHeight: 1.3 }}>{j.title}</Link>
                        <span style={{ fontSize: 12, color: 'var(--muted,#505C68)' }}>ISSN: applied for</span>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--ink-3,#3C4854)', padding: '1px 6px', border: '1px solid var(--line,#DCE1E6)', borderRadius: 2 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: j.color }}></span>{j.subject}</span>
                          {j.hasIndex ? <span style={{ fontSize: 11, fontWeight: 500, padding: '1px 6px', borderRadius: 2, background: '#E7F3EB', color: '#1E6B3A', border: '1px solid #B9DCC4' }}>{j.index}</span> : null}
                        </div>
                      </div>
                    </div>
                    <dl style={{ margin: 'auto 0 0', display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid var(--line-soft,#EEF1F4)' }}>
                      <div style={{ padding: '10px 16px', borderRight: '1px solid var(--line-soft,#EEF1F4)' }}><dt style={{ fontSize: 11, color: 'var(--muted,#505C68)' }}>{j.m1l}</dt><dd style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 600, color: 'var(--ink,#101B27)', fontVariantNumeric: 'tabular-nums' }}>{j.m1}</dd></div>
                      <div style={{ padding: '10px 16px' }}><dt style={{ fontSize: 11, color: 'var(--muted,#505C68)' }}>{j.m2l}</dt><dd style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 600, color: 'var(--ink,#101B27)', fontVariantNumeric: 'tabular-nums' }}>{j.m2}</dd></div>
                    </dl>
                    <Link href={j.submit} style={{ margin: '12px 16px 14px', textAlign: 'center', background: 'var(--accent-dark,#0A685C)', color: '#fff', padding: 8, borderRadius: 3, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Submit</Link>
                  </div>
                  <div style={{ display: 'none', position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: 'var(--accent-dark,#0A685C)', color: '#fff', borderRadius: 3, padding: 18, flexDirection: 'column', gap: 10, borderTop: `4px solid ${j.color}` }}>
                    <span style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: '#C9D4DF' }}>Aims and scope · {j.code}</span>
                    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: '#EEF2F6', display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{j.scope}</p>
                    <div style={{ marginTop: 'auto', display: 'flex', gap: 10 }}>
                      <Link href={j.href} style={{ flex: 1, textAlign: 'center', background: '#fff', color: 'var(--brand,#0F2B46)', padding: 8, borderRadius: 3, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Journal home</Link>
                      <Link href={j.submit} style={{ flex: 1, textAlign: 'center', border: '1px solid rgba(255,255,255,.5)', color: '#fff', padding: 7, borderRadius: 3, fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>Submit</Link>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section aria-label="Propose a new journal" style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 32px 0' }}>
        <div style={{ background: 'linear-gradient(120deg,var(--brand,#0F2B46),color-mix(in oklab,var(--brand,#0F2B46) 52%,var(--accent,#0C8375)))', color: '#fff', borderRadius: 3, padding: '36px 40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap: 32, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 600 }}>Propose a new journal</h2>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: '#E3E9EF', maxWidth: '52ch' }}>Is there a field that needs a home? Submit a proposal for a new open-access journal. Proposals are reviewed quarterly by the Editorial Director.</p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'flex-end' }}>
            <Link href="/journals" style={{ color: '#fff', border: '1px solid rgba(255,255,255,.45)', padding: '10px 16px', borderRadius: 3, fontSize: 14, textDecoration: 'none' }}>Browse current journals</Link>
            <Link href="/propose-journal" style={{ background: 'var(--warm,#B5400F)', color: '#fff', padding: '10px 18px', borderRadius: 3, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Propose a journal</Link>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 32px 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,380px),1fr))', gap: 48 }}>
        <div id="news">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderBottom: '2px solid var(--accent,#0B7265)', paddingBottom: 10 }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Latest news</h2>
            <Link href="/#news" style={{ fontSize: 14 }}>All news</Link>
          </div>
          {news.map((n) => (
            <article key={n.title} style={{ padding: '16px 0', borderBottom: '1px solid var(--line,#DCE1E6)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--muted,#505C68)' }}><span style={{ fontWeight: 600, color: 'var(--warm,#B5400F)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{n.type}</span> · {n.date}</span>
              <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink,#101B27)', lineHeight: 1.4 }}>{n.title}</span>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--ink-3,#3C4854)' }}>{n.summary}</p>
            </article>
          ))}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderBottom: '2px solid var(--accent,#0B7265)', paddingBottom: 10 }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 600, color: 'var(--ink,#101B27)' }}>How we publish</h2>
            <Link href="/journals/ijdh/peer-review-process" style={{ fontSize: 14 }}>Peer review policy</Link>
          </div>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, position: 'relative' }}>
            <span aria-hidden="true" style={{ position: 'absolute', left: 11, top: 22, bottom: 22, width: 2, transform: 'translateX(-50%)', background: 'var(--line,#DCE1E6)', pointerEvents: 'none' }}><span style={{ position: 'absolute', inset: 0, background: 'var(--accent,#0B6B6B)', transformOrigin: 'top', animation: 'ngiqLineFill 9s linear infinite' }}></span></span>
            {FLOW.map((f, i) => (
              <li key={f.n} style={{ display: 'grid', gridTemplateColumns: '28px minmax(0,1fr) auto', gap: 12, padding: '11px 0', borderBottom: '1px solid var(--line,#DCE1E6)', alignItems: 'center' }}>
                <span style={{ position: 'relative', zIndex: 1, boxSizing: 'border-box', background: 'var(--page,#fff)', animation: `ngiqStep${i} 9s linear infinite`, width: 22, height: 22, borderRadius: '50%', border: '1.5px solid var(--accent-dark,#095D53)', color: 'var(--accent-dark,#095D53)', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{f.n}</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink,#101B27)' }}>{f.h}</span>
                <span style={{ fontSize: 13, color: 'var(--muted,#505C68)' }}>{f.t}</span>
              </li>
            ))}
          </ol>
          <p style={{ margin: '12px 0 0', fontSize: 13, lineHeight: 1.5, color: 'var(--muted,#505C68)' }}>Target times. Median performance is published once 50 decisions have been made.</p>
        </div>
      </section>

      <section id="about" style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 32px 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,380px),1fr))', gap: 48 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 600, color: 'var(--ink,#101B27)', borderBottom: '2px solid var(--accent,#0B7265)', paddingBottom: 10 }}>About NextGenIQ Press</h2>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: 'var(--ink-2,#1F2A36)', maxWidth: '66ch' }}>NextGenIQ Press is an independent academic publisher. We publish open-access journals, monograph series and conference proceedings with editorial decisions made by subject experts, under policies aligned with the COPE Core Practices.</p>
          <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '8px 20px', fontSize: 14 }}>
            <dt style={{ color: 'var(--muted,#505C68)' }}>Book series</dt><dd style={{ margin: 0 }}><Link href="/journals#series">ISRI</Link>, <Link href="/journals#series">LNISI</Link></dd>
            <dt style={{ color: 'var(--muted,#505C68)' }}>Proceedings</dt><dd style={{ margin: 0 }}><Link href="/journals#series">NGIQ-LNCSE</Link>, <Link href="/journals#series">NGIQ-LNMR</Link></dd>
            <dt style={{ color: 'var(--muted,#505C68)' }}>Identifiers</dt><dd style={{ margin: 0 }}>Crossref DOIs; ORCID required for corresponding authors</dd>
          </dl>
        </div>
        <div>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 600, color: 'var(--ink,#101B27)', borderBottom: '2px solid var(--accent,#0B7265)', paddingBottom: 10 }}>Policies</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 24 }}>
            {POLICIES.map((p, i) => (
              <Link key={`${p.t}-${i}`} href={p.href} className="hm-hov-link" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--line,#DCE1E6)', fontSize: 14, color: 'var(--ink,#101B27)', textDecoration: 'none' }}>{p.t}<span aria-hidden="true" style={{ color: 'var(--muted,#6B7682)' }}>→</span></Link>
            ))}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1280, margin: '64px auto 0', padding: '0 32px' }}>
        <div style={{ background: 'linear-gradient(120deg,var(--brand,#0F2B46),color-mix(in oklab,var(--brand,#0F2B46) 52%,var(--accent,#0C8375)))', color: '#fff', borderRadius: 3, padding: '36px 40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap: 32, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 600 }}>Preparing a manuscript?</h2>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: '#E3E9EF', maxWidth: '52ch' }}>Download the journal template, check the article-type limits and complete the requirements checklist before you start. Drafts save automatically.</p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'flex-end' }}>
            <Link href="/journals/ijdh/author-instructions" style={{ color: '#fff', border: '1px solid rgba(255,255,255,.45)', padding: '10px 16px', borderRadius: 3, fontSize: 14, textDecoration: 'none' }}>Author instructions</Link>
            <Link href="/authors#templates" style={{ color: '#fff', border: '1px solid rgba(255,255,255,.45)', padding: '10px 16px', borderRadius: 3, fontSize: 14, textDecoration: 'none' }}>Word and LaTeX templates</Link>
            <Link href="/submit" style={{ background: 'var(--warm,#B5400F)', color: '#fff', padding: '10px 18px', borderRadius: 3, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Start submission</Link>
          </div>
        </div>
      </section>
    </>
  )
}
