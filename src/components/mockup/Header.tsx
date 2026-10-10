'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useSession } from '@/components/auth/SessionProvider'
import { useHydrated } from '@/lib/hooks/client-state'
import { ojsRegisterUrl } from '@/lib/ojs/config'
import { normalise } from '@/lib/search-core'
import type { TypeaheadIndex } from '@/lib/search'

/**
 * Replicated from Header.dc.html. The mockup's control panel (theme picker,
 * dim switch, hero image selector, launch/mature toggle) is design-review
 * scaffolding and is deliberately omitted per docs/REPLICATION.md.
 */

type SugItem = { t: string; meta: string; href: string }

const NAV: [string, string, string][] = [
  ['Journals', '/journals', 'journals'],
  ['Articles', '/search?tab=articles', 'articles'],
  ['Books & proceedings', '/journals#series', 'series'],
  ['Calls for papers', '/authors#cfp', 'cfp'],
  ['For authors', '/authors', 'authors'],
  ['Policies', '/authors#policies', 'policies'],
  ['About', '/#about', 'about'],
]

const activeKey = (pathname: string): string => {
  if (pathname === '/authors') return 'authors'
  if (pathname.startsWith('/policies')) return 'policies'
  if (pathname.startsWith('/journals')) return 'journals'
  if (pathname.startsWith('/articles') || pathname === '/search') return 'articles'
  if (pathname.startsWith('/series')) return 'series'
  if (pathname === '/about') return 'about'
  return ''
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .filter((c) => /[A-Za-z]/.test(c))
    .slice(0, 2)
    .join('')
    .toUpperCase()

export function Header({ suggestions }: { suggestions: TypeaheadIndex }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useSession()

  /**
   * The mockup seeds q/scope from location.search. The URL is read only after
   * hydration (useHydrated renders the server snapshot first), and the typed
   * value is an override on top of that seed — so the server-rendered HTML
   * stays identical to the first client render without a mount effect.
   */
  const hydrated = useHydrated()
  const seed = useMemo(() => {
    if (!hydrated) return { q: '', scope: 'all' }
    const sp = new URLSearchParams(window.location.search)
    const s0 = sp.get('tab') || sp.get('scope')
    return {
      q: sp.get('q') ?? '',
      scope: s0 && ['all', 'articles', 'journals', 'pages'].includes(s0) ? s0 : 'all',
    }
  }, [hydrated])

  const [qOverride, setQ] = useState<string | null>(null)
  const [scopeOverride, setScope] = useState<string | null>(null)
  const q = qOverride ?? seed.q
  const scope = scopeOverride ?? seed.scope

  const [focus, setFocus] = useState(false)
  const [hi, setHi] = useState(-1)
  const [menu, setMenu] = useState(false)
  const [menuLeft, setMenuLeft] = useState(false)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Element | null
      if (menu && t && !t.closest('[role="menu"]') && !t.closest('[aria-haspopup="menu"]')) setMenu(false)
    }
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && menu) setMenu(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onEsc)
    }
  }, [menu])

  const a = activeKey(pathname || '')
  const nav = NAV.map(([label, href, k]) => ({ label, href, active: k === a }))

  const signedIn = !!user
  const fullName = user?.fullName || ''
  const initials = initialsOf(fullName) || 'U'
  const roleLine = (user?.roles ?? []).map((r) => r.charAt(0).toUpperCase() + r.slice(1)).join(' · ')

  const qn = normalise(q.trim())
  let groupsRaw: [string, SugItem[]][] = []
  if (qn.length >= 2) {
    const m = (s: string) => s.includes(qn)
    const js = suggestions.journals.filter((e) => m(e.haystack)).slice(0, 3).map((e) => ({ t: e.title, meta: e.code, href: e.href }))
    const as = suggestions.articles.filter((e) => m(e.haystack)).slice(0, 3).map((e) => ({ t: e.title, meta: e.code, href: e.href }))
    const ps = suggestions.guidance.filter((e) => m(e.haystack)).slice(0, 3).map((e) => ({ t: e.title, meta: 'Guidance', href: e.href }))
    groupsRaw = ([['Journals', js], ['Articles', as], ['Author guidance', ps]] as [string, SugItem[]][]).filter((g) => g[1].length > 0)
  }
  const flat: SugItem[] = []
  groupsRaw.forEach((g) => g[1].forEach((it) => flat.push(it)))
  let ci = 0
  const sugGroups = groupsRaw.map(([label, items]) => ({
    label,
    items: items.map((it) => {
      const i = ci++
      return {
        ...it,
        sel: i === hi,
        bg: i === hi ? 'var(--accent-tint, #F5F8FC)' : 'transparent',
        delay: `${i * 35}ms`,
      }
    }),
  }))
  const sugOpen = focus && qn.length >= 2
  const allHref = `/search?q=${encodeURIComponent(q)}&tab=${scope}`

  const onKeyQ = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const n = flat.length
    if (e.key === 'ArrowDown' && n) {
      e.preventDefault()
      setHi((hi + 1) % n)
    } else if (e.key === 'ArrowUp' && n) {
      e.preventDefault()
      setHi((hi - 1 + n) % n)
    } else if (e.key === 'Escape') {
      setFocus(false)
    } else if (e.key === 'Enter' && hi >= 0 && flat[hi]) {
      e.preventDefault()
      router.push(flat[hi].href)
    }
  }

  const menuItems: { t: string; href: string; meta: string }[] = [
    { t: 'My submissions', href: '/dashboard', meta: '' },
    { t: 'Review invitations', href: '/dashboard?tab=reviewer', meta: '' },
    { t: 'Edit profile', href: '/profile', meta: '' },
    { t: 'Notifications and alerts', href: '/profile#notifications', meta: '' },
    { t: 'Password and security', href: '/profile#security', meta: '' },
  ]

  return (
    <header style={{ fontFamily: 'var(--font-sans)', background: 'var(--surface, #fff)', borderTop: '3px solid var(--warm, #B5400F)', borderBottom: '1px solid var(--line, #DCE1E6)' }}>
      <style>{`
@keyframes ngiqDrop{from{opacity:0;transform:translateY(-6px) scale(.98)}to{opacity:1;transform:none}}
@keyframes ngiqRise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.ngiqHdrNavLink:hover{color:var(--ink,#101B27)!important;border-bottom-color:var(--line-strong,#B9C1C9)!important}
.ngiqHdrMenuItem:hover{background:var(--surface-2,#F5F6F7)!important;color:var(--accent,#1D5DA8)!important}
.ngiqHdrSignOut:hover{background:#FBEAEA!important}
.ngiqHdrSubmit:hover{background:var(--accent-dark,#174C8A)!important}
@media (prefers-reduced-motion:reduce){.ngiqHdrAnim{animation:none!important}}
`}</style>
      <div style={{ background: 'var(--line-soft, #EEF1F4)', borderBottom: '1px solid var(--line, #DCE1E6)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '6px 32px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontSize: 12, color: 'var(--ink-3, #3C4854)' }}>
          <div style={{ flex: 1 }}></div>
          <Link href="/authors#reviewers" style={{ color: 'var(--ink-3, #3C4854)' }}>For reviewers</Link>
          <Link href="/authors#editors" style={{ color: 'var(--ink-3, #3C4854)' }}>For editors</Link>
          <Link href="/authors#librarians" style={{ color: 'var(--ink-3, #3C4854)' }}>For librarians</Link>
        </div>
      </div>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--ink, #101B27)', textDecoration: 'none' }}>
          <span style={{ width: 34, height: 34, background: 'var(--accent-dark, #0A685C)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: 20, borderRadius: 2 }}>N</span>
          <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, letterSpacing: '-.01em' }}>NextGenIQ Press</span>
          </span>
        </Link>
        <div style={{ flex: 1, minWidth: 280, position: 'relative', zIndex: 40 }}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              router.push(allHref)
            }}
            role="search"
            style={{
              display: 'flex',
              border: `1px solid ${focus ? 'var(--accent, #1D5DA8)' : 'var(--line-strong, #B9C1C9)'}`,
              borderRadius: 3,
              overflow: 'hidden',
              height: 40,
              background: 'var(--surface, #fff)',
              transition: 'box-shadow .25s ease,border-color .25s ease,transform .25s ease',
              boxShadow: focus ? '0 0 0 3px color-mix(in srgb,var(--accent, #1D5DA8) 18%,transparent),0 6px 18px rgba(16,27,39,.10)' : 'none',
              transform: focus ? 'scale(1.01)' : 'none',
            }}
          >
            <select
              aria-label="Search scope"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              style={{ border: 0, borderRight: '1px solid var(--line, #DCE1E6)', background: 'var(--surface-2, #F5F6F7)', padding: '0 10px', font: 'inherit', fontSize: 13, color: 'var(--ink-2, #1F2A36)' }}
            >
              <option value="all">All content</option>
              <option value="articles">Articles</option>
              <option value="journals">Journals</option>
              <option value="pages">Author guidance</option>
            </select>
            <input
              aria-label="Search"
              role="combobox"
              aria-expanded={sugOpen ? 'true' : 'false'}
              aria-controls="ngiq-sug"
              autoComplete="off"
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setHi(-1)
              }}
              onFocus={() => setFocus(true)}
              onBlur={() => setTimeout(() => setFocus(false), 150)}
              onKeyDown={onKeyQ}
              placeholder="Search articles, journals, authors, DOIs"
              style={{ flex: 1, border: 0, padding: '0 12px', font: 'inherit', fontSize: 14, outline: 'none', minWidth: 0 }}
            />
            <button type="submit" style={{ border: 0, background: 'var(--accent-dark, #0A685C)', color: '#fff', padding: '0 18px', font: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Search</button>
          </form>
          {sugOpen ? (
            <div id="ngiq-sug" role="listbox" className="ngiqHdrAnim" style={{ position: 'absolute', left: 0, right: 0, top: 'calc(100% + 6px)', background: 'var(--surface, #fff)', border: '1px solid var(--line-strong, #B9C1C9)', borderRadius: 3, boxShadow: '0 12px 32px rgba(16,27,39,.16)', animation: 'ngiqDrop .22s ease both', overflow: 'hidden' }}>
              {sugGroups.map((g) => (
                <div key={g.label} style={{ padding: '8px 0', borderBottom: '1px solid var(--line-soft, #EEF1F4)' }}>
                  <span style={{ display: 'block', padding: '2px 14px 6px', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted, #505C68)', fontWeight: 600 }}>{g.label}</span>
                  {g.items.map((it) => (
                    <Link
                      key={it.href}
                      href={it.href}
                      role="option"
                      aria-selected={it.sel ? 'true' : 'false'}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        router.push(it.href)
                      }}
                      className="ngiqHdrAnim"
                      style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '7px 14px', fontSize: 14, color: 'var(--ink, #101B27)', textDecoration: 'none', background: it.bg, animation: 'ngiqRise .3s ease both', animationDelay: it.delay }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.t}</span>
                      <span style={{ fontSize: 12, color: 'var(--muted, #505C68)', flexShrink: 0 }}>{it.meta}</span>
                    </Link>
                  ))}
                </div>
              ))}
              <Link
                href={allHref}
                onMouseDown={(e) => {
                  e.preventDefault()
                  router.push(allHref)
                }}
                style={{ display: 'block', padding: '10px 14px', fontSize: 13, fontWeight: 500, background: 'var(--surface-2, #F5F6F7)' }}
              >
                See all results for “{q}” →
              </Link>
            </div>
          ) : null}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {signedIn ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect()
                  setMenu(!menu)
                  setMenuLeft(r.right < 292)
                }}
                aria-haspopup="menu"
                aria-expanded={menu ? 'true' : 'false'}
                style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${menu ? 'var(--accent, #1D5DA8)' : 'var(--line, #DCE1E6)'}`, background: 'var(--surface, #fff)', borderRadius: 20, padding: '3px 10px 3px 3px', font: 'inherit', fontSize: 14, color: 'var(--ink-2, #1F2A36)', cursor: 'pointer', transition: 'border-color .2s' }}
              >
                <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--accent-soft, #E8F0FA)', color: 'var(--accent, #1D5DA8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>{initials}</span>
                <span style={{ fontWeight: 500 }}>{fullName}</span>
                <span aria-hidden="true" style={{ fontSize: 10, color: 'var(--muted, #505C68)', transition: 'transform .25s', transform: menu ? 'rotate(180deg)' : 'none' }}>▼</span>
              </button>
              {menu ? (
                <div role="menu" className="ngiqHdrAnim" style={{ position: 'absolute', left: menuLeft ? '0' : 'auto', right: menuLeft ? 'auto' : '0', top: 'calc(100% + 8px)', width: 280, maxWidth: 'calc(100vw - 24px)', background: 'var(--surface, #fff)', border: '1px solid var(--line-strong, #B9C1C9)', borderRadius: 4, boxShadow: '0 12px 32px rgba(16,27,39,.16)', zIndex: 50, animation: 'ngiqDrop .2s ease both', overflow: 'hidden' }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line, #DCE1E6)', display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-soft, #E8F0FA)', color: 'var(--accent, #1D5DA8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, flexShrink: 0 }}>{initials}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink, #101B27)' }}>{fullName}</span>
                      <span style={{ fontSize: 12, color: 'var(--muted, #505C68)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</span>
                      <span style={{ fontSize: 11, color: 'var(--muted, #505C68)' }}>{roleLine}</span>
                    </div>
                  </div>
                  <div style={{ padding: '6px 0', borderBottom: '1px solid var(--line, #DCE1E6)' }}>
                    {menuItems.map((m) => (
                      <Link
                        key={m.t}
                        role="menuitem"
                        href={m.href}
                        onClick={() => setMenu(false)}
                        className="ngiqHdrMenuItem"
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 16px', fontSize: 14, color: 'var(--ink-2, #1F2A36)', textDecoration: 'none' }}
                      >
                        {m.t}
                        <span style={{ fontSize: 12, color: 'var(--muted, #505C68)' }}>{m.meta}</span>
                      </Link>
                    ))}
                  </div>
                  <form method="post" action="/api/auth/sign-out" style={{ margin: 0 }}>
                    <button type="submit" role="menuitem" className="ngiqHdrSignOut" style={{ width: '100%', textAlign: 'left', border: 0, background: 'none', padding: '11px 16px', font: 'inherit', fontSize: 14, color: '#A52A2A', cursor: 'pointer' }}>Sign out</button>
                  </form>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <Link href="/sign-in" style={{ fontSize: 14, color: 'var(--ink-2, #1F2A36)', fontWeight: 500 }}>Sign in</Link>
              <a href={ojsRegisterUrl} style={{ fontSize: 14, color: 'var(--ink-2, #1F2A36)', fontWeight: 500 }}>Register</a>
            </>
          )}
          <Link href="/submit" className="ngiqHdrSubmit" style={{ background: 'var(--accent, #1D5DA8)', color: '#fff', padding: '9px 16px', borderRadius: 3, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Submit manuscript</Link>
        </div>
      </div>
      <nav aria-label="Primary" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', display: 'flex', gap: 28, flexWrap: 'wrap' }}>
        {nav.map((item) =>
          item.active ? (
            <Link key={item.label} href={item.href} aria-current="page" style={{ padding: '10px 0 11px', fontSize: 14, fontWeight: 600, color: 'var(--ink, #101B27)', borderBottom: '3px solid var(--accent, #1D5DA8)', textDecoration: 'none' }}>
              {item.label}
            </Link>
          ) : (
            <Link key={item.label} href={item.href} className="ngiqHdrNavLink" style={{ padding: '10px 0 11px', fontSize: 14, fontWeight: 500, color: 'var(--ink-3, #3C4854)', borderBottom: '3px solid transparent', textDecoration: 'none' }}>
              {item.label}
            </Link>
          ),
        )}
      </nav>
    </header>
  )
}
