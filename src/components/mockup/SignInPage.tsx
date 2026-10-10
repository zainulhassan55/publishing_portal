'use client'

/**
 * SignIn.dc.html, replicated verbatim per docs/REPLICATION.md.
 *
 * Behaviour wiring (the visual stays the mockup's):
 * - the form posts to POST /api/auth/sign-in — never localStorage;
 * - 200 → refresh the session and follow ?next= (same-origin paths only);
 * - 401 → the mockup's inline error style; 503 → OJS login link; 429 → retry;
 * - "Create an account" / "Forgot password?" go to the editorial system (OJS),
 *   which owns registration and password recovery.
 *
 * `nativeSignIn` reflects PORTAL_NATIVE_SIGNIN. While it is false the credential
 * form is not rendered at all and the page leads with the link out to OJS: the
 * endpoint returns 503 unconditionally, and showing a form that cannot succeed
 * invites people to conclude their password is wrong. It is a prop rather than
 * a client-side env read so the flag stays server-side.
 */

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { useSession } from '@/components/auth/SessionProvider'
import { ojsLoginUrl, ojsLostPasswordUrl, ojsRegisterUrl } from '@/lib/ojs/config'

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/** Only same-origin absolute paths are followed, so `?next=` cannot be an open redirect. */
const safeNext = (value: string | null): string => {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/dashboard'
  return value
}

type Failure = 'credentials' | 'unavailable' | 'rate-limited' | 'generic'

export function SignInPage({ nativeSignIn = false }: { nativeSignIn?: boolean }) {
  const router = useRouter()
  const params = useSearchParams()
  const { refresh } = useSession()

  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [tried, setTried] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<Failure | null>(null)

  const eBad = tried && !EMAIL_RE.test(email)
  const pBad = tried && !pw

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTried(true)
    const ok = EMAIL_RE.test(email) && pw
    if (!ok || busy) return
    setBusy(true)
    setFailure(null)
    try {
      const res = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pw }),
      })
      if (res.ok) {
        refresh()
        router.push(safeNext(params.get('next')))
        return // stay busy while navigating
      }
      if (res.status === 401) setFailure('credentials')
      else if (res.status === 503) setFailure('unavailable')
      else if (res.status === 429) setFailure('rate-limited')
      else setFailure('generic')
    } catch {
      setFailure('generic')
    }
    setBusy(false)
  }

  return (
    <>
      <style>{`body{margin:0;background:var(--page-2,var(--surface-2,#F5F6F7));color:var(--ink-2,#1F2A36);font-family:var(--font-sans);-webkit-font-smoothing:antialiased}a{color:var(--accent,#1D5DA8);text-decoration:none}a:hover{text-decoration:underline}*:focus-visible{outline:2px solid var(--accent,#1D5DA8);outline-offset:2px}`}</style>
      <div id="main-content" style={{ maxWidth: 960, margin: '56px auto 0', padding: '0 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,380px),1fr))', gap: 0, background: 'var(--surface,#fff)', border: '1px solid var(--line,#DCE1E6)', borderRadius: 3, boxSizing: 'border-box' }}>
        <section style={{ padding: '36px 40px', borderRight: '1px solid var(--line,#DCE1E6)', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Sign in</h1>
          <p style={{ margin: '-8px 0 0', fontSize: 14, color: 'var(--ink-3,#3C4854)', lineHeight: 1.5 }}>One account for submitting, reviewing and tracking manuscripts across all NextGenIQ Press journals.</p>
          {!nativeSignIn ? (
            <>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-3,#3C4854)', lineHeight: 1.55 }}>Accounts are held in the editorial system, which is where signing in, registration and password recovery all happen.</p>
              <a href={ojsLoginUrl} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, border: 0, background: 'var(--accent-dark,#0A685C)', color: '#fff', borderRadius: 3, padding: 11, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Continue to the editorial system</a>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--muted,#505C68)', lineHeight: 1.55 }}>You will return here to browse journals and articles. <a href={ojsLostPasswordUrl}>Forgot your password?</a></p>
            </>
          ) : null}
          <div hidden={!nativeSignIn} style={{ display: nativeSignIn ? 'flex' : 'none', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--muted,#505C68)' }}>
            <span style={{ flex: 1, height: 1, background: 'var(--line,#DCE1E6)' }}></span>sign in with email<span style={{ flex: 1, height: 1, background: 'var(--line,#DCE1E6)' }}></span>
          </div>
          <form onSubmit={onSubmit} noValidate hidden={!nativeSignIn} style={{ display: nativeSignIn ? 'flex' : 'none', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label htmlFor="si-email" style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink,#101B27)' }}>Email address</label>
              <input id="si-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={eBad ? 'true' : 'false'} style={{ font: 'inherit', fontSize: 14, padding: '9px 12px', border: `1px solid ${eBad ? '#A52A2A' : 'var(--line-strong,#B9C1C9)'}`, borderRadius: 3 }} />
              {eBad ? <span style={{ fontSize: 13, color: '#A52A2A' }}>Enter the email address you registered with</span> : null}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label htmlFor="si-pw" style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink,#101B27)' }}>Password</label>
                <a href={ojsLostPasswordUrl} style={{ fontSize: 13 }}>Forgot password?</a>
              </div>
              <input id="si-pw" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} aria-invalid={pBad ? 'true' : 'false'} style={{ font: 'inherit', fontSize: 14, padding: '9px 12px', border: `1px solid ${pBad ? '#A52A2A' : 'var(--line-strong,#B9C1C9)'}`, borderRadius: 3 }} />
              {pBad ? <span style={{ fontSize: 13, color: '#A52A2A' }}>Enter your password</span> : null}
            </div>
            {failure !== null ? (
              <div role="alert" style={{ fontSize: 13, color: '#A52A2A', lineHeight: 1.5 }}>
                {failure === 'credentials' ? (
                  <>That email address and password do not match an account. Check both and try again.</>
                ) : failure === 'unavailable' ? (
                  <>Signing in from the portal is not available. <a href={ojsLoginUrl} style={{ color: '#A52A2A', textDecoration: 'underline' }}>Sign in on the editorial system instead</a> — your account works there.</>
                ) : failure === 'rate-limited' ? (
                  <>Too many sign-in attempts. Wait a few minutes and try again.</>
                ) : (
                  <>Something went wrong while signing you in. Try again, or <a href={ojsLoginUrl} style={{ color: '#A52A2A', textDecoration: 'underline' }}>use the editorial system sign-in</a>.</>
                )}
              </div>
            ) : null}
            <button type="submit" disabled={busy} style={{ border: 0, background: 'var(--accent-dark,#0A685C)', color: '#fff', borderRadius: 3, padding: 11, font: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>{busy ? 'Signing in…' : 'Sign in'}</button>
          </form>
        </section>
        <section style={{ padding: '36px 40px', display: 'flex', flexDirection: 'column', gap: 14, background: 'var(--surface-3,#FAFBFB)' }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 600, color: 'var(--ink,#101B27)' }}>New to NextGenIQ Press?</h2>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-3,#3C4854)', lineHeight: 1.55 }}>Create an account to submit a manuscript or register as a reviewer. You can hold both roles with one account.</p>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.8, color: 'var(--ink-2,#1F2A36)' }}>
            <li>Save drafts and resume at any time</li>
            <li>Track every submission’s status and decisions</li>
            <li>Link your ORCID iD to receive review recognition</li>
          </ul>
          <a href={ojsRegisterUrl} style={{ marginTop: 6, border: '1px solid var(--line-strong,#B9C1C9)', background: 'var(--surface,#fff)', borderRadius: 3, padding: 10, textAlign: 'center', fontSize: 14, fontWeight: 500, color: 'var(--ink,#101B27)', textDecoration: 'none' }}>Create an account</a>
          <p style={{ margin: 'auto 0 0', fontSize: 12, color: 'var(--muted,#505C68)', lineHeight: 1.5 }}>By signing in you agree to the <Link href="/policies/terms">terms of use</Link> and <Link href="/policies/privacy">privacy policy</Link>.</p>
        </section>
      </div>
    </>
  )
}
