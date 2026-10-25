'use client'

/**
 * Home page. The hero and the "Start here" panel keep the mockup's layout and
 * motion (docs/REPLICATION.md); every line of copy is the publisher's
 * (src/data/publisher.ts), and only real records are listed.
 */

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { PublicationCard, type PublicationCardData } from '@/components/content/PublicationCard'
import { usePrefersReducedMotion } from '@/lib/hooks/client-state'

export type HomeArticle = {
  id: string
  href: string
  code: string
  type: string
  date: string
  title: string
  authorLine: string
}

export type HomePublication = PublicationCardData & { slug: string }

export type HomeAudience = { who: string; headline: string; desc: string; links: { t: string; href: string }[] }

export type HomeAbout = {
  title: string
  paragraphs: string[]
  sections: { title: string; text: string; link: { label: string; href: string } }[]
  contact: string
}

export type HomePolicyGroup = { group: string; links: { t: string; href: string }[] }

type Props = {
  hero: { kicker: string; headline: string; intro: string; ctas: { label: string; href: string }[] }
  audiences: HomeAudience[]
  publications: HomePublication[]
  articles: HomeArticle[]
  about: HomeAbout
  policies: HomePolicyGroup[]
}

/** Hero slideshow: the cover banners of the four titles, in portfolio order. */
const HERO = [
  { src: '/images/journals/cover-ijic.jpg', alt: 'International Journal of Intelligent Computing' },
  { src: '/images/journals/cover-ijdm.jpg', alt: 'International Journal of Digital Management' },
  { src: '/images/series/cover-aiisc.jpg', alt: 'Advances in AI, Intelligent Systems and Computing' },
  { src: '/images/series/cover-lnmr.jpg', alt: 'Lecture Notes in Multidisciplinary Research' },
]

const DUR = 6000

/** The editorial path and its target times, shown under "How we publish". */
const FLOW = [
  { n: 1, h: 'Submission', t: 'Online, 7 steps' },
  { n: 2, h: 'Technical check', t: '3 working days' },
  { n: 3, h: 'Editorial assessment', t: '7 days' },
  { n: 4, h: 'Peer review', t: '4–6 weeks' },
  { n: 5, h: 'First decision', t: 'Target 6 weeks' },
  { n: 6, h: 'Published online', t: '3 weeks after acceptance' },
]

const h2 = { margin: 0, fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 600, color: 'var(--ink,#101B27)' } as const
const head = { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, borderBottom: '2px solid var(--accent,#0B7265)', paddingBottom: 10 } as const

export function HomePage({ hero, audiences, publications, articles, about, policies }: Props) {
  const [aud, setAud] = useState(0)
  const [tick, setTick] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hover, setHover] = useState(false)
  const [heroIdx, setHeroIdx] = useState(0)
  const [heroPaused, setHeroPaused] = useState(false)
  const reduceMotion = usePrefersReducedMotion()

  /* Reduced motion forces both rotations off; the reader can still restart
     them with the visible controls, which is why it is OR-ed, not assigned. */
  const heroHeld = heroPaused || reduceMotion
  const audHeld = paused || reduceMotion

  useEffect(() => {
    if (heroHeld) return
    const heroT = setInterval(() => {
      if (!document.hidden) setHeroIdx((i) => (i + 1) % HERO.length)
    }, 4000)
    return () => clearInterval(heroT)
  }, [heroHeld])

  const pick = (i: number) => {
    setAud(i)
    setTick((t) => t + 1)
    setPaused(true)
  }

  const playing = !audHeld && !hover
  const prev = (heroIdx + HERO.length - 1) % HERO.length
  const [primaryCta, secondaryCta] = hero.ctas

  return (
    <>
      <style>{`@keyframes ngiqFillA{from{width:0}to{width:100%}}@keyframes ngiqFillB{from{width:0}to{width:100%}}@keyframes ngiqLineFill{0%{transform:scaleY(0)}3%,14%{transform:scaleY(0)}19.66%,30.66%{transform:scaleY(0.2)}36.32%,47.32%{transform:scaleY(0.4)}52.98%,63.98%{transform:scaleY(0.6)}69.64%,80.64%{transform:scaleY(0.8)}86.3%,97.3%{transform:scaleY(1)}96%{transform:scaleY(1)}100%{transform:scaleY(0)}}@keyframes ngiqLineFillX{0%{transform:scaleX(0)}3%,14%{transform:scaleX(0)}19.66%,30.66%{transform:scaleX(0.2)}36.32%,47.32%{transform:scaleX(0.4)}52.98%,63.98%{transform:scaleX(0.6)}69.64%,80.64%{transform:scaleX(0.8)}86.3%,97.3%{transform:scaleX(1)}96%{transform:scaleX(1)}100%{transform:scaleX(0)}}@keyframes ngiqStep0{0%,2.50%{background:var(--page,#fff);border-color:var(--brand,#0F2B46);color:var(--brand,#0F2B46);box-shadow:0 0 0 0 rgba(30,107,58,0)}3%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 0 rgba(30,107,58,.45)}7%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 7px rgba(30,107,58,.18)}14%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 7px rgba(30,107,58,.18)}16%,96%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 0 rgba(30,107,58,0)}100%{background:var(--page,#fff);border-color:var(--brand,#0F2B46);color:var(--brand,#0F2B46);box-shadow:0 0 0 0 rgba(30,107,58,0)}}@keyframes ngiqStep1{0%,19.16%{background:var(--page,#fff);border-color:var(--brand,#0F2B46);color:var(--brand,#0F2B46);box-shadow:0 0 0 0 rgba(30,107,58,0)}19.66%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 0 rgba(30,107,58,.45)}23.66%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 7px rgba(30,107,58,.18)}30.66%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 7px rgba(30,107,58,.18)}32.66%,96%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 0 rgba(30,107,58,0)}100%{background:var(--page,#fff);border-color:var(--brand,#0F2B46);color:var(--brand,#0F2B46);box-shadow:0 0 0 0 rgba(30,107,58,0)}}@keyframes ngiqStep2{0%,35.82%{background:var(--page,#fff);border-color:var(--brand,#0F2B46);color:var(--brand,#0F2B46);box-shadow:0 0 0 0 rgba(30,107,58,0)}36.32%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 0 rgba(30,107,58,.45)}40.32%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 7px rgba(30,107,58,.18)}47.32%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 7px rgba(30,107,58,.18)}49.32%,96%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 0 rgba(30,107,58,0)}100%{background:var(--page,#fff);border-color:var(--brand,#0F2B46);color:var(--brand,#0F2B46);box-shadow:0 0 0 0 rgba(30,107,58,0)}}@keyframes ngiqStep3{0%,52.48%{background:var(--page,#fff);border-color:var(--brand,#0F2B46);color:var(--brand,#0F2B46);box-shadow:0 0 0 0 rgba(30,107,58,0)}52.98%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 0 rgba(30,107,58,.45)}56.98%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 7px rgba(30,107,58,.18)}63.98%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 7px rgba(30,107,58,.18)}65.98%,96%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 0 rgba(30,107,58,0)}100%{background:var(--page,#fff);border-color:var(--brand,#0F2B46);color:var(--brand,#0F2B46);box-shadow:0 0 0 0 rgba(30,107,58,0)}}@keyframes ngiqStep4{0%,69.14%{background:var(--page,#fff);border-color:var(--brand,#0F2B46);color:var(--brand,#0F2B46);box-shadow:0 0 0 0 rgba(30,107,58,0)}69.64%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 0 rgba(30,107,58,.45)}73.64%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 7px rgba(30,107,58,.18)}80.64%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 7px rgba(30,107,58,.18)}82.64%,96%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 0 rgba(30,107,58,0)}100%{background:var(--page,#fff);border-color:var(--brand,#0F2B46);color:var(--brand,#0F2B46);box-shadow:0 0 0 0 rgba(30,107,58,0)}}@keyframes ngiqStep5{0%,85.80%{background:var(--page,#fff);border-color:var(--brand,#0F2B46);color:var(--brand,#0F2B46);box-shadow:0 0 0 0 rgba(30,107,58,0)}86.3%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 0 rgba(30,107,58,.45)}90.3%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 7px rgba(30,107,58,.18)}97.3%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 7px rgba(30,107,58,.18)}99.3%,96%{background:#1E6B3A;border-color:#1E6B3A;color:#fff;box-shadow:0 0 0 0 rgba(30,107,58,0)}100%{background:var(--page,#fff);border-color:var(--brand,#0F2B46);color:var(--brand,#0F2B46);box-shadow:0 0 0 0 rgba(30,107,58,0)}}@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}a{color:var(--accent,#1D5DA8);text-decoration:none}a:hover{text-decoration:underline}*:focus-visible{outline:2px solid var(--accent,#1D5DA8);outline-offset:2px}.hm-hov-link:hover{color:var(--accent,#1D5DA8)!important}.hm-hov-aud:hover{padding-left:6px!important;color:var(--accent,#1D5DA8)!important}.hm-flow{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:0 16px}.hm-flow-line{display:block}@media (max-width:860px){.hm-flow{grid-template-columns:repeat(3,minmax(0,1fr));gap:22px 16px}.hm-flow-line{display:none}}@media (max-width:480px){.hm-flow{grid-template-columns:repeat(2,minmax(0,1fr))}}`}</style>

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
            {HERO.map((h, i) => (
              <button key={h.src} onClick={() => setHeroIdx(i)} aria-label={`Show image ${i + 1}`} aria-current={i === heroIdx ? 'true' : 'false'} style={{ width: i === heroIdx ? '22px' : '8px', height: 8, borderRadius: 4, border: 0, padding: 0, cursor: 'pointer', background: i === heroIdx ? '#fff' : 'rgba(255,255,255,.5)', transition: 'width .35s ease,background .35s ease' }}></button>
            ))}
            <button onClick={() => setHeroPaused((p) => !p)} aria-label={heroHeld ? 'Play slideshow' : 'Pause slideshow'} style={{ border: 0, background: 'none', color: '#fff', font: 'inherit', fontSize: 11, cursor: 'pointer', padding: '0 0 0 4px' }}>{heroHeld ? 'Play' : 'Pause'}</button>
          </div>
        </div>
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(90deg,var(--accent-tint,#F3F9F8) 0%,var(--accent-tint,#F3F9F8) 38%,color-mix(in srgb,var(--accent-tint,#F3F9F8) 85%,transparent) 50%,transparent 75%)' }}></div>
        <div style={{ position: 'relative', pointerEvents: 'none', maxWidth: 1280, margin: '0 auto', padding: '72px 32px 68px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,440px),1fr))', gap: 56, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, pointerEvents: 'auto' }}>
            <span style={{ fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--warm,#B5400F)', fontWeight: 600 }}>{hero.kicker}</span>
            <h1 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 44, lineHeight: 1.12, fontWeight: 600, color: 'var(--ink,#101B27)', letterSpacing: '-.015em', textWrap: 'balance' }}>{hero.headline}</h1>
            <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)', maxWidth: '62ch', textWrap: 'pretty' }}>{hero.intro}</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href={primaryCta.href} style={{ background: 'var(--accent,#1D5DA8)', color: '#fff', padding: '11px 20px', borderRadius: 3, fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>{primaryCta.label}</Link>
              <Link href={secondaryCta.href} style={{ background: 'var(--surface,#fff)', border: '1px solid var(--line-strong,#B9C1C9)', color: 'var(--ink,#101B27)', padding: '10px 20px', borderRadius: 3, fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>{secondaryCta.label}</Link>
            </div>
          </div>
          <div style={{ background: 'var(--surface,#fff)', border: '1px solid var(--line,#DCE1E6)', borderRadius: 3, pointerEvents: 'auto', boxShadow: '0 8px 24px rgba(16,27,39,.10)', maxWidth: 520, justifySelf: 'end', width: '100%' }}>
            <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocus={() => setHover(true)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px 0' }}>
                <h2 style={{ margin: 0, fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted,#505C68)', fontWeight: 600 }}>Start here</h2>
                <button onClick={() => setPaused((p) => !p)} aria-label={paused ? 'Resume rotation' : 'Pause rotation'} style={{ border: '1px solid var(--line,#DCE1E6)', background: 'var(--surface,#fff)', borderRadius: 2, padding: '2px 8px', font: 'inherit', fontSize: 11, color: 'var(--ink-3,#3C4854)', cursor: 'pointer' }}>{paused ? 'Play' : 'Pause'}</button>
              </div>
              <div role="tablist" aria-label="Choose your role" style={{ display: 'grid', gridTemplateColumns: `repeat(${audiences.length},1fr)`, padding: '10px 20px 0', borderBottom: '1px solid var(--line,#DCE1E6)' }}>
                {audiences.map((t, i) => (
                  <button key={t.who} role="tab" aria-selected={i === aud ? 'true' : 'false'} onClick={() => pick(i)} style={{ border: 0, background: 'none', padding: '8px 0 10px', font: 'inherit', fontSize: 14, fontWeight: i === aud ? 600 : 500, color: i === aud ? 'var(--ink,#101B27)' : 'var(--muted,#505C68)', cursor: 'pointer', position: 'relative', textAlign: 'left', transition: 'color .2s' }}>
                    {t.who}
                    <span style={{ position: 'absolute', left: 0, right: 8, bottom: -1, height: 2, background: 'var(--line-soft,#EEF1F4)' }}></span>
                    <span
                      style={{ position: 'absolute', left: 0, bottom: -1, height: 2, background: 'var(--accent,#1D5DA8)', width: '0', animation: i === aud ? `${tick % 2 ? 'ngiqFillA' : 'ngiqFillB'} ${DUR}ms linear forwards` : 'none', animationPlayState: playing ? 'running' : 'paused' }}
                      onAnimationEnd={() => {
                        setAud((v) => (v + 1) % audiences.length)
                        setTick((v) => v + 1)
                      }}
                    ></span>
                  </button>
                ))}
              </div>
              <div style={{ display: 'grid', padding: '20px 20px 22px', minHeight: 300 }}>
                {audiences.map((a, i) => {
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

      <section id="publications" style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 32px 0' }}>
        <div style={head}>
          <h2 style={h2}>Our publications</h2>
          <span style={{ display: 'flex', gap: 18, fontSize: 14 }}>
            <Link href="/journals">All journals</Link>
            <Link href="/series">All book series</Link>
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,280px),1fr))', gap: 20, marginTop: 24 }}>
          {publications.map((p) => (
            <PublicationCard key={p.slug} {...p} />
          ))}
        </div>
      </section>

      {articles.length > 0 ? (
        <section style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 32px 0' }}>
          <div style={head}>
            <h2 style={h2}>Latest articles</h2>
            <Link href="/search?tab=articles" style={{ fontSize: 14 }}>View all articles</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,360px),1fr))', columnGap: 40 }}>
            {articles.map((a) => (
              <article key={a.id} style={{ padding: '18px 0', borderBottom: '1px solid var(--line,#DCE1E6)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--muted,#505C68)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-2,#1F2A36)' }}>{a.code}</span> · <span style={{ fontWeight: 600, color: 'var(--warm,#B5400F)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{a.type}</span> · {a.date}
                </span>
                <Link href={a.href} className="hm-hov-link" style={{ fontFamily: 'var(--font-serif)', fontSize: 18, lineHeight: 1.35, fontWeight: 600, color: 'var(--ink,#101B27)' }}>
                  {a.title}
                </Link>
                <span style={{ fontSize: 14, color: 'var(--ink-3,#3C4854)' }}>{a.authorLine}</span>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="how-h" style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 32px 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderBottom: '2px solid var(--accent,#0B7265)', paddingBottom: 10 }}>
          <h2 id="how-h" style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 600, color: 'var(--ink,#101B27)' }}>How we publish</h2>
          <Link href="/policies/peer-review-policy" style={{ fontSize: 14 }}>Peer review policy</Link>
        </div>
        <div style={{ position: 'relative', marginTop: 28 }}>
          {/* The connector runs between the first and last step centres and fills left to right in step with the numbers. */}
          <span aria-hidden="true" className="hm-flow-line" style={{ position: 'absolute', top: 16, left: 'calc(100% / 12)', right: 'calc(100% / 12)', height: 2, background: 'var(--line,#DCE1E6)', pointerEvents: 'none' }}>
            <span style={{ position: 'absolute', inset: 0, background: 'var(--accent,#0B6B6B)', transformOrigin: 'left', animation: 'ngiqLineFillX 9s linear infinite' }}></span>
          </span>
          <ol className="hm-flow" style={{ listStyle: 'none', margin: 0, padding: 0, position: 'relative' }}>
            {FLOW.map((f, i) => (
              <li key={f.n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 6 }}>
                <span style={{ position: 'relative', zIndex: 1, boxSizing: 'border-box', background: 'var(--page,#fff)', animation: `ngiqStep${i} 9s linear infinite`, width: 34, height: 34, borderRadius: '50%', border: '2px solid var(--accent-dark,#095D53)', color: 'var(--accent-dark,#095D53)', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>{f.n}</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink,#101B27)', lineHeight: 1.3 }}>{f.h}</span>
                <span style={{ fontSize: 13, color: 'var(--muted,#505C68)', lineHeight: 1.4 }}>{f.t}</span>
              </li>
            ))}
          </ol>
        </div>
        <p style={{ margin: '22px 0 0', fontSize: 13, lineHeight: 1.5, color: 'var(--muted,#505C68)', textAlign: 'center' }}>Target times. Median performance is published once 50 decisions have been made.</p>
      </section>

      <section id="about" style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 32px 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,380px),1fr))', gap: 48 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ ...h2, borderBottom: '2px solid var(--accent,#0B7265)', paddingBottom: 10 }}>{about.title}</h2>
          {about.paragraphs.map((t) => (
            <p key={t} style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: 'var(--ink-2,#1F2A36)', maxWidth: '66ch' }}>{t}</p>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <Link href="/contact" style={{ background: 'var(--accent,#1D5DA8)', color: '#fff', padding: '10px 18px', borderRadius: 3, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Contact us</Link>
            <span style={{ fontSize: 15, color: 'var(--ink-2,#1F2A36)' }}>
              or email <a href={`mailto:${about.contact}`}>{about.contact}</a>
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {about.sections.map((s) => (
            <div key={s.title} style={{ padding: '16px 0', borderBottom: '1px solid var(--line,#DCE1E6)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: 'var(--ink,#101B27)' }}>{s.title}</h3>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)' }}>{s.text}</p>
              <Link href={s.link.href} style={{ fontSize: 14, fontWeight: 500 }}>{s.link.label} →</Link>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="home-policies" style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 32px 0' }}>
        <div style={head}>
          <h2 id="home-policies" style={h2}>Policies</h2>
          <Link href="/policies" style={{ fontSize: 14 }}>All policies</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,260px),1fr))', gap: 32, marginTop: 16 }}>
          {policies.map((g) => (
            <div key={g.group}>
              <h3 style={{ margin: '0 0 6px', fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted,#505C68)', fontWeight: 600 }}>{g.group}</h3>
              {g.links.map((l) => (
                <Link key={l.href} href={l.href} className="hm-hov-link" style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--line,#DCE1E6)', fontSize: 14, color: 'var(--ink,#101B27)', textDecoration: 'none' }}>
                  {l.t}<span aria-hidden="true" style={{ color: 'var(--muted,#6B7682)' }}>→</span>
                </Link>
              ))}
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
