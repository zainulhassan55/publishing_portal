'use client'

import { useEffect, useRef, useState } from 'react'
import { isEmail } from '@/lib/validate'
import { editorialEmail } from '@/lib/site'

type FieldErrors = Record<string, string>

const TOPICS = [
  'Submission enquiry',
  'Manuscript status',
  'Peer review',
  'Special issue proposal',
  'Editorial board application',
  'Indexing or metadata',
  'Technical problem',
  'Other',
]

/** Mockup control styling: 1px border, radius 3, 14px text, inherited font. */
const control = (invalid?: boolean): React.CSSProperties => ({
  font: 'inherit',
  fontSize: 14,
  padding: '9px 12px',
  border: `1px solid ${invalid ? '#A52A2A' : 'var(--line-strong,#B9C1C9)'}`,
  borderRadius: 3,
  background: 'var(--surface,#fff)',
  boxSizing: 'border-box',
  width: '100%',
})

const labelStyle: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: 'var(--ink,#101B27)' }
const hintStyle: React.CSSProperties = { fontSize: 12, color: 'var(--muted,#505C68)' }
const errorStyle: React.CSSProperties = { fontSize: 13, color: '#A52A2A' }
const fieldStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 }

/**
 * Audit finding F-18: this form's submit control used to be `href="#"` with no
 * backend, so business correspondence was silently discarded. Every failure
 * path here therefore ends somewhere the sender can actually reach a human —
 * never a dead end, and never a success message for a request that failed.
 */
export function ContactForm({ journals }: { journals: { slug: string; label: string }[] }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [journalSlug, setJournalSlug] = useState('none')
  const [topic, setTopic] = useState(TOPICS[0])
  const [message, setMessage] = useState('')

  const [errors, setErrors] = useState<FieldErrors>({})
  const [summary, setSummary] = useState<{ field: string; message: string }[]>([])
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState<{ reference: string; relayed: boolean } | null>(null)
  const [failure, setFailure] = useState<string | null>(null)

  // The summary is focused on appearance so the error set is announced without
  // moving focus into the form — same behaviour as the old ErrorSummary.
  const summaryRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (summary.length > 0) summaryRef.current?.focus()
  }, [summary])

  const validate = (): FieldErrors => {
    const next: FieldErrors = {}
    if (!name.trim()) next.name = 'Enter your name'
    if (!email.trim()) next.email = 'Enter your email address'
    else if (!isEmail(email)) next.email = 'Enter a valid email address'
    if (message.trim().length < 20) next.message = 'Please give us at least a sentence or two (20 characters)'
    return next
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setFailure(null)

    const found = validate()
    setErrors(found)
    setSummary(Object.entries(found).map(([field, msg]) => ({ field, message: msg })))
    if (Object.keys(found).length > 0) return

    setBusy(true)
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, journalSlug, topic, message }),
      })
      const data = (await response.json()) as {
        ok?: boolean
        reference?: string
        relayed?: boolean
        error?: string
        errors?: { field: string; message: string }[]
        retryAfter?: number
      }

      if (response.status === 422 && data.errors) {
        setErrors(Object.fromEntries(data.errors.map((e) => [e.field, e.message])))
        setSummary(data.errors)
        return
      }

      if (response.status === 429) {
        setFailure(`Too many messages from this connection. Try again in ${data.retryAfter ?? 60} seconds.`)
        return
      }

      if (response.status === 503) {
        setFailure(
          `The contact form is not accepting messages yet. Please email ${editorialEmail} directly — your message has not been sent.`,
        )
        return
      }

      if (!response.ok || !data.reference) {
        setFailure(`We could not send that. Please email ${editorialEmail} directly — your message has not been sent.`)
        return
      }

      setSent({ reference: data.reference, relayed: Boolean(data.relayed) })
    } catch {
      setFailure(`We could not reach the server. Please email ${editorialEmail} directly.`)
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <div
        role="status"
        style={{ border: '1px solid #B9DCC4', background: '#E7F3EB', borderRadius: 3, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 600, color: '#1E6B3A' }}>Message received</h2>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--ink-2,#1F2A36)' }}>
          Your reference is{' '}
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{sent.reference}</span>. We reply within two working
          days — quote that reference if you follow up.
        </p>
        {!sent.relayed ? (
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)' }}>
            Your message is recorded and an editor will see it. Our mail relay did not confirm delivery of the
            notification copy, so if the matter is urgent, also email{' '}
            <a href={`mailto:${editorialEmail}`} style={{ fontWeight: 500 }}>{editorialEmail}</a>.
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {summary.length > 0 ? (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          style={{ border: '1px solid #E3B3B3', background: '#FBEAEA', borderRadius: 3, padding: '12px 16px', fontSize: 14, color: '#5C1414', lineHeight: 1.5, outline: 'none' }}
        >
          <strong>Fix the following before continuing.</strong>
          <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
            {summary.map((error) => (
              <li key={error.field}>
                <a href={`#${error.field}`} style={{ color: '#5C1414', textDecoration: 'underline' }}>
                  {error.message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {failure ? (
        <div role="alert" style={{ border: '1px solid #E3B3B3', background: '#FBEAEA', borderRadius: 3, padding: '12px 16px', fontSize: 14, lineHeight: 1.5, color: '#5C1414' }}>
          {failure}
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,240px),1fr))', gap: 22 }}>
        <div style={fieldStyle}>
          <label htmlFor="name" style={labelStyle}>
            Your name <span style={{ color: '#A52A2A' }}>*</span>
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            aria-invalid={errors.name ? 'true' : 'false'}
            aria-describedby={errors.name ? 'name-error' : undefined}
            style={control(Boolean(errors.name))}
          />
          {errors.name ? (
            <span id="name-error" role="alert" style={errorStyle}>
              {errors.name}
            </span>
          ) : null}
        </div>

        <div style={fieldStyle}>
          <label htmlFor="email" style={labelStyle}>
            Email address <span style={{ color: '#A52A2A' }}>*</span>
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'email-error' : undefined}
            style={control(Boolean(errors.email))}
          />
          {errors.email ? (
            <span id="email-error" role="alert" style={errorStyle}>
              {errors.email}
            </span>
          ) : null}
        </div>

        <div style={fieldStyle}>
          <label htmlFor="topic" style={labelStyle}>
            Topic <span style={{ color: '#A52A2A' }}>*</span>
          </label>
          <select id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} style={control()}>
            {TOPICS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div style={fieldStyle}>
          <label htmlFor="journalSlug" style={labelStyle}>
            Journal
          </label>
          <select
            id="journalSlug"
            value={journalSlug}
            onChange={(e) => setJournalSlug(e.target.value)}
            aria-describedby="journalSlug-hint"
            style={control()}
          >
            <option value="none">Not journal-specific</option>
            {journals.map((journal) => (
              <option key={journal.slug} value={journal.slug}>
                {journal.label}
              </option>
            ))}
          </select>
          <span id="journalSlug-hint" style={hintStyle}>
            Leave as “Not journal-specific” for general enquiries
          </span>
        </div>
      </div>

      <div style={fieldStyle}>
        <label htmlFor="message" style={labelStyle}>
          Message <span style={{ color: '#A52A2A' }}>*</span>
        </label>
        <textarea
          id="message"
          rows={7}
          maxLength={5000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          aria-invalid={errors.message ? 'true' : 'false'}
          aria-describedby={errors.message ? 'message-error message-hint' : 'message-hint'}
          style={{ ...control(Boolean(errors.message)), resize: 'vertical', lineHeight: 1.55 }}
        ></textarea>
        {errors.message ? (
          <span id="message-error" role="alert" style={errorStyle}>
            {errors.message}
          </span>
        ) : null}
        <span id="message-hint" style={hintStyle}>
          Include your submission reference if your query is about a manuscript in progress.
        </span>
      </div>

      <div>
        <button
          type="submit"
          disabled={busy}
          style={{ border: 0, background: 'var(--accent-dark,#0A685C)', color: '#fff', borderRadius: 3, padding: '11px 20px', font: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
        >
          {busy ? 'Sending…' : 'Send message'}
        </button>
      </div>
    </form>
  )
}
