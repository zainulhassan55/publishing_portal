'use client'

/**
 * Registration, on the portal.
 *
 * The account is created in OJS — it owns every user on the site — but the
 * person never sees it happen. The form posts to /api/auth/register, which
 * relays to OJS's own registration form and signs the new member straight in.
 *
 * Journals are chosen here because OJS enrols per journal, and a member with
 * no journal is registered into nothing. Reviewer is offered as a tick rather
 * than a separate flow: it is how OJS's own form offers it, and a reviewer is
 * simply a member who has agreed to be asked.
 */

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { safeNext, signInHref } from '@/lib/auth/links'
import { useSession } from '@/components/auth/SessionProvider'
import { Turnstile, captchaRequired, type TurnstileHandle } from '@/components/auth/Turnstile'
import { COUNTRIES } from '@/data/countries'
import type { JournalRef } from './DashboardPage'

type FieldError = { field: string; message: string }

const label: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--ink-2,#1F2A36)',
  display: 'flex',
  flexDirection: 'column',
  gap: 5,
}

/**
 * The required marker.
 *
 * Every field on this form bar the reviewer tick is required, but nothing said
 * so: the inputs carried `required` for the browser and the route rejected a
 * blank one, and neither fact is visible to someone reading the form. OJS's own
 * registration form marks them, so the portal version losing the markers was a
 * regression against the page it replaced.
 *
 * `aria-hidden` on the asterisk with the word beside it is how OJS does it too:
 * a screen reader announcing "star" says nothing, and `required` on the input
 * is what actually carries the state to assistive technology.
 */
const Req = () => (
  <>
    <span aria-hidden="true" style={{ color: '#A52A2A' }}>
      {' '}
      *
    </span>
    <span
      style={{
        position: 'absolute',
        width: 1,
        height: 1,
        margin: -1,
        padding: 0,
        overflow: 'hidden',
        clip: 'rect(0 0 0 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {' '}
      (required)
    </span>
  </>
)

const input: React.CSSProperties = {
  border: '1px solid var(--line-strong,#B9C1C9)',
  borderRadius: 3,
  padding: '9px 11px',
  font: 'inherit',
  fontSize: 14,
  color: 'var(--ink,#101B27)',
  background: 'var(--surface,#fff)',
}

export function RegisterPage({ journals }: { journals: JournalRef[] }) {
  const router = useRouter()
  const { refresh } = useSession()

  const [f, setF] = useState({
    givenName: '',
    familyName: '',
    email: '',
    username: '',
    password: '',
    passwordConfirm: '',
    affiliation: '',
    country: '',
  })
  const [picked, setPicked] = useState<string[]>([])
  const [asReviewer, setAsReviewer] = useState(false)
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<FieldError[]>([])
  const [failure, setFailure] = useState<string | null>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const captcha = useRef<TurnstileHandle>(null)

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setF((s) => ({ ...s, [k]: e.target.value }))
    setErrors((es) => es.filter((x) => x.field !== k))
    setFailure(null)
  }

  const errorFor = (field: string) => errors.find((e) => e.field === field)?.message

  const toggleJournal = (title: string) =>
    setPicked((p) => (p.includes(title) ? p.filter((x) => x !== title) : [...p, title]))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])
    setFailure(null)

    // Checked before anything is sent, because a mismatch means one of the two
    // is a typo and the whole point is to stop that typo becoming the password.
    if (f.password !== f.passwordConfirm) {
      setErrors([{ field: 'passwordConfirm', message: 'The two passwords do not match. Type the same password in both boxes.' }])
      return
    }
    if (captchaRequired && !captchaToken) {
      setFailure('Please complete the security check, then create your account.')
      return
    }

    setBusy(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Journal *titles*, because that is what OJS labels its enrolment
        // checkboxes with and what the relay matches on.
        body: JSON.stringify({ ...f, journals: picked, asReviewer, captchaToken }),
      })

      const data = (await response.json()) as {
        ok?: boolean
        error?: string
        message?: string
        errors?: FieldError[]
        signedIn?: boolean
      }

      if (!response.ok || !data.ok) {
        // Field and rate-limit refusals come before the captcha check, so the
        // token is still good; anything later spent it.
        if (response.status !== 422 && response.status !== 429) captcha.current?.reset()
        if (data.errors?.length) setErrors(data.errors)
        else if (data.message) setFailure(data.message)
        else if (data.error === 'rate-limited') setFailure('Too many attempts. Please try again in a few minutes.')
        else setFailure('Registration could not be completed. Please try again.')
        return
      }

      // A visitor sent here from a form ("No account? Create one") goes back to
      // that form. Read at submit time, so the page needs no Suspense boundary.
      const next = safeNext(new URLSearchParams(window.location.search).get('next'))
      if (data.signedIn) {
        refresh()
        router.push(next)
      } else {
        // The account exists but the automatic sign-in did not land. Saying so
        // beats a silent redirect to a page that will ask who they are.
        router.push(`${signInHref(next)}&registered=1`)
      }
    } catch {
      captcha.current?.reset()
      setFailure('Registration could not be completed. Please check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px var(--shell-pad) 100px' }}>
      <nav aria-label="Breadcrumb" style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--muted,#505C68)' }}>
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span style={{ color: 'var(--ink-2,#1F2A36)' }}>Create an account</span>
      </nav>

      <div style={{ maxWidth: 620, margin: '28px auto 0' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 28, lineHeight: 1.2, color: 'var(--ink,#101B27)' }}>
          Create an account
        </h1>
        <p style={{ margin: '0 0 10px', fontSize: 14, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)' }}>
          One account submits manuscripts, tracks decisions and accepts review invitations across every NextGenIQ Press
          journal. Already have one? <Link href="/sign-in">Sign in</Link>.
        </p>
        <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--muted,#505C68)' }}>
          Fields marked{' '}
          <span aria-hidden="true" style={{ color: '#A52A2A' }}>
            *
          </span>
          <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
            with an asterisk
          </span>{' '}
          are required.
        </p>

        <form
          onSubmit={onSubmit}
          noValidate
          style={{
            background: 'var(--surface,#fff)',
            border: '1px solid var(--line,#DCE1E6)',
            borderRadius: 4,
            padding: '26px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {failure ? (
            <p
              role="alert"
              style={{
                margin: 0,
                background: '#FBEAEA',
                border: '1px solid #E3B3B3',
                borderRadius: 3,
                padding: '10px 12px',
                fontSize: 13,
                color: '#A52A2A',
                lineHeight: 1.5,
              }}
            >
              {failure}
            </p>
          ) : null}

          <div className="m-1col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <label style={label}>
              <span>
                First name
                <Req />
              </span>
              <input style={input} value={f.givenName} onChange={set('givenName')} autoComplete="given-name" required />
              {errorFor('givenName') ? <Err>{errorFor('givenName')}</Err> : null}
            </label>
            <label style={label}>
              <span>
                Last name
                <Req />
              </span>
              <input style={input} value={f.familyName} onChange={set('familyName')} autoComplete="family-name" required />
              {errorFor('familyName') ? <Err>{errorFor('familyName')}</Err> : null}
            </label>
          </div>

          <label style={label}>
            <span>
              Email address
              <Req />
            </span>
            <input style={input} type="email" value={f.email} onChange={set('email')} autoComplete="email" required />
            {errorFor('email') ? <Err>{errorFor('email')}</Err> : null}
          </label>

          {/*
            Affiliation and country are both required — not a house style
            choice, but what OJS's own form demands. Offering them as optional
            here would mean a registration the portal accepts and OJS rejects,
            reported back as an error on a field the person was told to skip.
          */}
          <label style={label}>
            <span>
              Affiliation
              <Req />
            </span>
            <input
              style={input}
              value={f.affiliation}
              onChange={set('affiliation')}
              autoComplete="organization"
              placeholder="University, institute or company"
              required
            />
            {errorFor('affiliation') ? <Err>{errorFor('affiliation')}</Err> : null}
          </label>

          <label style={label}>
            <span>
              Country
              <Req />
            </span>
            <select
              style={{ ...input, appearance: 'auto' }}
              value={f.country}
              onChange={(e) => {
                setF((s) => ({ ...s, country: e.target.value }))
                setErrors((es) => es.filter((x) => x.field !== 'country'))
              }}
              autoComplete="country"
              required
            >
              <option value="">Select a country…</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
            {errorFor('country') ? <Err>{errorFor('country')}</Err> : null}
          </label>

          <div className="m-1col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <label style={label}>
              <span>
                Username
                <Req />
              </span>
              {/* OJS's own column is 32 characters; a longer one is rejected
                  after the round trip rather than while typing. */}
              <input
                style={input}
                value={f.username}
                onChange={set('username')}
                autoComplete="username"
                maxLength={32}
                required
              />
              {errorFor('username') ? <Err>{errorFor('username')}</Err> : null}
            </label>
            <label style={label}>
              <span>
                Password
                <Req />
              </span>
              <input
                style={input}
                type="password"
                value={f.password}
                onChange={set('password')}
                autoComplete="new-password"
                minLength={6}
                required
              />
              {/* The rule stated up front rather than discovered by rejection.
                  Six is OJS's own floor and the route's MIN_PASSWORD. */}
              {errorFor('password') ? (
                <Err>{errorFor('password')}</Err>
              ) : (
                <span style={{ fontSize: 12, color: 'var(--muted,#505C68)' }}>At least 6 characters.</span>
              )}
            </label>
          </div>

          {/* OJS's own form asks for the password twice, and this one did not.
              The relay filled OJS's second box with a copy of the first, so a
              password mistyped here was accepted without question — and the
              person then could not sign in with the password they thought
              they had chosen. With site email not yet configured there is no
              reset to fall back on, so the typo had to be caught here. */}
          <label style={label}>
            <span>
              Confirm password
              <Req />
            </span>
            <input
              style={input}
              type="password"
              value={f.passwordConfirm}
              onChange={set('passwordConfirm')}
              autoComplete="new-password"
              minLength={6}
              required
            />
            {errorFor('passwordConfirm') ? (
              <Err>{errorFor('passwordConfirm')}</Err>
            ) : (
              <span style={{ fontSize: 12, color: 'var(--muted,#505C68)' }}>Type the same password again.</span>
            )}
          </label>

          <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <legend style={{ padding: 0, fontSize: 13, fontWeight: 500, color: 'var(--ink-2,#1F2A36)' }}>
              Which journals would you like to register with?
              <Req />
            </legend>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--muted,#505C68)', lineHeight: 1.5 }}>
              You can submit to any of them later; this only sets where you are listed now.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 2 }}>
              {journals.map((j) => {
                const on = picked.includes(j.title)
                return (
                  <button
                    type="button"
                    key={j.slug}
                    onClick={() => toggleJournal(j.title)}
                    aria-pressed={on}
                    title={j.title}
                    style={{
                      border: `1px solid ${on ? 'var(--accent,#1D5DA8)' : 'var(--line-strong,#B9C1C9)'}`,
                      background: on ? 'var(--accent-soft,#E8F0FA)' : 'var(--surface,#fff)',
                      color: on ? 'var(--accent-dark,#174C8A)' : 'var(--ink,#101B27)',
                      borderRadius: 3,
                      padding: '6px 11px',
                      font: 'inherit',
                      fontSize: 13,
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                    }}
                  >
                    {j.code}
                  </button>
                )
              })}
            </div>
            {errorFor('journals') ? <Err>{errorFor('journals')}</Err> : null}
          </fieldset>

          <label style={{ display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: 13, color: 'var(--ink-2,#1F2A36)', lineHeight: 1.5 }}>
            <input
              type="checkbox"
              checked={asReviewer}
              onChange={(e) => setAsReviewer(e.target.checked)}
              style={{ marginTop: 2 }}
            />
            <span>
              I am willing to review manuscripts for the journals selected above.
              <span style={{ display: 'block', color: 'var(--muted,#505C68)', fontSize: 12, marginTop: 2 }}>
                Editors invite reviewers individually — ticking this does not commit you to anything.
              </span>
            </span>
          </label>

          <Turnstile ref={captcha} action="register" onToken={setCaptchaToken} />

          <button
            type="submit"
            disabled={busy}
            style={{
              border: 0,
              background: busy ? 'var(--line-strong,#B9C1C9)' : 'var(--accent,#1D5DA8)',
              color: '#fff',
              borderRadius: 3,
              padding: 11,
              font: 'inherit',
              fontSize: 14,
              fontWeight: 500,
              cursor: busy ? 'default' : 'pointer',
            }}
          >
            {busy ? 'Creating your account…' : 'Create account'}
          </button>

          <p style={{ margin: 0, fontSize: 12, color: 'var(--muted,#505C68)', lineHeight: 1.5 }}>
            By creating an account you agree to the <Link href="/policies/privacy">privacy policy</Link>. Your details
            are held in the editorial system, which is where peer review takes place.
          </p>
        </form>
      </div>
    </div>
  )
}

const Err = ({ children }: { children: React.ReactNode }) => (
  <span style={{ fontSize: 12, color: '#A52A2A' }}>{children}</span>
)
