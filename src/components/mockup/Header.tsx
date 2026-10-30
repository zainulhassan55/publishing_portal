'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useSession } from '@/components/auth/SessionProvider'
import { useHydrated } from '@/lib/hooks/client-state'
import { hasEditorialRole, roleLabel } from '@/lib/auth/roles'
import { normalise } from '@/lib/search-core'
import { journalCode, journals, journalsOnly, magazines, periodicalBase, series, seriesPageHref } from '@/data/registry'
import type { TypeaheadIndex } from '@/lib/search'

/**
 * Replicated from Header.dc.html. The mockup's control panel (theme picker,
 * dim switch, hero image selector, launch/mature toggle) is design-review
 * scaffolding and is deliberately omitted per docs/REPLICATION.md.
 */

type SugItem = { t: string; meta: string; href: string }

type NavEntry = { label: string; href: string; key: string; children?: { label: string; href: string }[] }

/**
 * Primary navigation. Every entry but Contact opens a dropdown of its pages on
 * hover or keyboard focus (CSS :hover / :focus-within, so it works before
 * hydration); the top-level label stays a link for touch screens, where there
 * is no hover.
 */
const NAV: NavEntry[] = [
  {
    label: 'Journals',
    href: '/journals',
    key: 'journals',
    children: [...journalsOnly.map((j) => ({ label: `${j.title} (${journalCode(j)})`, href: periodicalBase(j.slug) })), { label: 'All journals', href: '/journals' }],
  },
  {
    label: 'Magazines',
    href: '/magazines',
    key: 'magazines',
    children: [
      ...magazines.map((m) => ({ label: `${m.title} (${journalCode(m)})`, href: periodicalBase(m.slug) })),
      ...magazines.map((m) => ({ label: `${journalCode(m)} author guidelines`, href: `${periodicalBase(m.slug)}/author-guidelines` })),
      { label: 'All magazines', href: '/magazines' },
    ],
  },
  {
    label: 'Book series',
    href: '/series',
    key: 'series',
    children: [
      ...series.map((s) => ({ label: `${s.title} (${s.code})`, href: `/series/${s.slug}` })),
      ...series.map((s) => ({ label: `Propose a volume for ${s.code}`, href: seriesPageHref(s.slug, 'propose-volume') })),
      { label: 'All book series', href: '/series' },
    ],
  },
  {
    label: 'For reviewers',
    href: '/reviewers',
    key: 'reviewers',
    children: [
      { label: 'Reviewer guidelines', href: '/reviewers' },
      { label: 'Become a reviewer', href: '/reviewers/form' },
    ],
  },
  {
    label: 'For editors',
    href: '/editors',
    key: 'editors',
    children: [
      { label: 'Join an editorial board', href: '/editors/form' },
      { label: 'Special issue guidelines', href: '/editors/special-issues' },
      { label: 'Propose a special issue', href: '/editors/special-issues/form' },
      { label: 'Propose a book volume or proceedings', href: '/editors#books-and-proceedings' },
      { label: 'Submit a new journal proposal', href: '/propose-journal/form' },
    ],
  },
  {
    label: 'For librarians',
    href: '/librarians',
    key: 'librarians',
    children: [
      { label: 'Browse publications', href: '/librarians#browse-publications' },
      { label: 'Indexing and discovery', href: '/librarians#indexing-and-discovery' },
      { label: 'Access and licensing', href: '/librarians#access-and-licensing' },
    ],
  },
  {
    label: 'For authors',
    href: '/authors',
    key: 'authors',
    children: [
      { label: 'Submit a manuscript', href: '/submit' },
      ...journals.map((j) => ({ label: `${journalCode(j)} author guidelines`, href: `${periodicalBase(j.slug)}/author-guidelines` })),
      { label: 'Open access and fees', href: '/authors#apc' },
      { label: 'Author resources', href: '/authors' },
    ],
  },
  {
    label: 'Policies',
    href: '/policies',
    key: 'policies',
    children: [
      { label: 'Publication ethics', href: '/policies/publication-ethics' },
      { label: 'Peer review policy', href: '/policies/peer-review-policy' },
      { label: 'Generative AI policy', href: '/policies/generative-ai-policy' },
      { label: 'Open access and licensing', href: '/policies/open-access' },
      { label: 'Complaints and appeals', href: '/policies/complaints-appeals' },
      { label: 'All policies', href: '/policies' },
    ],
  },
  {
    label: 'About',
    href: '/about',
    key: 'about',
    children: [
      { label: 'About NextGenIQ Press', href: '/about' },
      { label: 'Editorial quality and integrity', href: '/about#editorial-quality-and-integrity' },
      { label: 'Access and discoverability', href: '/about#access-and-discoverability' },
    ],
  },
  { label: 'Contact', href: '/contact', key: 'contact' },
]

const activeKey = (pathname: string): string => {
  if (pathname === '/authors') return 'authors'
  if (pathname.startsWith('/reviewers')) return 'reviewers'
  if (pathname.startsWith('/editors') || pathname === '/propose-journal') return 'editors'
  if (pathname.startsWith('/librarians')) return 'librarians'
  if (pathname === '/contact') return 'contact'
  if (pathname.startsWith('/policies')) return 'policies'
  if (pathname.startsWith('/journals')) return 'journals'
  if (pathname.startsWith('/magazines')) return 'magazines'
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
  // The dropdown a click just used. It stays shut, even though the pointer is
  // still over it, until the pointer leaves that menu.
  const [closedNav, setClosedNav] = useState<string | null>(null)
  // The phone menu is open for the path it was opened on, so navigating
  // anywhere closes it without an effect.
  const [menuPath, setMenuPath] = useState<string | null>(null)
  const mobileOpen = menuPath !== null && menuPath === pathname

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
  const nav = NAV.map((item) => ({ ...item, active: item.key === a }))

  const signedIn = !!user
  const fullName = user?.fullName || ''
  const initials = initialsOf(fullName) || 'U'
  // Readable role names, not OJS's internal slugs: "Journal manager", not
  // "Manager"; "Site administrator", not "Site-admin".
  const roleLine = (user?.roles ?? []).map(roleLabel).join(' · ')

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

  /**
   * Built from the roles OJS reports for this account, rather than shown to
   * everyone. A reader who has never reviewed does not want an empty review
   * queue in their menu, and — the reason this changed — an editor previously
   * had no way into the editorial queue from the portal at all: the menu
   * offered the same five author links to every signed-in person.
   *
   * Roles arrive in the session from the `currentUser` blob at sign-in and
   * refresh on revalidation, so a reviewer invitation accepted in OJS shows
   * up here within the revalidation window without signing out.
   */
  const roles = user?.roles ?? []
  const menuItems: { t: string; href: string; meta: string }[] = [
    // Everyone holds the author surface: anyone may submit, and OJS grants the
    // Author role on first submission rather than in advance.
    { t: 'My submissions', href: '/dashboard', meta: '' },
    ...(roles.includes('reviewer') ? [{ t: 'Review invitations', href: '/dashboard?tab=reviewer', meta: '' }] : []),
    ...(hasEditorialRole(roles) ? [{ t: 'Editorial queues', href: '/dashboard?tab=editorial', meta: '' }] : []),
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
.ngiqNavItem{position:relative}
.ngiqNavDrop{display:none;position:absolute;left:-14px;top:100%;z-index:50;min-width:250px;padding:8px 0;background:var(--surface,#fff);border:1px solid var(--line,#DCE1E6);border-top:2px solid var(--accent,#1D5DA8);border-radius:0 0 3px 3px;box-shadow:0 10px 28px rgba(16,27,39,.12);animation:ngiqDrop .14s ease}
.ngiqNavItem:hover .ngiqNavDrop,.ngiqNavItem:has(:focus-visible) .ngiqNavDrop{display:block}
.ngiqNavItem.ngiqNavClosed .ngiqNavDrop{display:none!important}
.ngiqNavItem:hover>.ngiqHdrNavLink{color:var(--ink,#101B27)!important}
.ngiqNavDrop a{display:block;padding:8px 16px;font-size:14px;line-height:1.35;color:var(--ink-2,#1F2A36);text-decoration:none;white-space:nowrap}
.ngiqNavDrop a:hover,.ngiqNavDrop a:focus-visible{background:var(--surface-2,#F5F6F7);color:var(--accent,#1D5DA8)}
.ngiqNavCaret{font-size:9px;margin-left:5px;color:var(--muted,#6B7682)}
.ngiqHdrMenuItem:hover{background:var(--surface-2,#F5F6F7)!important;color:var(--accent,#1D5DA8)!important}
.ngiqHdrSignOut:hover{background:#FBEAEA!important}
.ngiqHdrSubmit:hover{background:var(--accent-dark,#174C8A)!important}
@media (prefers-reduced-motion:reduce){.ngiqHdrAnim{animation:none!important}}
.ngiqHdrBurger,.ngiqHdrMNav{display:none}
@media (max-width:900px){
.ngiqHdrRow{padding:12px var(--shell-pad)!important;gap:12px 16px!important}
.ngiqHdrBurger{display:inline-flex;align-items:center;gap:8px;margin-left:auto;height:40px;padding:0 12px;border:1px solid var(--line-strong,#B9C1C9);border-radius:3px;background:var(--surface,#fff);font:inherit;font-size:14px;font-weight:500;color:var(--ink,#101B27);cursor:pointer}
.ngiqHdrNav{display:none}
.ngiqHdrSearch,.ngiqHdrActions{display:none!important}
.ngiqHdrRow[data-open="true"] .ngiqHdrSearch{display:block!important;order:3;flex:1 1 100%!important;min-width:0!important}
.ngiqHdrRow[data-open="true"] .ngiqHdrMNav{display:block;order:4;flex:1 1 100%;margin:0 calc(-1 * var(--shell-pad));border-top:1px solid var(--line,#DCE1E6)}
.ngiqHdrRow[data-open="true"] .ngiqHdrActions{display:flex!important;order:5;flex:1 1 100%;flex-wrap:wrap;padding-bottom:4px}
.ngiqHdrRow[data-open="true"] .ngiqHdrSubmit{margin-left:auto}
}
.ngiqHdrMNav details,.ngiqHdrMNav>a{border-bottom:1px solid var(--line-soft,#EEF1F4)}
.ngiqHdrMNav summary,.ngiqHdrMNav>a{display:flex;justify-content:space-between;align-items:center;padding:13px var(--shell-pad);font-size:15px;font-weight:500;color:var(--ink,#101B27);text-decoration:none;cursor:pointer;list-style:none}
.ngiqHdrMNav summary::-webkit-details-marker{display:none}
.ngiqHdrMNav summary::after{content:'';width:7px;height:7px;border-right:1.5px solid var(--muted,#505C68);border-bottom:1.5px solid var(--muted,#505C68);transform:rotate(45deg);margin:-4px 4px 0 0;transition:transform .2s}
.ngiqHdrMNav details[open]>summary::after{transform:rotate(225deg);margin-top:4px}
.ngiqHdrMNav [aria-current="page"]{color:var(--accent,#0C8375);font-weight:600}
.ngiqHdrMNav details div{padding:0 0 10px;background:var(--surface-3,#FAFBFB)}
.ngiqHdrMNav details div a{display:block;padding:9px var(--shell-pad) 9px calc(var(--shell-pad) + 14px);font-size:14px;line-height:1.4;color:var(--ink-2,#1F2A36);text-decoration:none}
`}</style>
      <div className="ngiqHdrRow" data-open={mobileOpen ? 'true' : 'false'} style={{ maxWidth: 1280, margin: '0 auto', padding: '16px var(--shell-pad)', display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          {/* The publisher's horizontal lockup; the stacked logo's lettering is unreadable at header height. */}
          <Image src="/brand/logo-horizontal.webp" alt="NextGenIQ Press" width={192} height={40} priority style={{ display: 'block' }} />
        </Link>
        <button
          type="button"
          className="ngiqHdrBurger"
          aria-expanded={mobileOpen ? 'true' : 'false'}
          aria-controls="ngiq-mnav"
          onClick={() => setMenuPath(mobileOpen ? null : pathname)}
        >
          <span aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ display: 'block', width: 16, height: 1.5, background: 'currentColor', transition: 'transform .2s,opacity .2s', transform: mobileOpen && i !== 1 ? `translateY(${i === 0 ? 5.5 : -5.5}px) rotate(${i === 0 ? 45 : -45}deg)` : 'none', opacity: mobileOpen && i === 1 ? 0 : 1 }}></span>
            ))}
          </span>
          {mobileOpen ? 'Close' : 'Menu'}
        </button>
        <div className="ngiqHdrSearch" style={{ flex: 1, minWidth: 280, position: 'relative', zIndex: 40 }}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              router.push(allHref)
            }}
            role="search"
            className="focus-ring"
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
        <nav
          id="ngiq-mnav"
          aria-label="Primary"
          className="ngiqHdrMNav"
          onClick={(e) => {
            if ((e.target as Element).closest('a')) setMenuPath(null)
          }}
        >
          {nav.map((item) =>
            item.children ? (
              <details key={item.key} open={item.active}>
                <summary aria-current={item.active ? 'page' : undefined}>{item.label}</summary>
                <div>
                  {item.children.some((c) => c.href === item.href) ? null : <Link href={item.href}>{item.label}: overview</Link>}
                  {item.children.map((c) => (
                    <Link key={c.href + c.label} href={c.href}>
                      {c.label}
                    </Link>
                  ))}
                </div>
              </details>
            ) : (
              <Link key={item.key} href={item.href} aria-current={item.active ? 'page' : undefined}>
                {item.label}
              </Link>
            ),
          )}
        </nav>
        <div className="ngiqHdrActions" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
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
              <Link href="/register" style={{ fontSize: 14, color: 'var(--ink-2, #1F2A36)', fontWeight: 500 }}>Register</Link>
            </>
          )}
          <Link href="/submit" className="ngiqHdrSubmit" style={{ background: 'var(--accent, #1D5DA8)', color: '#fff', padding: '9px 16px', borderRadius: 3, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Submit manuscript</Link>
        </div>
      </div>
      <nav aria-label="Primary" className="ngiqHdrNav" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 var(--shell-pad)' }}>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', gap: '0 26px', flexWrap: 'wrap' }}>
          {nav.map((item) => (
            <li key={item.key} className={`ngiqNavItem${closedNav === item.key ? ' ngiqNavClosed' : ''}`} onMouseLeave={() => setClosedNav(null)}>
              <Link
                href={item.href}
                onClick={(e) => {
                  setClosedNav(item.key)
                  e.currentTarget.blur()
                }}
                aria-current={item.active ? 'page' : undefined}
                aria-haspopup={item.children ? 'true' : undefined}
                className="ngiqHdrNavLink"
                style={{ display: 'inline-block', padding: '10px 0 11px', fontSize: 14, fontWeight: item.active ? 600 : 500, color: item.active ? 'var(--ink, #101B27)' : 'var(--ink-3, #3C4854)', borderBottom: `3px solid ${item.active ? 'var(--accent, #1D5DA8)' : 'transparent'}`, textDecoration: 'none' }}
              >
                {item.label}
                {item.children ? <span aria-hidden="true" className="ngiqNavCaret">▼</span> : null}
              </Link>
              {item.children ? (
                <div className="ngiqNavDrop">
                  {item.children.map((c) => (
                    <Link
                      key={c.href + c.label}
                      href={c.href}
                      onClick={(e) => {
                        setClosedNav(item.key)
                        e.currentTarget.blur()
                      }}
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
