'use client'

/**
 * Propose a journal — verbatim replication of ProposeJournal.dc.html
 * (docs/REPLICATION.md), wired to POST /api/proposals. The subject select
 * offers the eight real subject labels, because the API validates against
 * them; the mockup's "Other / interdisciplinary" option would be rejected
 * server-side ("Interdisciplinary" is one of the eight).
 */

import Link from 'next/link'
import { useState } from 'react'

type Props = { subjects: string[]; editorialEmail: string }

type FieldKey = 'title' | 'subject' | 'scope' | 'why' | 'volume' | 'eic' | 'aff' | 'orcid' | 'name' | 'email' | 'agree'

/** Local field key → the API's field name (and back, for 422 mapping). */
const API_FIELD: Record<Exclude<FieldKey, 'agree'>, string> = {
  title: 'title',
  subject: 'subject',
  scope: 'scope',
  why: 'rationale',
  volume: 'expectedVolume',
  eic: 'eicName',
  aff: 'eicAffiliation',
  orcid: 'eicOrcid',
  name: 'proposerName',
  email: 'proposerEmail',
}

const LOCAL_FIELD: Record<string, FieldKey> = Object.fromEntries(
  Object.entries(API_FIELD).map(([local, api]) => [api, local as FieldKey]),
)
LOCAL_FIELD.agree = 'agree'

const REQUIRED: FieldKey[] = ['title', 'subject', 'scope', 'eic', 'name']

export function ProposeJournalPage({ subjects, editorialEmail }: Props) {
  const [f, setFState] = useState<Record<string, string>>({})
  const [agree, setAgree] = useState(false)
  const [tried, setTried] = useState(false)
  const [sent, setSent] = useState<{ reference: string } | null>(null)
  const [serverErrors, setServerErrors] = useState<Partial<Record<FieldKey, string>>>({})
  const [apiError, setApiError] = useState<{ kind: 'validation' | 'unavailable' | 'rate' | 'server'; text: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const val = (k: string) => f[k] ?? ''
  const setF = (k: FieldKey) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFState((s) => ({ ...s, [k]: e.target.value }))
    setServerErrors((s) => (s[k] ? { ...s, [k]: undefined } : s))
  }

  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val('email'))
  const missing = REQUIRED.filter((k) => !val(k).trim())
  const bad = (k: FieldKey) =>
    Boolean(serverErrors[k]) || (tried && (k === 'email' ? !emailOk : REQUIRED.includes(k) && !val(k).trim()))
  const B = (k: FieldKey) => (bad(k) ? '#A52A2A' : 'var(--line-strong,#B9C1C9)')

  const clientInvalid = missing.length > 0 || !emailOk || !agree
  const clientErrText = !tried
    ? ''
    : missing.length || !emailOk
      ? 'Please complete the required fields' + (!emailOk ? ' and enter a valid email address' : '') + '.'
      : !agree
        ? 'Please confirm the declaration before submitting.'
        : ''

  const hasErr = (tried && clientInvalid) || apiError !== null
  const errText = tried && clientInvalid ? clientErrText : (apiError?.text ?? '')

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (clientInvalid) {
      setTried(true)
      return
    }
    setSubmitting(true)
    setApiError(null)
    try {
      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: val('title').trim(),
          subject: val('subject'),
          scope: val('scope').trim(),
          rationale: val('why').trim(),
          expectedVolume: val('volume').trim(),
          eicName: val('eic').trim(),
          eicAffiliation: val('aff').trim(),
          eicOrcid: val('orcid').trim(),
          proposerName: val('name').trim(),
          proposerEmail: val('email').trim(),
          agree,
        }),
      })
      const data = (await res.json()) as {
        ok?: boolean
        reference?: string
        errors?: { field: string; message: string }[]
        message?: string
        retryAfter?: number
      }
      if (res.status === 201 && data.reference) {
        setSent({ reference: data.reference })
        window.scrollTo(0, 0)
        return
      }
      if (res.status === 422 && data.errors?.length) {
        const mapped: Partial<Record<FieldKey, string>> = {}
        data.errors.forEach((err) => {
          const local = LOCAL_FIELD[err.field]
          if (local) mapped[local] = err.message
        })
        setServerErrors(mapped)
        setApiError({ kind: 'validation', text: data.errors.map((err) => err.message).join(' ') })
        return
      }
      if (res.status === 429) {
        setApiError({ kind: 'rate', text: 'Too many proposals from this connection. Please wait a few minutes and try again.' })
        return
      }
      if (res.status === 503) {
        setApiError({
          kind: 'unavailable',
          text: data.message ?? 'This form is not accepting submissions yet.',
        })
        return
      }
      setApiError({ kind: 'server', text: 'Something went wrong while sending your proposal. Please try again.' })
    } catch {
      setApiError({ kind: 'server', text: 'Something went wrong while sending your proposal. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  const steps = [
    { n: 1, h: 'Acknowledgement', t: 'The Editorial Office confirms receipt within 5 working days.' },
    { n: 2, h: 'Scope and overlap review', t: 'Fit with the portfolio and distance from existing journals.' },
    { n: 3, h: 'Editorial assessment', t: 'The proposed Editor-in-Chief and board plan are evaluated.' },
    { n: 4, h: 'Decision', t: 'The publishing committee decides at the next quarterly review.' },
  ]

  return (
    <div>
      <style>{`body{margin:0;background:var(--page,#fff) !important;color:var(--ink-2,#1F2A36);font-family:var(--font-sans);-webkit-font-smoothing:antialiased}`}</style>
      <div
        style={{
          background: 'linear-gradient(135deg,var(--accent-tint,#F3F9F8) 25%,var(--accent-soft,#CDF0E7))',
          borderBottom: '1px solid var(--line,#DCE1E6)',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 32px 36px' }}>
          <nav aria-label="Breadcrumb" style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--muted,#505C68)' }}>
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/journals">Journals</Link>
            <span aria-hidden="true">/</span>
            <span style={{ color: 'var(--ink-2,#1F2A36)' }}>Propose a new journal</span>
          </nav>
          <h1
            style={{
              margin: '18px 0 10px',
              fontFamily: 'var(--font-serif)',
              fontSize: 40,
              fontWeight: 600,
              color: 'var(--ink,#101B27)',
              letterSpacing: '-.01em',
            }}
          >
            Propose a new journal
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 16,
              lineHeight: 1.6,
              color: 'var(--ink-3,#3C4854)',
              maxWidth: '70ch',
              textWrap: 'pretty',
            }}
          >
            NextGenIQ Press welcomes proposals for new open-access journals in digital, computational and interdisciplinary science.
            Proposals are reviewed quarterly by the Editorial Director and the publishing committee.
          </p>
        </div>
      </div>
      <main
        id="main-content"
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '40px 32px 80px',
          display: 'flex',
          gap: 56,
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: 320, maxWidth: 720 }}>
          {sent ? (
            <div
              role="status"
              style={{
                border: '1px solid #B9DCC4',
                background: '#E7F3EB',
                borderRadius: 3,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 600, color: '#1E6B3A' }}>Proposal received</span>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--ink-2,#1F2A36)' }}>
                Thank you. Your proposal has been assigned reference{' '}
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{sent.reference}</span>. The Editorial Office will
                acknowledge it within 5 working days and you will receive a decision after the next quarterly review.
              </p>
              <div style={{ display: 'flex', gap: 14, fontSize: 14, fontWeight: 500 }}>
                <Link href="/journals">Browse current journals</Link>
                <Link href="/">Back to home</Link>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
              <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h2
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-serif)',
                    fontSize: 22,
                    fontWeight: 600,
                    color: 'var(--ink,#101B27)',
                    borderBottom: '2px solid var(--accent,#0B7265)',
                    paddingBottom: 10,
                  }}
                >
                  1 · The journal
                </h2>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, fontWeight: 500, color: 'var(--ink,#101B27)' }}>
                  <span>
                    Proposed journal title <span style={{ color: 'var(--warm,#C2410C)' }}>*</span>
                  </span>
                  <input
                    value={val('title')}
                    onChange={setF('title')}
                    placeholder="e.g. International Journal of Climate Informatics"
                    style={{
                      border: `1px solid ${B('title')}`,
                      borderRadius: 3,
                      padding: '10px 12px',
                      font: 'inherit',
                      fontSize: 14,
                      background: 'var(--surface,#fff)',
                      color: 'var(--ink,#101B27)',
                    }}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, fontWeight: 500, color: 'var(--ink,#101B27)' }}>
                  <span>
                    Subject area <span style={{ color: 'var(--warm,#C2410C)' }}>*</span>
                  </span>
                  <select
                    value={val('subject')}
                    onChange={setF('subject')}
                    style={{
                      border: `1px solid ${B('subject')}`,
                      borderRadius: 3,
                      padding: '10px 12px',
                      font: 'inherit',
                      fontSize: 14,
                      background: 'var(--surface,#fff)',
                      color: 'var(--ink,#101B27)',
                    }}
                  >
                    <option value="">Select a subject area</option>
                    {subjects.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, fontWeight: 500, color: 'var(--ink,#101B27)' }}>
                  <span>
                    Aims and scope (max 300 words) <span style={{ color: 'var(--warm,#C2410C)' }}>*</span>
                  </span>
                  <textarea
                    value={val('scope')}
                    onChange={setF('scope')}
                    rows={6}
                    placeholder="What will the journal publish, and for whom?"
                    style={{
                      border: `1px solid ${B('scope')}`,
                      borderRadius: 3,
                      padding: '10px 12px',
                      font: 'inherit',
                      fontSize: 14,
                      background: 'var(--surface,#fff)',
                      color: 'var(--ink,#101B27)',
                      resize: 'vertical',
                    }}
                  ></textarea>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, fontWeight: 500, color: 'var(--ink,#101B27)' }}>
                  <span>Rationale — the gap this journal fills</span>
                  <textarea
                    value={val('why')}
                    onChange={setF('why')}
                    rows={4}
                    placeholder="Why is a new journal needed? Which existing journals are closest, and how does this differ?"
                    style={{
                      border: '1px solid var(--line-strong,#B9C1C9)',
                      borderRadius: 3,
                      padding: '10px 12px',
                      font: 'inherit',
                      fontSize: 14,
                      background: 'var(--surface,#fff)',
                      color: 'var(--ink,#101B27)',
                      resize: 'vertical',
                    }}
                  ></textarea>
                </label>
                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 5,
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--ink,#101B27)',
                    maxWidth: 280,
                  }}
                >
                  <span>Expected submissions in year one</span>
                  <input
                    type="number"
                    min={0}
                    value={val('volume')}
                    onChange={setF('volume')}
                    placeholder="e.g. 80"
                    style={{
                      border: '1px solid var(--line-strong,#B9C1C9)',
                      borderRadius: 3,
                      padding: '10px 12px',
                      font: 'inherit',
                      fontSize: 14,
                      background: 'var(--surface,#fff)',
                      color: 'var(--ink,#101B27)',
                    }}
                  />
                </label>
              </section>
              <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h2
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-serif)',
                    fontSize: 22,
                    fontWeight: 600,
                    color: 'var(--ink,#101B27)',
                    borderBottom: '2px solid var(--accent,#0B7265)',
                    paddingBottom: 10,
                  }}
                >
                  2 · Proposed Editor-in-Chief
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16 }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, fontWeight: 500, color: 'var(--ink,#101B27)' }}>
                    <span>
                      Full name and title <span style={{ color: 'var(--warm,#C2410C)' }}>*</span>
                    </span>
                    <input
                      value={val('eic')}
                      onChange={setF('eic')}
                      placeholder="Prof. …"
                      style={{
                        border: `1px solid ${B('eic')}`,
                        borderRadius: 3,
                        padding: '10px 12px',
                        font: 'inherit',
                        fontSize: 14,
                        background: 'var(--surface,#fff)',
                        color: 'var(--ink,#101B27)',
                      }}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, fontWeight: 500, color: 'var(--ink,#101B27)' }}>
                    <span>Affiliation</span>
                    <input
                      value={val('aff')}
                      onChange={setF('aff')}
                      placeholder="Institution, country"
                      style={{
                        border: '1px solid var(--line-strong,#B9C1C9)',
                        borderRadius: 3,
                        padding: '10px 12px',
                        font: 'inherit',
                        fontSize: 14,
                        background: 'var(--surface,#fff)',
                        color: 'var(--ink,#101B27)',
                      }}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, fontWeight: 500, color: 'var(--ink,#101B27)' }}>
                    <span>ORCID iD</span>
                    <input
                      value={val('orcid')}
                      onChange={setF('orcid')}
                      placeholder="0000-0000-0000-0000"
                      style={{
                        border: `1px solid ${serverErrors.orcid ? '#A52A2A' : 'var(--line-strong,#B9C1C9)'}`,
                        borderRadius: 3,
                        padding: '10px 12px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 13,
                        background: 'var(--surface,#fff)',
                        color: 'var(--ink,#101B27)',
                      }}
                    />
                  </label>
                </div>
              </section>
              <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h2
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-serif)',
                    fontSize: 22,
                    fontWeight: 600,
                    color: 'var(--ink,#101B27)',
                    borderBottom: '2px solid var(--accent,#0B7265)',
                    paddingBottom: 10,
                  }}
                >
                  3 · Your details
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16 }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, fontWeight: 500, color: 'var(--ink,#101B27)' }}>
                    <span>
                      Your name <span style={{ color: 'var(--warm,#C2410C)' }}>*</span>
                    </span>
                    <input
                      value={val('name')}
                      onChange={setF('name')}
                      style={{
                        border: `1px solid ${B('name')}`,
                        borderRadius: 3,
                        padding: '10px 12px',
                        font: 'inherit',
                        fontSize: 14,
                        background: 'var(--surface,#fff)',
                        color: 'var(--ink,#101B27)',
                      }}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, fontWeight: 500, color: 'var(--ink,#101B27)' }}>
                    <span>
                      Email address <span style={{ color: 'var(--warm,#C2410C)' }}>*</span>
                    </span>
                    <input
                      type="email"
                      value={val('email')}
                      onChange={setF('email')}
                      placeholder="name@institution.edu"
                      style={{
                        border: `1px solid ${B('email')}`,
                        borderRadius: 3,
                        padding: '10px 12px',
                        font: 'inherit',
                        fontSize: 14,
                        background: 'var(--surface,#fff)',
                        color: 'var(--ink,#101B27)',
                      }}
                    />
                  </label>
                </div>
                <label
                  style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, lineHeight: 1.5, color: 'var(--ink-2,#1F2A36)', cursor: 'pointer' }}
                >
                  <input
                    type="checkbox"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                    style={{ marginTop: 3 }}
                  />
                  <span>
                    I confirm the proposed Editor-in-Chief is aware of this proposal, and that the journal would operate under
                    NextGenIQ Press <Link href="/journals/ijdh/publication-ethics">publication ethics</Link> and open-access policies.
                  </span>
                </label>
              </section>
              {hasErr && errText ? (
                <div
                  role="alert"
                  style={{
                    border: '1px solid #E3B3B3',
                    background: '#FBEAEA',
                    borderRadius: 3,
                    padding: '12px 16px',
                    fontSize: 14,
                    color: '#5C1414',
                  }}
                >
                  {errText}
                  {apiError?.kind === 'unavailable' ? (
                    <>
                      {' '}
                      Please email your proposal to <a href={`mailto:${editorialEmail}`}>{editorialEmail}</a>.
                    </>
                  ) : null}
                </div>
              ) : null}
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    border: 0,
                    background: 'var(--warm,#C2410C)',
                    color: '#fff',
                    borderRadius: 3,
                    padding: '11px 22px',
                    font: 'inherit',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Submit proposal
                </button>
                <span style={{ fontSize: 13, color: 'var(--muted,#505C68)' }}>
                  Fields marked <span style={{ color: 'var(--warm,#C2410C)' }}>*</span> are required.
                </span>
              </div>
            </form>
          )}
        </div>
        <aside style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 13,
                letterSpacing: '.08em',
                textTransform: 'uppercase',
                color: 'var(--ink,#101B27)',
                paddingBottom: 10,
                borderBottom: '2px solid var(--accent,#0B7265)',
              }}
            >
              How proposals are assessed
            </h2>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {steps.map((s) => (
                <li
                  key={s.n}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '26px minmax(0,1fr)',
                    gap: 10,
                    padding: '12px 0',
                    borderBottom: '1px solid var(--line,#DCE1E6)',
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      border: '1.5px solid var(--accent-dark,#095D53)',
                      color: 'var(--accent-dark,#095D53)',
                      fontSize: 11,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {s.n}
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink,#101B27)' }}>{s.h}</span>
                    <span style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--ink-3,#3C4854)' }}>{s.t}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div
            style={{
              border: '1px solid var(--line,#DCE1E6)',
              borderTop: '3px solid var(--warm,#C2410C)',
              borderRadius: 3,
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink,#101B27)' }}>What a strong proposal includes</span>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.7, color: 'var(--ink-3,#3C4854)' }}>
              <li>A scope that does not substantially overlap an existing NGIQ journal</li>
              <li>A credible Editor-in-Chief with editorial experience</li>
              <li>Evidence of community demand (conferences, preprints, mailing lists)</li>
              <li>Named candidates for the founding editorial board</li>
            </ul>
            <span style={{ fontSize: 13, color: 'var(--ink-3,#3C4854)' }}>
              Questions? <a href={`mailto:${editorialEmail}`}>{editorialEmail}</a>
            </span>
          </div>
        </aside>
      </main>
    </div>
  )
}
