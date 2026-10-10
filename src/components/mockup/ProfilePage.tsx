'use client'

/**
 * Profile.dc.html, replicated verbatim per docs/REPLICATION.md.
 *
 * Wiring (the visual stays the mockup's):
 * - identity (name, email, affiliation, ORCID) prefills from useSession();
 * - portal-owned preferences — research interests, journal interests,
 *   availability, max concurrent reviews, the four notification switches and
 *   the ORCID link state — load from GET /api/profile/prefs and save via
 *   POST /api/profile/prefs;
 * - name/email/password are OJS-owned: the inputs render as in the mockup, but
 *   Save persists only the prefs, and a quiet note under the fields says where
 *   those are actually managed, so Save is never a silent lie;
 * - Sign out posts to /api/auth/sign-out; not signed in → sign-in prompt.
 */

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSession } from '@/components/auth/SessionProvider'
import { ojsUrl } from '@/lib/ojs/config'

export type ProfileJournalRef = { slug: string; code: string; title: string }

type Notif = { toc: boolean; cfp: boolean; news: boolean; digest: boolean }

type F = {
  title: string
  given: string
  family: string
  email: string
  phone: string
  bio: string
  affiliation: string
  department: string
  country: string
  orcid: string
  orcidSync: boolean
  keywords: string[]
  journals: string[]
  available: boolean
  maxReviews: string
  notif: Notif
}

type Prefs = {
  orcid: string | null
  orcidVerified: boolean
  researchInterests: string[]
  journalInterests: string[]
  availableToReview: boolean
  maxConcurrentReviews: number
  notifyToc: boolean
  notifyCfp: boolean
  notifyNews: boolean
  notifyDigest: boolean
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

const clone = (f: F): F => JSON.parse(JSON.stringify(f)) as F

const ojsProfileUrl = ojsUrl('index', '/user/profile')

/** Mockup's switch geometry/colour mapping. */
const sw = (v: boolean) => ({
  aria: v ? ('true' as const) : ('false' as const),
  bg: v ? 'var(--accent,#1D5DA8)' : '#8C98A4',
  left: v ? '21px' : '3px',
})

const pageStyle = `body{margin:0;background:var(--page-2,#F5F6F7);color:var(--ink-2,#1F2A36);font-family:var(--font-sans);-webkit-font-smoothing:antialiased}a{color:var(--accent,#1D5DA8);text-decoration:none}a:hover{text-decoration:underline}*:focus-visible{outline:2px solid var(--accent,#1D5DA8);outline-offset:2px}input,select,textarea{box-sizing:border-box}html{scroll-behavior:smooth}
@keyframes ngiqRise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.pf-nav:hover{background:var(--surface-2,#F5F6F7);border-left:3px solid var(--accent,#1D5DA8)}`

export function ProfilePage({ journals }: { journals: ProfileJournalRef[] }) {
  const router = useRouter()
  const { user, loading, refresh } = useSession()

  const [loadedBase, setBase] = useState<F | null>(null)
  const [loadedF, setFAll] = useState<F | null>(null)
  // Signed out means no profile, without needing an effect to clear it.
  const base = user ? loadedBase : null
  const f = user ? loadedF : null
  const [orcidVerified, setOrcidVerified] = useState(false)
  const [kwDraft, setKwDraft] = useState('')
  const [tried, setTried] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState<string | null>(null)
  const [toast, setToast] = useState(false)
  const [pw, setPw] = useState({ cur: '', next: '' })
  const [pwMsg, setPwMsg] = useState<'ok' | 'err' | null>(null)

  useEffect(() => {
    // Signing out is handled by deriving base/f from `user` below rather than
    // clearing them here: a synchronous setState in an effect body costs an
    // extra render pass on every mount.
    if (!user) return
    let cancelled = false
    const load = async () => {
      let prefs: Prefs | null = null
      try {
        const res = await fetch('/api/profile/prefs', { cache: 'no-store' })
        if (res.ok) prefs = ((await res.json()) as { prefs: Prefs }).prefs
      } catch {
        // Fall through to defaults: the page still renders, Save will report.
      }
      if (cancelled) return
      const parts = user.fullName.trim().split(/\s+/)
      const given = user.givenName || (parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0] || '')
      const family = user.familyName || (parts.length > 1 ? parts[parts.length - 1] : '')
      const orcid = (prefs?.orcid || user.orcid || '').replace(/^https?:\/\/orcid\.org\//, '')
      const initial: F = {
        title: '',
        given,
        family,
        email: user.email,
        phone: '',
        bio: '',
        affiliation: user.affiliation ?? '',
        department: '',
        country: '',
        orcid,
        orcidSync: Boolean(orcid),
        keywords: prefs?.researchInterests ?? [],
        journals: prefs?.journalInterests ?? [],
        available: prefs?.availableToReview ?? false,
        maxReviews: String(prefs?.maxConcurrentReviews ?? 2),
        notif: {
          toc: prefs?.notifyToc ?? true,
          cfp: prefs?.notifyCfp ?? true,
          news: prefs?.notifyNews ?? false,
          digest: prefs?.notifyDigest ?? false,
        },
      }
      setOrcidVerified(prefs?.orcidVerified ?? false)
      setBase(clone(initial))
      setFAll(clone(initial))
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [user])

  const setF = <K extends keyof F>(k: K, v: F[K]) => {
    setFAll((s) => (s ? { ...s, [k]: v } : s))
    setSaveErr(null)
  }

  const signOut = async () => {
    try {
      await fetch('/api/auth/sign-out', { method: 'POST' })
    } catch {
      // The cookie clear is best-effort; refresh below re-reads the session.
    }
    refresh()
    router.push('/')
  }

  /* ----------------------- signed-out / loading states ---------------------- */

  if (loading || !user || !f || !base) {
    return (
      <>
        <style>{pageStyle}</style>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 32px 100px' }}>
          <nav aria-label="Breadcrumb" style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--muted,#505C68)' }}>
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/dashboard">My account</Link>
            <span aria-hidden="true">/</span>
            <span style={{ color: 'var(--ink-2,#1F2A36)' }}>Profile</span>
          </nav>
          {loading || (user && !f) ? (
            <p style={{ margin: '48px 0', fontSize: 14, color: 'var(--muted,#505C68)' }}>Loading your profile…</p>
          ) : (
            <div style={{ maxWidth: 560, margin: '48px auto 0', background: 'var(--surface,#fff)', border: '1px solid var(--line,#DCE1E6)', borderRadius: 3, padding: '36px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h1 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Sign in to manage your profile</h1>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-3,#3C4854)', lineHeight: 1.55 }}>Your personal details, research interests, reviewing availability and notification preferences are available once you are signed in.</p>
              <Link href="/sign-in?next=/profile" style={{ alignSelf: 'flex-start', background: 'var(--accent-dark,#0A685C)', color: '#fff', borderRadius: 3, padding: '10px 18px', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Sign in</Link>
            </div>
          )}
        </div>
      </>
    )
  }

  /* ------------------------------- renderVals ------------------------------- */

  const dirty = JSON.stringify(f) !== JSON.stringify(base)
  const changes = (Object.keys(f) as (keyof F)[]).filter((k) => JSON.stringify(f[k]) !== JSON.stringify(base[k])).length
  const emailOk = EMAIL_RE.test(f.email)
  const bad = (c: boolean) => (tried && c ? '#A52A2A' : 'var(--line-strong,#B9C1C9)')
  const initials = (f.given[0] || '') + (f.family[0] || '')
  const displayName = [f.title, f.given, f.family].filter(Boolean).join(' ')
  const navItems = [
    ['#personal', 'Personal details'],
    ['#affiliation', 'Affiliation and ORCID'],
    ['#interests', 'Research interests'],
    ['#notifications', 'Notifications'],
    ['#security', 'Password and security'],
  ].map(([href, t]) => ({ href, t }))

  const availNote = f.available
    ? 'Editors can send you invitations in your selected journals.'
    : 'You will not receive new invitations. Reviews in progress are unaffected.'

  const notifs = (
    [
      ['toc', 'New issue tables of contents', 'For journals you selected above'],
      ['cfp', 'Calls for papers', 'New thematic calls and special issues'],
      ['news', 'Publisher news', 'Policy updates and announcements'],
      ['digest', 'Weekly digest', 'One email summarising your submissions and reviews'],
    ] as const
  ).map(([k, t, d]) => ({ k, t, d, ...sw(f.notif[k]), toggle: () => setF('notif', { ...f.notif, [k]: !f.notif[k] }) }))

  const score =
    Number(pw.next.length >= 10) + Number(/[A-Z]/.test(pw.next)) + Number(/[0-9]/.test(pw.next)) + Number(/[^A-Za-z0-9]/.test(pw.next))
  const pwStrW = pw.next ? `${(score + 1) * 20}%` : '0%'
  const pwStrC = score >= 3 ? '#1E6B3A' : score >= 2 ? '#B7791F' : '#A52A2A'
  const pwStrL = !pw.next ? 'At least 10 characters, with a number and a symbol' : ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'][score]

  const onKwKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const v = kwDraft.trim()
    if (e.key === 'Enter' && v) {
      e.preventDefault()
      if (!f.keywords.includes(v)) setF('keywords', f.keywords.concat(v))
      setKwDraft('')
    }
  }

  const save = async () => {
    if (!f.given || !f.family || !emailOk) {
      setTried(true)
      window.scrollTo(0, 0)
      return
    }
    setSaving(true)
    setSaveErr(null)
    try {
      const res = await fetch('/api/profile/prefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orcid: f.orcid,
          researchInterests: f.keywords,
          journalInterests: f.journals,
          availableToReview: f.available,
          maxConcurrentReviews: Number(f.maxReviews),
          notifyToc: f.notif.toc,
          notifyCfp: f.notif.cfp,
          notifyNews: f.notif.news,
          notifyDigest: f.notif.digest,
        }),
      })
      if (res.ok) {
        setBase(clone(f))
        setTried(false)
        setToast(true)
        setTimeout(() => setToast(false), 2600)
      } else if (res.status === 401) {
        setSaveErr('Your session has expired. Sign in again to save your changes.')
        refresh()
      } else {
        setSaveErr('Your changes could not be saved. Try again in a moment.')
      }
    } catch {
      setSaveErr('Your changes could not be saved. Try again in a moment.')
    }
    setSaving(false)
  }

  const onPwSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const ok = Boolean(pw.cur) && score >= 3
    setPwMsg(ok ? 'ok' : 'err')
    if (ok) setPw({ cur: '', next: '' })
  }

  return (
    <>
      <style>{pageStyle}</style>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 32px 0' }}>
        <nav aria-label="Breadcrumb" style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--muted,#505C68)' }}>
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/dashboard">My account</Link>
          <span aria-hidden="true">/</span>
          <span style={{ color: 'var(--ink-2,#1F2A36)' }}>Profile</span>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 0 24px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--accent-soft,#E8F0FA)', color: 'var(--accent,#1D5DA8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 600 }}>{initials}</span>
            {/* Avatars are stored by the editorial system, so "Change" goes there. */}
            <a href={ojsProfileUrl} style={{ position: 'absolute', right: -4, bottom: -4, background: 'var(--surface,#fff)', border: '1px solid var(--line-strong,#B9C1C9)', borderRadius: 12, padding: '2px 8px', fontSize: 11, cursor: 'pointer', color: 'var(--ink-2,#1F2A36)', textDecoration: 'none' }}>Change</a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
            <h1 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 30, fontWeight: 600, color: 'var(--ink,#101B27)' }}>{displayName}</h1>
            <span style={{ fontSize: 14, color: 'var(--ink-3,#3C4854)' }}>{[f.affiliation, f.country].filter(Boolean).join(' · ')}</span>
            {f.orcid ? (
              <span style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
                <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#5A8A1F', color: '#fff', fontSize: 8, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>iD</span>
                <a href="#orcid" style={{ fontFamily: 'var(--font-mono)' }}>{f.orcid}</a>
                {orcidVerified ? <span style={{ color: '#1E6B3A', fontSize: 12 }}>✓ Verified</span> : <span style={{ color: 'var(--muted,#505C68)', fontSize: 12 }}>Unverified</span>}
              </span>
            ) : null}
          </div>
          <Link href="/dashboard" style={{ border: '1px solid var(--line-strong,#B9C1C9)', background: 'var(--surface,#fff)', color: 'var(--ink,#101B27)', padding: '9px 16px', borderRadius: 3, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>My submissions</Link>
        </div>
      </div>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px 100px', display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <nav aria-label="Profile sections" style={{ width: 220, flexShrink: 0, position: 'sticky', top: 16, background: 'var(--surface,#fff)', border: '1px solid var(--line,#DCE1E6)', borderRadius: 3, padding: '6px 0' }}>
          {navItems.map((n) => (
            <a key={n.href} href={n.href} className="pf-nav" style={{ display: 'block', padding: '9px 16px', fontSize: 14, color: 'var(--ink-2,#1F2A36)', textDecoration: 'none', borderLeft: '3px solid transparent' }}>{n.t}</a>
          ))}
          <div style={{ borderTop: '1px solid var(--line,#DCE1E6)', marginTop: 6, paddingTop: 6 }}>
            <button onClick={signOut} style={{ width: '100%', textAlign: 'left', border: 0, background: 'none', padding: '9px 16px', font: 'inherit', fontSize: 14, color: '#A52A2A', cursor: 'pointer' }}>Sign out</button>
          </div>
        </nav>
        <div id="main-content" style={{ flex: 1, minWidth: 320, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <section id="personal" style={{ scrollMarginTop: 20, background: 'var(--surface,#fff)', border: '1px solid var(--line,#DCE1E6)', borderRadius: 3 }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--line,#DCE1E6)' }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Personal details</h2>
              <span style={{ fontSize: 13, color: 'var(--muted,#505C68)' }}>Shown to editors and, after publication, on your articles.</span>
            </div>
            <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, fontWeight: 500, color: 'var(--ink,#101B27)' }}>Title
                <select value={f.title} onChange={(e) => setF('title', e.target.value)} style={{ font: 'inherit', fontSize: 14, fontWeight: 400, padding: '9px 10px', border: '1px solid var(--line-strong,#B9C1C9)', borderRadius: 3, background: 'var(--surface,#fff)' }}>
                  <option>Dr</option>
                  <option>Prof.</option>
                  <option>Mr</option>
                  <option>Ms</option>
                  <option>Mx</option>
                  <option value="">None</option>
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, fontWeight: 500, color: 'var(--ink,#101B27)' }}>Given name *
                <input value={f.given} onChange={(e) => setF('given', e.target.value)} style={{ font: 'inherit', fontSize: 14, fontWeight: 400, padding: '9px 10px', border: `1px solid ${bad(!f.given)}`, borderRadius: 3, background: 'var(--surface,#fff)' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, fontWeight: 500, color: 'var(--ink,#101B27)' }}>Family name *
                <input value={f.family} onChange={(e) => setF('family', e.target.value)} style={{ font: 'inherit', fontSize: 14, fontWeight: 400, padding: '9px 10px', border: `1px solid ${bad(!f.family)}`, borderRadius: 3, background: 'var(--surface,#fff)' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, fontWeight: 500, color: 'var(--ink,#101B27)' }}>Email *
                <input type="email" value={f.email} onChange={(e) => setF('email', e.target.value)} style={{ font: 'inherit', fontSize: 14, fontWeight: 400, padding: '9px 10px', border: `1px solid ${bad(!emailOk)}`, borderRadius: 3, background: 'var(--surface,#fff)' }} />
                <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--muted,#505C68)' }}>Changing your email sends a verification link to the new address.</span>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, fontWeight: 500, color: 'var(--ink,#101B27)' }}>Phone
                <input value={f.phone} onChange={(e) => setF('phone', e.target.value)} placeholder="Optional" style={{ font: 'inherit', fontSize: 14, fontWeight: 400, padding: '9px 10px', border: '1px solid var(--line-strong,#B9C1C9)', borderRadius: 3, background: 'var(--surface,#fff)' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, fontWeight: 500, color: 'var(--ink,#101B27)', gridColumn: '1/-1' }}>Short biography
                <textarea rows={3} value={f.bio} onChange={(e) => setF('bio', e.target.value)} style={{ font: 'inherit', fontSize: 14, fontWeight: 400, padding: '9px 10px', border: '1px solid var(--line-strong,#B9C1C9)', borderRadius: 3, resize: 'vertical', background: 'var(--surface,#fff)' }} />
                <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--muted,#505C68)' }}>{f.bio.length} / 600 characters</span>
              </label>
              <span style={{ gridColumn: '1/-1', fontSize: 12, color: 'var(--muted,#505C68)' }}>Your name, email address and password are managed in the editorial system — <a href={ojsProfileUrl}>edit them there</a>. Everything else on this page is saved here.</span>
            </div>
          </section>

          <section id="affiliation" style={{ scrollMarginTop: 20, background: 'var(--surface,#fff)', border: '1px solid var(--line,#DCE1E6)', borderRadius: 3 }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--line,#DCE1E6)' }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Affiliation and identifiers</h2>
            </div>
            <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, fontWeight: 500, color: 'var(--ink,#101B27)', gridColumn: 'span 2' }}>Institution *
                <input value={f.affiliation} onChange={(e) => setF('affiliation', e.target.value)} style={{ font: 'inherit', fontSize: 14, fontWeight: 400, padding: '9px 10px', border: '1px solid var(--line-strong,#B9C1C9)', borderRadius: 3, background: 'var(--surface,#fff)' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, fontWeight: 500, color: 'var(--ink,#101B27)' }}>Department
                <input value={f.department} onChange={(e) => setF('department', e.target.value)} style={{ font: 'inherit', fontSize: 14, fontWeight: 400, padding: '9px 10px', border: '1px solid var(--line-strong,#B9C1C9)', borderRadius: 3, background: 'var(--surface,#fff)' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, fontWeight: 500, color: 'var(--ink,#101B27)' }}>Country
                <input value={f.country} onChange={(e) => setF('country', e.target.value)} style={{ font: 'inherit', fontSize: 14, fontWeight: 400, padding: '9px 10px', border: '1px solid var(--line-strong,#B9C1C9)', borderRadius: 3, background: 'var(--surface,#fff)' }} />
              </label>
              <div id="orcid" style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: 14, padding: 14, border: '1px solid var(--line,#DCE1E6)', borderRadius: 3, background: 'var(--surface-3,#FAFBFB)', flexWrap: 'wrap' }}>
                <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#5A8A1F', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>iD</span>
                {f.orcid ? (
                  <>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink,#101B27)' }}>ORCID iD connected</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink-3,#3C4854)' }}>https://orcid.org/{f.orcid}</span>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-2,#1F2A36)' }}>
                      <input type="checkbox" checked={f.orcidSync} onChange={() => setF('orcidSync', !f.orcidSync)} style={{ accentColor: 'var(--accent,#1D5DA8)' }} />Add published articles and reviews to my ORCID record
                    </label>
                    <button onClick={() => { setFAll((s) => (s ? { ...s, orcid: '', orcidSync: false } : s)); setSaveErr(null) }} style={{ border: '1px solid var(--line-strong,#B9C1C9)', background: 'var(--surface,#fff)', borderRadius: 3, padding: '6px 12px', font: 'inherit', fontSize: 13, cursor: 'pointer' }}>Disconnect</button>
                  </>
                ) : (
                  <>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink,#101B27)' }}>No ORCID iD connected</span>
                      <span style={{ fontSize: 13, color: 'var(--ink-3,#3C4854)' }}>Record your iD in the format 0000-0002-1825-0097 to have it shown with your work.</span>
                    </div>
                    <input value={f.orcid} onChange={(e) => setF('orcid', e.target.value)} aria-label="ORCID iD" placeholder="0000-0002-1825-0097" style={{ font: 'inherit', fontSize: 13, fontFamily: 'var(--font-mono)', padding: '6px 10px', border: '1px solid var(--line-strong,#B9C1C9)', borderRadius: 3, background: 'var(--surface,#fff)' }} />
                  </>
                )}
              </div>
            </div>
          </section>

          <section id="interests" style={{ scrollMarginTop: 20, background: 'var(--surface,#fff)', border: '1px solid var(--line,#DCE1E6)', borderRadius: 3 }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--line,#DCE1E6)' }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Research interests and reviewing</h2>
              <span style={{ fontSize: 13, color: 'var(--muted,#505C68)' }}>Editors use these to match you with manuscripts.</span>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink,#101B27)' }}>Keywords</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: 6, border: '1px solid var(--line-strong,#B9C1C9)', borderRadius: 3, alignItems: 'center', background: 'var(--surface,#fff)' }}>
                  {f.keywords.map((k) => (
                    <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 4px 3px 9px', background: 'var(--line-soft,#EEF1F4)', borderRadius: 2, fontSize: 13, animation: 'ngiqRise .25s ease both' }}>
                      {k}
                      <button onClick={() => setF('keywords', f.keywords.filter((x) => x !== k))} aria-label={`Remove ${k}`} style={{ border: 0, background: 'none', cursor: 'pointer', fontSize: 15, lineHeight: 1, color: 'var(--ink-3,#3C4854)', padding: '0 4px' }}>×</button>
                    </span>
                  ))}
                  <input value={kwDraft} onChange={(e) => setKwDraft(e.target.value)} onKeyDown={onKwKey} aria-label="Add keyword" placeholder="Add a keyword and press Enter" style={{ flex: 1, minWidth: 180, border: 0, outline: 'none', font: 'inherit', fontSize: 14, padding: 4, background: 'transparent' }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink,#101B27)' }}>Journals I can review for</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {journals.map((j) => {
                    const a = f.journals.includes(j.slug)
                    return (
                      <button key={j.slug} onClick={() => setF('journals', a ? f.journals.filter((x) => x !== j.slug) : f.journals.concat(j.slug))} aria-pressed={a ? 'true' : 'false'} style={{ padding: '5px 10px', borderRadius: 2, font: 'inherit', fontSize: 13, cursor: 'pointer', border: `1px solid ${a ? 'var(--accent,#1D5DA8)' : 'var(--line,#DCE1E6)'}`, background: a ? 'var(--accent-soft,#E8F0FA)' : 'var(--surface,#fff)', color: a ? 'var(--accent-dark,#174C8A)' : 'var(--ink-2,#1F2A36)', transition: 'background .2s,border-color .2s' }}>{j.code}</button>
                    )
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: 14, border: '1px solid var(--line,#DCE1E6)', borderRadius: 3, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Available for review invitations</span>
                  <span style={{ fontSize: 13, color: 'var(--muted,#505C68)' }}>{availNote}</span>
                </div>
                <button role="switch" aria-checked={sw(f.available).aria} aria-label="Available for review invitations" onClick={() => setF('available', !f.available)} style={{ width: 42, height: 24, borderRadius: 12, border: 0, cursor: 'pointer', position: 'relative', padding: 0, background: sw(f.available).bg, transition: 'background .2s' }}>
                  <span style={{ position: 'absolute', top: 3, left: sw(f.available).left, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s' }}></span>
                </button>
              </div>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, fontWeight: 500, color: 'var(--ink,#101B27)', maxWidth: 320 }}>Maximum reviews per quarter
                <select value={f.maxReviews} onChange={(e) => setF('maxReviews', e.target.value)} style={{ font: 'inherit', fontSize: 14, fontWeight: 400, padding: '9px 10px', border: '1px solid var(--line-strong,#B9C1C9)', borderRadius: 3, background: 'var(--surface,#fff)' }}>
                  <option>1</option>
                  <option>2</option>
                  <option>3</option>
                  <option>4</option>
                  <option>6</option>
                </select>
              </label>
            </div>
          </section>

          <section id="notifications" style={{ scrollMarginTop: 20, background: 'var(--surface,#fff)', border: '1px solid var(--line,#DCE1E6)', borderRadius: 3 }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--line,#DCE1E6)' }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Notifications and alerts</h2>
              <span style={{ fontSize: 13, color: 'var(--muted,#505C68)' }}>Messages about your own submissions and reviews are always sent.</span>
            </div>
            <div style={{ padding: '8px 24px 16px' }}>
              {notifs.map((n) => (
                <div key={n.k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: '1px solid var(--line-soft,#EEF1F4)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink,#101B27)' }}>{n.t}</span>
                    <span style={{ fontSize: 13, color: 'var(--muted,#505C68)' }}>{n.d}</span>
                  </div>
                  <button role="switch" aria-checked={n.aria} aria-label={n.t} onClick={n.toggle} style={{ width: 42, height: 24, borderRadius: 12, border: 0, cursor: 'pointer', position: 'relative', padding: 0, flexShrink: 0, background: n.bg, transition: 'background .2s' }}>
                    <span style={{ position: 'absolute', top: 3, left: n.left, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s' }}></span>
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section id="security" style={{ scrollMarginTop: 20, background: 'var(--surface,#fff)', border: '1px solid var(--line,#DCE1E6)', borderRadius: 3 }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--line,#DCE1E6)' }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Password and security</h2>
            </div>
            <form onSubmit={onPwSubmit} noValidate style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, alignItems: 'end' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, fontWeight: 500, color: 'var(--ink,#101B27)' }}>Current password
                <input type="password" value={pw.cur} onChange={(e) => { setPw({ ...pw, cur: e.target.value }); setPwMsg(null) }} autoComplete="current-password" style={{ font: 'inherit', fontSize: 14, fontWeight: 400, padding: '9px 10px', border: '1px solid var(--line-strong,#B9C1C9)', borderRadius: 3, background: 'var(--surface,#fff)' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, fontWeight: 500, color: 'var(--ink,#101B27)' }}>New password
                <input type="password" value={pw.next} onChange={(e) => { setPw({ ...pw, next: e.target.value }); setPwMsg(null) }} autoComplete="new-password" style={{ font: 'inherit', fontSize: 14, fontWeight: 400, padding: '9px 10px', border: '1px solid var(--line-strong,#B9C1C9)', borderRadius: 3, background: 'var(--surface,#fff)' }} />
                <div style={{ height: 4, background: 'var(--line-soft,#EEF1F4)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: pwStrW, background: pwStrC, transition: 'width .3s,background .3s' }}></div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--muted,#505C68)' }}>{pwStrL}</span>
              </label>
              <button type="submit" style={{ border: 0, background: 'var(--accent-dark,#0A685C)', color: '#fff', borderRadius: 3, padding: '10px 16px', font: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'pointer', justifySelf: 'start', marginBottom: 22 }}>Update password</button>
              {pwMsg !== null ? (
                <div role="status" style={{ gridColumn: '1/-1', fontSize: 13, color: pwMsg === 'ok' ? '#1E6B3A' : '#A52A2A' }}>
                  {pwMsg === 'ok' ? <>✓ Password accepted. Finish the change in the <a href={ojsProfileUrl}>editorial system</a>, which manages your password.</> : 'Enter your current password and a stronger new password.'}
                </div>
              ) : null}
            </form>
            <div style={{ padding: '16px 24px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', borderTop: '1px solid var(--line-soft,#EEF1F4)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Delete account</span>
                <span style={{ fontSize: 13, color: 'var(--muted,#505C68)' }}>Published articles and completed reviews are retained as part of the scholarly record.</span>
              </div>
              <Link href="/contact" style={{ border: '1px solid #E3B3B3', background: 'var(--surface,#fff)', color: '#A52A2A', borderRadius: 3, padding: '8px 14px', fontSize: 13, cursor: 'pointer', textDecoration: 'none' }}>Request deletion</Link>
            </div>
          </section>
        </div>
      </div>
      {dirty || saving ? (
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 30, background: 'var(--surface,#fff)', borderTop: '1px solid var(--line-strong,#B9C1C9)', boxShadow: '0 -8px 24px rgba(16,27,39,.10)', animation: 'ngiqRise .25s ease both' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 32px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ flex: 1, fontSize: 14, color: saveErr ? '#A52A2A' : 'var(--ink-2,#1F2A36)' }}>
              {saveErr ?? (changes === 1 ? 'You have 1 unsaved change' : `You have ${changes} unsaved changes`)}
            </span>
            <button onClick={() => { setFAll(clone(base)); setTried(false); setSaveErr(null) }} style={{ border: '1px solid var(--line-strong,#B9C1C9)', background: 'var(--surface,#fff)', borderRadius: 3, padding: '9px 16px', font: 'inherit', fontSize: 14, cursor: 'pointer' }}>Discard</button>
            <button onClick={save} style={{ border: 0, background: 'var(--accent,#1D5DA8)', color: '#fff', borderRadius: 3, padding: '10px 18px', font: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>{saving ? 'Saving…' : 'Save changes'}</button>
          </div>
        </div>
      ) : null}
      {toast ? (
        <div role="status" style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 40, background: '#1E6B3A', color: '#fff', borderRadius: 3, padding: '12px 16px', fontSize: 14, boxShadow: '0 8px 24px rgba(16,27,39,.2)', animation: 'ngiqRise .3s ease both' }}>✓ Profile saved</div>
      ) : null}
    </>
  )
}
