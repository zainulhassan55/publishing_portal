'use client'

/**
 * Journal proposals, reviewed and decided.
 *
 * The proposals have been arriving since migration 001 and nothing has ever
 * read the table. This is the screen that closes that loop.
 *
 * Two deliberate choices in the interaction:
 *
 *   - Declining requires a reason, enforced server-side as well. The proposer
 *     will ask why, and "the record does not say" is not an answer a publisher
 *     should have to give.
 *   - Accepting does **not** create the journal in OJS. Setting up a context
 *     means a slug, sections, an editorial team and a masthead — a conversation,
 *     not a database write. Accepting records the decision; the setup happens in
 *     OJS, which this screen links to.
 */

import { useCallback, useEffect, useState } from 'react'
import { CSRF_HEADER } from '@/lib/auth/csrf'
import { ojsHandoffUrl } from '@/lib/ojs/config'

type Proposal = {
  id: number
  title: string
  subject: string
  scope: string
  rationale: string | null
  expectedVolume: string | null
  eicName: string | null
  eicAffiliation: string | null
  eicOrcid: string | null
  proposerName: string
  proposerEmail: string
  status: string
  decidedAtIso: string | null
  decisionNote: string | null
  createdAtIso: string
}

const STATUS_LABEL: Record<string, string> = {
  received: 'Received',
  under_review: 'Under review',
  accepted: 'Accepted',
  declined: 'Declined',
}

const STATUS_COLOUR: Record<string, { bg: string; fg: string }> = {
  received: { bg: '#FFF4E0', fg: '#8A5A00' },
  under_review: { bg: '#E8F0FA', fg: '#174C8A' },
  accepted: { bg: '#E6F6EC', fg: '#1C6B3C' },
  declined: { bg: '#FBEAEA', fg: '#A52A2A' },
}

const isOpen = (status: string) => status === 'received' || status === 'under_review'

type LoadResult = { proposals: Proposal[]; error: null } | { proposals: null; error: string }

/** Pure fetch: returns the outcome, sets no state. See the note at `apply`. */
async function fetchProposals(): Promise<LoadResult> {
  try {
    const response = await fetch('/api/admin/proposals', { cache: 'no-store' })
    const data = (await response.json()) as { ok?: boolean; proposals?: Proposal[]; message?: string }
    if (!response.ok || !data.ok) {
      return { proposals: null, error: data.message ?? 'Could not load proposals.' }
    }
    return { proposals: data.proposals ?? [], error: null }
  } catch {
    return { proposals: null, error: 'Could not load proposals. Check your connection and try again.' }
  }
}

const card: React.CSSProperties = {
  background: 'var(--surface,#fff)',
  border: '1px solid var(--line,#DCE1E6)',
  borderRadius: 4,
  padding: '18px 20px',
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export function AdminProposals({ csrfToken }: { csrfToken: string }) {
  const [proposals, setProposals] = useState<Proposal[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState<number | null>(null)
  const [notes, setNotes] = useState<Record<number, string>>({})
  const [busy, setBusy] = useState<number | null>(null)

  // Fetching is separated from state-setting on purpose: `fetchProposals` is a
  // plain function that touches no state, so the effect below sets state only
  // after an await. Calling a state-setting helper straight from an effect body
  // causes the cascading render `react-hooks/set-state-in-effect` rejects.
  const apply = useCallback((result: LoadResult) => {
    if (result.error !== null) {
      setError(result.error)
      return
    }
    setError(null)
    setProposals(result.proposals)
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const result = await fetchProposals()
      if (!cancelled) apply(result)
    })()
    return () => {
      cancelled = true
    }
  }, [apply])

  const decide = async (id: number, status: string) => {
    const note = (notes[id] ?? '').trim()

    // Mirrors the server rule rather than replacing it — the server refuses this
    // too. Checking here saves a round trip and puts the message next to the box.
    if (status === 'declined' && !note) {
      setError('Give a reason when declining — the proposer will be told it.')
      return
    }

    setBusy(id)
    setError(null)

    try {
      const response = await fetch(`/api/admin/proposals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', [CSRF_HEADER]: csrfToken },
        body: JSON.stringify({ status, note }),
      })
      const data = (await response.json()) as {
        ok?: boolean
        message?: string
        errors?: { field: string; message: string }[]
      }

      if (!response.ok || !data.ok) {
        setError(data.errors?.[0]?.message ?? data.message ?? 'Could not record that decision.')
        return
      }

      // Reload rather than patching local state: the decision stamps
      // `decided_at` and `decided_by` server-side, and showing a row the server
      // has not confirmed is how an admin screen starts lying.
      apply(await fetchProposals())
    } catch {
      setError('Could not record that decision. Check your connection and try again.')
    } finally {
      setBusy(null)
    }
  }

  if (proposals === null) {
    return <p style={{ fontSize: 14, color: 'var(--muted,#505C68)' }}>{error ?? 'Loading proposals…'}</p>
  }

  const queue = proposals.filter((p) => isOpen(p.status))
  const settled = proposals.filter((p) => !isOpen(p.status))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 900 }}>
      {error ? (
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
          }}
        >
          {error}
        </p>
      ) : null}

      <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 17, color: 'var(--ink,#101B27)' }}>
          Awaiting a decision ({queue.length})
        </h2>

        {queue.length === 0 ? (
          <p style={{ ...card, margin: 0, fontSize: 14, color: 'var(--muted,#505C68)' }}>
            Nothing waiting. Proposals arrive through the public{' '}
            <a href="/propose-journal">propose a journal</a> form.
          </p>
        ) : null}

        {queue.map((p) => (
          <article key={p.id} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, color: 'var(--ink,#101B27)' }}>{p.title}</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted,#505C68)' }}>
                  {p.subject} · proposed by {p.proposerName} (
                  <a href={`mailto:${p.proposerEmail}`}>{p.proposerEmail}</a>) · {formatDate(p.createdAtIso)}
                </p>
              </div>
              <Badge status={p.status} />
            </div>

            <button
              type="button"
              onClick={() => setOpen(open === p.id ? null : p.id)}
              aria-expanded={open === p.id}
              style={{
                marginTop: 10,
                border: 0,
                background: 'none',
                padding: 0,
                font: 'inherit',
                fontSize: 13,
                color: 'var(--accent,#1D5DA8)',
                cursor: 'pointer',
              }}
            >
              {open === p.id ? 'Hide the full proposal' : 'Read the full proposal'}
            </button>

            {open === p.id ? (
              <dl style={{ margin: '12px 0 0', fontSize: 13, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)' }}>
                <Field label="Scope" value={p.scope} />
                <Field label="Why it is needed" value={p.rationale} />
                <Field label="Expected annual volume" value={p.expectedVolume} />
                <Field
                  label="Proposed Editor-in-Chief"
                  value={[p.eicName, p.eicAffiliation, p.eicOrcid].filter(Boolean).join(' · ')}
                />
              </dl>
            ) : null}

            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 13, color: 'var(--ink-2,#1F2A36)', display: 'flex', flexDirection: 'column', gap: 5 }}>
                Decision note{' '}
                <span style={{ fontSize: 12, color: 'var(--muted,#505C68)' }}>
                  Required when declining. Recorded in the audit log.
                </span>
                <textarea
                  value={notes[p.id] ?? ''}
                  onChange={(e) => setNotes((n) => ({ ...n, [p.id]: e.target.value }))}
                  rows={3}
                  style={{
                    border: '1px solid var(--line-strong,#B9C1C9)',
                    borderRadius: 3,
                    padding: '8px 10px',
                    font: 'inherit',
                    fontSize: 13,
                    resize: 'vertical',
                  }}
                />
              </label>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {p.status === 'received' ? (
                  <Action onClick={() => decide(p.id, 'under_review')} disabled={busy === p.id}>
                    Mark under review
                  </Action>
                ) : null}
                <Action onClick={() => decide(p.id, 'accepted')} disabled={busy === p.id} primary>
                  Accept
                </Action>
                <Action onClick={() => decide(p.id, 'declined')} disabled={busy === p.id} danger>
                  Decline
                </Action>
              </div>

              <p style={{ margin: 0, fontSize: 12, color: 'var(--muted,#505C68)', lineHeight: 1.5 }}>
                Accepting records the decision. The journal itself is created in the editorial system —{' '}
                <a href={ojsHandoffUrl('/index.php/index/admin/contexts')}>open journal settings in OJS</a>. The
                proposer is <strong>not</strong> emailed yet; site mail is not configured.
              </p>
            </div>
          </article>
        ))}
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 17, color: 'var(--ink,#101B27)' }}>Decided ({settled.length})</h2>

        {settled.length === 0 ? (
          <p style={{ ...card, margin: 0, fontSize: 14, color: 'var(--muted,#505C68)' }}>No decisions recorded yet.</p>
        ) : null}

        {settled.map((p) => (
          <article key={p.id} style={{ ...card, padding: '14px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <strong style={{ fontSize: 14, color: 'var(--ink,#101B27)' }}>{p.title}</strong>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--muted,#505C68)' }}>
                  {p.subject} · {p.proposerName}
                  {p.decidedAtIso ? ` · decided ${formatDate(p.decidedAtIso)}` : ''}
                </p>
                {p.decisionNote ? (
                  <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--ink-3,#3C4854)', lineHeight: 1.5 }}>
                    {p.decisionNote}
                  </p>
                ) : null}
              </div>
              <Badge status={p.status} />
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}

const Badge = ({ status }: { status: string }) => {
  const colour = STATUS_COLOUR[status] ?? { bg: '#EEF2F5', fg: '#505C68' }
  return (
    <span
      style={{
        alignSelf: 'flex-start',
        background: colour.bg,
        color: colour.fg,
        borderRadius: 3,
        padding: '3px 9px',
        fontSize: 12,
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

const Field = ({ label, value }: { label: string; value: string | null | undefined }) =>
  value ? (
    <>
      <dt style={{ fontWeight: 600, color: 'var(--ink-2,#1F2A36)', marginTop: 8 }}>{label}</dt>
      <dd style={{ margin: '2px 0 0', whiteSpace: 'pre-wrap' }}>{value}</dd>
    </>
  ) : null

const Action = ({
  children,
  onClick,
  disabled,
  primary,
  danger,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  primary?: boolean
  danger?: boolean
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    style={{
      border: `1px solid ${danger ? '#E3B3B3' : primary ? 'var(--accent,#1D5DA8)' : 'var(--line-strong,#B9C1C9)'}`,
      background: primary ? 'var(--accent,#1D5DA8)' : 'var(--surface,#fff)',
      color: primary ? '#fff' : danger ? '#A52A2A' : 'var(--ink,#101B27)',
      borderRadius: 3,
      padding: '8px 14px',
      font: 'inherit',
      fontSize: 13,
      fontWeight: 500,
      cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.6 : 1,
    }}
  >
    {children}
  </button>
)
