'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export type MastheadJournal = {
  slug: string
  code: string
  title: string
  subject: string
  color: string
}

export type MastheadGroup = {
  group: string
  links: { title: string; href: string }[]
}

export type MastheadProfile = {
  /** Portrait cover photo, the same one the home-page card shows. */
  tile?: string
  kicker: string
  badges: string[]
  intro: string
  ctas: { label: string; href: string }[]
  facts: { label: string; value: string }[]
}

export type PublicationKind = 'journal' | 'series'

export type JournalMastheadProps = {
  j: MastheadJournal
  kind: PublicationKind
  tab: string
  groups: MastheadGroup[]
  profile: MastheadProfile
  /** The introductory paragraph and calls to action are shown on the home page only. */
  showIntro?: boolean
}

/**
 * Masthead shared by journals and book series: identity, the publisher's
 * badges and introduction, a strip of verifiable facts, and the grouped
 * sub-navigation.
 */
export function JournalMasthead({ j, kind, tab, groups, profile, showIntro = false }: JournalMastheadProps) {
  const [open, setOpen] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const homeHref = kind === 'journal' ? `/journals/${j.slug}` : `/series/${j.slug}`
  const parent = kind === 'journal' ? { label: 'Journals', href: '/journals' } : { label: 'Book series', href: '/series' }
  const [primary, ...secondary] = profile.ctas

  const tabs: { label: string; key: string; isLink?: boolean; href?: string }[] = [
    { label: kind === 'journal' ? 'Journal home' : 'Series home', key: 'home', isLink: true, href: homeHref },
    ...groups.map((g) => ({ label: g.group, key: g.group })),
  ]

  return (
    <div style={{ fontFamily: 'var(--font-sans)', background: 'linear-gradient(135deg,var(--accent-tint,#F3F9F8) 25%,var(--accent-soft,#CDF0E7))', borderBottom: '1px solid var(--line,#DCE1E6)' }}>
      <style>{`.jm-cta-primary:hover{background:var(--accent-dark,#174C8A)!important}.jm-cta-secondary:hover{border-color:var(--muted,#6B7682)!important}.jm-mega a:hover{color:var(--accent,#1D5DA8)}`}</style>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 32px 0' }}>
        <nav aria-label="Breadcrumb" style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--muted,#505C68)', flexWrap: 'wrap' }}>
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href={parent.href}>{parent.label}</Link>
          <span aria-hidden="true">/</span>
          <span style={{ color: 'var(--ink-2,#1F2A36)' }}>{j.title}</span>
        </nav>
        <div style={{ display: 'flex', gap: 28, padding: '20px 0 24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {profile.tile ? (
            <Link href={homeHref} aria-label={kind === 'journal' ? 'Journal home' : 'Series home'} style={{ position: 'relative', width: 112, height: 150, flexShrink: 0, borderRadius: 2, overflow: 'hidden', borderTop: `5px solid ${j.color}`, boxShadow: '0 6px 14px rgba(16,27,39,.18)' }}>
              <Image src={profile.tile} alt="" fill sizes="112px" priority style={{ objectFit: 'cover' }} />
            </Link>
          ) : (
          <Link
            href={homeHref}
            aria-label={kind === 'journal' ? 'Journal home' : 'Series home'}
            style={{ width: 112, height: 150, flexShrink: 0, background: 'var(--brand,#0F2B46)', borderRadius: 2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 12, boxSizing: 'border-box', textDecoration: 'none', borderTop: `5px solid ${j.color}` }}
          >
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: j.code.length > 4 ? 20 : 26, fontWeight: 600, color: '#fff', letterSpacing: '.02em' }}>{j.code}</span>
            <span style={{ fontSize: 9, lineHeight: 1.3, color: '#C3CFDB' }}>{j.title}</span>
          </Link>
          )}
          <div style={{ flex: 1, minWidth: 300, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-3,#3C4854)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: j.color }}></span>
              {profile.kicker}
            </span>
            <h1 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 34, lineHeight: 1.15, fontWeight: 600, color: 'var(--ink,#101B27)', letterSpacing: '-.01em', textWrap: 'balance' }}>{j.title}</h1>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
              {profile.badges.map((b, i) => (
                <span
                  key={b}
                  style={i === 0
                    ? { fontSize: 12, fontWeight: 500, padding: '2px 8px', borderRadius: 2, background: '#FBF1DA', color: '#6E4600', border: '1px solid #EBD39A' }
                    : { fontSize: 12, fontWeight: 500, padding: '2px 8px', borderRadius: 2, background: 'var(--surface-2,#F5F6F7)', color: 'var(--ink-2,#1F2A36)', border: '1px solid var(--line,#DCE1E6)' }}
                >
                  {b}
                </span>
              ))}
            </div>
            {showIntro ? (
              <p style={{ margin: '4px 0 0', fontSize: 16, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)', maxWidth: '72ch', textWrap: 'pretty' }}>{profile.intro}</p>
            ) : null}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 200 }}>
            {primary ? (
              <Link
                href={primary.href}
                className="jm-cta-primary"
                style={{ background: 'var(--accent,#1D5DA8)', color: '#fff', padding: '10px 16px', borderRadius: 3, fontSize: 14, fontWeight: 500, textAlign: 'center', textDecoration: 'none' }}
              >
                {primary.label}
              </Link>
            ) : null}
            {secondary.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="jm-cta-secondary"
                style={{ border: '1px solid var(--line-strong,#B9C1C9)', color: 'var(--ink,#101B27)', padding: '9px 16px', borderRadius: 3, fontSize: 14, fontWeight: 500, textAlign: 'center', textDecoration: 'none' }}
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>
        <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', borderTop: '1px solid var(--line,#DCE1E6)' }}>
          {profile.facts.map((f) => (
            <div key={f.label} style={{ padding: '14px 16px 14px 0', display: 'flex', flexDirection: 'column-reverse', gap: 2 }}>
              <dt style={{ fontSize: 12, color: 'var(--muted,#505C68)' }}>{f.label}</dt>
              <dd style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, color: 'var(--ink,#101B27)' }}>{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      {/* Menus open on hover (and on click, for touch screens) and close as soon as the pointer leaves the bar or its menu. */}
      <div onMouseLeave={() => setOpen(null)} style={{ borderTop: '1px solid var(--line,#DCE1E6)', background: 'var(--surface-3,#FAFBFB)', position: 'relative' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          {tabs.map((t) => {
            const active = t.key === tab || open === t.key
            const weight = active ? 600 : 500
            const bar = active ? 'var(--accent,#1D5DA8)' : 'transparent'
            if (t.isLink) {
              return (
                <Link
                  key={t.key}
                  href={t.href!}
                  onMouseEnter={() => setOpen(null)}
                  style={{ padding: '12px 14px 11px', fontSize: 14, fontWeight: weight, color: 'var(--ink,#101B27)', borderBottom: `3px solid ${bar}`, textDecoration: 'none' }}
                >
                  {t.label}
                </Link>
              )
            }
            return (
              <button
                key={t.key}
                onClick={() => setOpen(open === t.key ? null : t.key)}
                onMouseEnter={() => setOpen(t.key)}
                aria-expanded={open === t.key ? 'true' : 'false'}
                style={{ padding: '12px 14px 11px', font: 'inherit', fontSize: 14, fontWeight: weight, color: 'var(--ink,#101B27)', background: 'transparent', border: 0, borderBottom: `3px solid ${bar}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {t.label}
                <span aria-hidden="true" style={{ fontSize: 10, color: 'var(--muted,#505C68)' }}>{open === t.key ? '▲' : '▼'}</span>
              </button>
            )
          })}
          <div style={{ flex: 1 }}></div>
          {kind === 'journal' ? (
            <form action="/search" role="search" onMouseEnter={() => setOpen(null)} style={{ display: 'flex', border: '1px solid var(--line-strong,#B9C1C9)', borderRadius: 3, overflow: 'hidden', height: 32, margin: '6px 0', background: 'var(--surface,#fff)' }}>
              <input
                aria-label="Search this journal"
                name="q"
                placeholder={`Search in ${j.code}`}
                style={{ border: 0, padding: '0 10px', font: 'inherit', fontSize: 13, width: 180, outline: 'none' }}
              />
              <input type="hidden" name="journal" value={j.slug} />
              <button type="submit" style={{ border: 0, borderLeft: '1px solid var(--line,#DCE1E6)', background: 'var(--surface-2,#F5F6F7)', padding: '0 12px', font: 'inherit', fontSize: 13, cursor: 'pointer' }}>
                Search
              </button>
            </form>
          ) : null}
        </div>
        {open ? (
          <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', background: 'var(--surface,#fff)', borderTop: '1px solid var(--line,#DCE1E6)', borderBottom: '1px solid var(--line-strong,#B9C1C9)', boxShadow: '0 8px 24px rgba(16,27,39,.10)', zIndex: 30 }}>
            <div className="jm-mega" style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 32px 28px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 28 }}>
              {groups.map((g) => (
                <div key={g.group} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: open === g.group ? 'var(--accent,#1D5DA8)' : 'var(--ink-3,#3C4854)', fontWeight: 600, paddingBottom: 8, borderBottom: `2px solid ${open === g.group ? 'var(--accent,#1D5DA8)' : 'var(--line,#DCE1E6)'}`, marginBottom: 6 }}>{g.group}</span>
                  {g.links.map((l) => (
                    <Link key={l.href} href={l.href} onClick={() => setOpen(null)} style={{ fontSize: 14, color: 'var(--ink-2,#1F2A36)', padding: '5px 0' }}>
                      {l.title}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
