'use client'

/**
 * The letter that goes with a decision.
 *
 * Opens when an editor clicks Accept, Decline or Request revisions. The draft
 * comes from src/lib/admin/decision-email.ts and is fully editable; what the
 * editor sees here is exactly what is sent. "Save without emailing" records the
 * decision alone, for when the submitter has been told some other way.
 *
 * One request does both: the server saves the decision first and then sends,
 * so a mail failure leaves the decision recorded and this panel open to retry.
 */

import { useState } from 'react'
import { CSRF_HEADER } from '@/lib/auth/csrf'
import { decisionDraft, hasPlaceholder, type DecisionKind } from '@/lib/admin/decision-email'

export type ComposerTarget = {
  kind: DecisionKind
  reference: string
  name: string
  email: string
  title: string
  targetTitle?: string
  role?: string
}

const STATUS_VERB: Record<string, string> = {
  accepted: 'Accept',
  declined: 'Decline',
  revisions: 'Request revisions',
}

const input: React.CSSProperties = {
  border: '1px solid var(--line-strong,#B9C1C9)',
  borderRadius: 3,
  padding: '8px 10px',
  font: 'inherit',
  fontSize: 14,
  background: 'var(--surface,#fff)',
  color: 'var(--ink,#101B27)',
}

/** Notifies the admin nav that a queue count has changed. */
export const announcePendingChange = () => window.dispatchEvent(new Event('admin:pending-changed'))

export function DecisionComposer({
  target,
  status,
  note,
  endpoint,
  csrfToken,
  onDone,
  onCancel,
}: {
  target: ComposerTarget
  status: string
  note: string
  endpoint: string
  csrfToken: string
  onDone: (outcome: { emailed: boolean }) => void
  onCancel: () => void
}) {
  const draft = () => decisionDraft({ ...target, status, note }) ?? { subject: '', body: '' }
  const [subject, setSubject] = useState(() => draft().subject)
  const [body, setBody] = useState(() => draft().body)
  const [busy, setBusy] = useState<'send' | 'save' | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Set once the decision is saved but the email failed: retrying only resends.
  const [saved, setSaved] = useState(false)

  const submit = async (withEmail: boolean) => {
    if (withEmail && hasPlaceholder(body)) {
      setError('Replace or delete the “[Add any details here…]” line before sending.')
      return
    }
    setBusy(withEmail ? 'send' : 'save')
    setError(null)
    try {
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', [CSRF_HEADER]: csrfToken },
        body: JSON.stringify({ status, note, email: withEmail ? { subject, body } : null }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        emailed?: boolean
        emailError?: string
        errors?: { message: string }[]
        message?: string
      }
      if (!res.ok) {
        setError(data.errors?.[0]?.message ?? data.message ?? 'Could not save the decision.')
        return
      }
      announcePendingChange()
      if (withEmail && !data.emailed) {
        setSaved(true)
        setError(
          data.emailError === 'smtp-not-configured'
            ? 'The decision is saved, but site email is not configured on the server, so nothing was sent.'
            : `The decision is saved, but the email could not be sent${data.emailError ? ` (${data.emailError})` : ''}. Try again, or close and email them directly.`,
        )
        return
      }
      onDone({ emailed: withEmail })
    } catch {
      setError('Could not reach the server. Check your connection and try again.')
    } finally {
      setBusy(null)
    }
  }

  const reset = () => {
    const d = draft()
    setSubject(d.subject)
    setBody(d.body)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        border: '1px solid var(--line,#DCE1E6)',
        borderRadius: 4,
        padding: 14,
        background: 'var(--surface,#fff)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'baseline' }}>
        <strong style={{ fontSize: 14, color: 'var(--ink,#101B27)' }}>
          {STATUS_VERB[status] ?? 'Decide'}: email to {target.name}
        </strong>
        <button type="button" onClick={reset} style={{ border: 0, background: 'none', padding: 0, font: 'inherit', fontSize: 12, color: 'var(--accent,#1D5DA8)', cursor: 'pointer' }}>
          Reset to the standard wording
        </button>
      </div>

      <div style={{ fontSize: 13, color: 'var(--muted,#505C68)' }}>
        To: <span style={{ color: 'var(--ink,#101B27)' }}>{target.email}</span> · Replies go to the editorial inbox
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
        Subject
        <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} style={input} />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
        Message
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={14} style={{ ...input, resize: 'vertical', lineHeight: 1.5 }} />
      </label>

      {error ? (
        <p role="alert" style={{ margin: 0, fontSize: 13, color: '#A52A2A' }}>
          {error}
        </p>
      ) : null}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button
          type="button"
          onClick={() => submit(true)}
          disabled={busy !== null}
          style={{ border: '1px solid var(--accent,#1D5DA8)', background: 'var(--accent,#1D5DA8)', color: '#fff', borderRadius: 3, padding: '8px 14px', font: 'inherit', fontSize: 13, fontWeight: 500, cursor: 'pointer', opacity: busy ? 0.6 : 1 }}
        >
          {busy === 'send' ? 'Sending…' : saved ? 'Try sending again' : `${STATUS_VERB[status] ?? 'Save'} and send email`}
        </button>
        {saved ? (
          <button type="button" onClick={() => onDone({ emailed: false })} style={secondary}>
            Close
          </button>
        ) : (
          <>
            <button type="button" onClick={() => submit(false)} disabled={busy !== null} style={{ ...secondary, opacity: busy ? 0.6 : 1 }}>
              {busy === 'save' ? 'Saving…' : `${STATUS_VERB[status] ?? 'Save'} without emailing`}
            </button>
            <button type="button" onClick={onCancel} disabled={busy !== null} style={{ ...secondary, border: 0 }}>
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  )
}

const secondary: React.CSSProperties = {
  border: '1px solid var(--line-strong,#B9C1C9)',
  background: 'var(--surface,#fff)',
  color: 'var(--ink,#101B27)',
  borderRadius: 3,
  padding: '8px 14px',
  font: 'inherit',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
}
