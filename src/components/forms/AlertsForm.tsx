'use client'

import { useState } from 'react'
import { editorialEmail } from '@/lib/site'

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/**
 * Email alert sign-up, moved from the author hub to /alerts/form. Starts from
 * the account's address, which the member can change; alerts are still
 * double opt-in, so the address is confirmed by email either way.
 */
export function AlertsForm({ initialEmail = '' }: { initialEmail?: string }) {
  const [email, setEmail] = useState(initialEmail)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const onAlert = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!EMAIL_RE.test(email)) {
      setErr('Enter an email address in the format name@example.org')
      return
    }
    if (busy) return
    setBusy(true)
    setErr(null)
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.status === 202) setDone(true)
      else if (res.status === 401) setErr('Your session has ended. Sign in again in another tab, then subscribe from here.')
      else if (res.status === 422) setErr('Enter an email address in the format name@example.org')
      else if (res.status === 429) setErr('rate')
      else setErr('down')
    } catch {
      setErr('down')
    } finally {
      setBusy(false)
    }
  }

  const emailInvalid = err !== null
  const emailBorder = emailInvalid ? '#A52A2A' : 'var(--line-strong,#B9C1C9)'

  if (done) {
    return (
      <div role="status" style={{ border: '1px solid #B9DCC4', background: '#E7F3EB', color: '#1E6B3A', borderRadius: 3, padding: '12px 14px', fontSize: 14 }}>
        Check your inbox: we sent a confirmation link to {email}. Alerts start once you confirm.
      </div>
    )
  }

  return (
    <form onSubmit={onAlert} noValidate className="m-col" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 240 }}>
        <label htmlFor="al-email" style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink,#101B27)' }}>Email address</label>
        <input id="al-email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr(null) }} aria-invalid={emailInvalid ? 'true' : 'false'} aria-describedby="al-err" style={{ font: 'inherit', fontSize: 14, padding: '9px 12px', border: `1px solid ${emailBorder}`, borderRadius: 3 }} />
        {err !== null ? (
          <span id="al-err" style={{ fontSize: 13, color: '#A52A2A' }}>
            {err === 'rate' ? (
              <>Too many sign-ups from this connection just now. Try again in a few minutes, or email <a href={`mailto:${editorialEmail}`} style={{ color: '#A52A2A', textDecoration: 'underline' }}>{editorialEmail}</a> and we will add you.</>
            ) : err === 'down' ? (
              <>The alerts service is temporarily unavailable. Email <a href={`mailto:${editorialEmail}`} style={{ color: '#A52A2A', textDecoration: 'underline' }}>{editorialEmail}</a> and we will set up your alerts.</>
            ) : (
              err
            )}
          </span>
        ) : null}
      </div>
      <button type="submit" disabled={busy} style={{ marginTop: 22, border: 0, background: 'var(--accent-dark,#0A685C)', color: '#fff', borderRadius: 3, padding: '10px 18px', font: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Subscribe</button>
    </form>
  )
}
