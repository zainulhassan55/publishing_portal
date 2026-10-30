'use client'

import { useCallback, useEffect, useState } from 'react'
import { CSRF_HEADER } from '@/lib/auth/csrf'
import { emailsOnDecision } from '@/lib/admin/decision-email'
import { DecisionComposer, announcePendingChange } from './DecisionComposer'
import type { FormKind, FormRecord } from '@/lib/forms/admin'
import { STATUS_LABELS } from '@/lib/forms/options'
import { formatBytes } from '@/lib/uploads/policy'

const TABS: { kind: FormKind; label: string }[] = [
  { kind: 'application', label: 'Reviewer and board' },
  { kind: 'special_issue', label: 'Special issues' },
  { kind: 'book_volume', label: 'Book volumes' },
  { kind: 'book_submission', label: 'Book chapters' },
]

const cell = { padding: '10px 12px 10px 0', borderBottom: '1px solid var(--line,#DCE1E6)', verticalAlign: 'top' as const, fontSize: 14 }

/** Turns a payload key such as `submitterEmail` into "Submitter email". */
const labelOf = (key: string) => key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).toLowerCase().replace(/^./, (c) => c.toUpperCase())

function PayloadView({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === '') return <span style={{ color: 'var(--muted,#505C68)' }}>—</span>
  if (Array.isArray(value)) {
    return (
      <ol style={{ margin: 0, paddingLeft: 18 }}>
        {value.map((v, i) => (
          <li key={i} style={{ marginBottom: 6 }}>
            <PayloadView value={v} />
          </li>
        ))}
      </ol>
    )
  }
  if (typeof value === 'object') {
    return (
      <dl className="m-1col" style={{ margin: 0, display: 'grid', gridTemplateColumns: 'minmax(120px,max-content) minmax(0,1fr)', gap: '4px 14px' }}>
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          <div key={k} style={{ display: 'contents' }}>
            <dt style={{ color: 'var(--muted,#505C68)', fontSize: 13 }}>{labelOf(k)}</dt>
            <dd style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
              <PayloadView value={v} />
            </dd>
          </div>
        ))}
      </dl>
    )
  }
  return <>{String(value)}</>
}

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

const isOpen = (status: string) => status === 'received' || status === 'under_review' || status === 'revisions'

/**
 * Decision buttons and the note. Accept, Decline and Request revisions open
 * the letter composer; Mark under review is bookkeeping and saves directly.
 */
function Decision({ record, csrfToken, onSaved }: { record: FormRecord; csrfToken: string; onSaved: () => void }) {
  const [note, setNote] = useState(record.decisionNote ?? '')
  const [composing, setComposing] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const endpoint = `/api/admin/forms/${record.kind}/${record.id}`

  const markUnderReview = async () => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', [CSRF_HEADER]: csrfToken },
        body: JSON.stringify({ status: 'under_review', note }),
      })
      const data = (await res.json().catch(() => ({}))) as { errors?: { message: string }[]; message?: string }
      if (!res.ok) setError(data.errors?.[0]?.message ?? data.message ?? 'Could not save')
      else {
        announcePendingChange()
        onSaved()
      }
    } finally {
      setBusy(false)
    }
  }

  const open = (status: string) => {
    // Mirrors the server rule so the message lands next to the box.
    if (status === 'declined' && !note.trim()) {
      setError('Write the reason for declining in the note first. It goes into the email, and you can edit it there.')
      return
    }
    setError(null)
    setFlash(null)
    setComposing(status)
  }

  if (composing) {
    return (
      <DecisionComposer
        target={{ kind: record.kind, reference: record.reference, name: record.submitter, email: record.email, title: record.title, targetTitle: record.targetTitle, role: record.role }}
        status={composing}
        note={note}
        endpoint={endpoint}
        csrfToken={csrfToken}
        onCancel={() => setComposing(null)}
        onDone={({ emailed }) => {
          setComposing(null)
          setFlash(emailed ? `Decision saved and emailed to ${record.email}.` : 'Decision saved. No email was sent.')
          onSaved()
        }}
      />
    )
  }

  const decided = !isOpen(record.status)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 520 }}>
      {flash ? <p role="status" style={{ margin: 0, fontSize: 13, color: '#1C6B3C' }}>{flash}</p> : null}
      {decided ? (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-3,#3C4854)' }}>
          {STATUS_LABELS[record.status] ?? record.status}.{' '}
          {record.emailedAt ? `Decision emailed ${formatDate(record.emailedAt)}.` : emailsOnDecision(record.status) ? 'The submitter has not been emailed.' : ''}
        </p>
      ) : null}
      <label style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
        Decision note <span style={{ fontSize: 12, color: 'var(--muted,#505C68)' }}>Required when declining. Goes into the email draft, and the audit log.</span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} style={{ font: 'inherit', fontSize: 14, padding: 8 }} />
      </label>
      {error ? <span role="alert" style={{ color: '#A52A2A', fontSize: 13 }}>{error}</span> : null}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {record.status === 'received' ? (
          <Action onClick={markUnderReview} disabled={busy}>
            {busy ? 'Saving…' : 'Mark under review'}
          </Action>
        ) : null}
        {record.kind === 'book_submission' && record.status !== 'revisions' && !decided ? (
          <Action onClick={() => open('revisions')} disabled={busy}>
            Request revisions
          </Action>
        ) : null}
        {decided && emailsOnDecision(record.status) ? (
          <Action onClick={() => open(record.status)} disabled={busy}>
            {record.emailedAt ? 'Email the decision again' : 'Email the decision'}
          </Action>
        ) : (
          <>
            <Action onClick={() => open('accepted')} disabled={busy} primary>
              Accept
            </Action>
            <Action onClick={() => open('declined')} disabled={busy} danger>
              Decline
            </Action>
          </>
        )}
      </div>
    </div>
  )
}

const Action = ({ children, onClick, disabled, primary, danger }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; primary?: boolean; danger?: boolean }) => (
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

type LoadResult = { records: FormRecord[] } | { error: string }

async function fetchRecords(): Promise<LoadResult> {
  const res = await fetch('/api/admin/forms', { cache: 'no-store' })
  const data = (await res.json().catch(() => ({}))) as { records?: FormRecord[]; message?: string }
  return res.ok ? { records: data.records ?? [] } : { error: data.message ?? 'Could not load the editorial forms.' }
}

export function AdminForms({ csrfToken }: { csrfToken: string }) {
  const [records, setRecords] = useState<FormRecord[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<FormKind>('application')
  const [open, setOpen] = useState<string | null>(null)

  // Fetching is kept apart from state-setting so the effect sets state only
  // after an await (the pattern AdminProposals documents).
  const apply = useCallback((result: LoadResult) => {
    if ('error' in result) setError(result.error)
    else {
      setError(null)
      setRecords(result.records)
    }
  }, [])

  const load = useCallback(async () => apply(await fetchRecords()), [apply])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const result = await fetchRecords()
      if (!cancelled) apply(result)
    })()
    return () => {
      cancelled = true
    }
  }, [apply])

  const shown = (records ?? []).filter((r) => r.kind === tab)

  return (
    <section style={{ marginTop: 24 }}>
      <h2 style={{ margin: '0 0 6px', fontSize: 20 }}>Editorial forms</h2>
      <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--ink-3,#3C4854)', maxWidth: '72ch' }}>
        Applications and proposals sent through the site. Files open through a five-minute signed link, and every download is recorded in Activity.
      </p>
      <div role="tablist" style={{ display: 'flex', gap: 18, borderBottom: '1px solid var(--line,#DCE1E6)', marginBottom: 12, flexWrap: 'wrap' }}>
        {TABS.map((t) => {
          const count = (records ?? []).filter((r) => r.kind === t.kind).length
          const fresh = (records ?? []).filter((r) => r.kind === t.kind && r.status === 'received').length
          const active = t.kind === tab
          return (
            <button key={t.kind} role="tab" aria-selected={active} onClick={() => setTab(t.kind)} style={{ border: 0, background: 'none', padding: '10px 0', font: 'inherit', fontSize: 14, fontWeight: active ? 600 : 500, borderBottom: `2px solid ${active ? 'var(--accent,#1D5DA8)' : 'transparent'}`, cursor: 'pointer' }}>
              {t.label} ({count}){fresh > 0 ? <span className="admin-new-badge" style={{ marginLeft: 6 }}>{fresh} new</span> : null}
            </button>
          )
        })}
      </div>
      {error ? <p role="alert" style={{ color: '#A52A2A' }}>{error}</p> : null}
      {records === null && !error ? <p>Loading…</p> : null}
      {records !== null && shown.length === 0 ? <p style={{ color: 'var(--ink-3,#3C4854)' }}>Nothing has been submitted yet.</p> : null}
      {shown.length > 0 ? (
        <div className="scroll-x">
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
          <thead>
            <tr>
              {['Reference', 'Title', 'For', 'From', 'Received', 'Status'].map((h) => (
                <th key={h} scope="col" style={{ ...cell, textAlign: 'left', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--muted,#505C68)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => {
              const key = `${r.kind}-${r.id}`
              const expanded = open === key
              return [
                <tr key={key}>
                  <td style={cell}>
                    <button onClick={() => setOpen(expanded ? null : key)} aria-expanded={expanded} style={{ border: 0, background: 'none', padding: 0, font: 'inherit', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--accent,#1D5DA8)', cursor: 'pointer' }}>
                      {expanded ? '▾' : '▸'} {r.reference}
                    </button>
                  </td>
                  <td style={cell}>{r.title}</td>
                  <td style={{ ...cell, fontFamily: 'var(--font-mono)', fontSize: 13 }}>{r.target.toUpperCase()}</td>
                  <td style={cell}>
                    {r.submitter}
                    <br />
                    <a href={`mailto:${r.email}?subject=${encodeURIComponent(r.reference)}`} style={{ fontSize: 13 }}>{r.email}</a>
                  </td>
                  <td style={cell}>{new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td style={cell}>
                    {r.status === 'received' ? <span className="admin-new-badge">New</span> : STATUS_LABELS[r.status] ?? r.status}
                    {r.emailedAt ? <div style={{ fontSize: 12, color: 'var(--muted,#505C68)', marginTop: 2 }}>Emailed</div> : null}
                  </td>
                </tr>,
                expanded ? (
                  <tr key={`${key}-detail`}>
                    <td colSpan={6} style={{ ...cell, background: 'var(--surface-3,#FAFBFB)', padding: 16 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,420px),1fr))', gap: 24 }}>
                        <div>
                          <h3 style={{ margin: '0 0 8px', fontSize: 14 }}>Details</h3>
                          <PayloadView value={r.payload} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                          <div>
                            <h3 style={{ margin: '0 0 8px', fontSize: 14 }}>Files</h3>
                            {r.files.length === 0 ? <span style={{ fontSize: 14, color: 'var(--muted,#505C68)' }}>No files attached.</span> : null}
                            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                              {r.files.map((f) => (
                                <li key={f.id} style={{ padding: '4px 0', fontSize: 14 }}>
                                  <a href={`/api/admin/uploads/${f.id}`}>{f.name}</a>{' '}
                                  <span style={{ color: 'var(--muted,#505C68)', fontSize: 12 }}>
                                    {f.purpose.replace('_', ' ')} · {formatBytes(f.size)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <Decision record={r} csrfToken={csrfToken} onSaved={load} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : null,
              ]
            })}
          </tbody>
        </table>
        </div>
      ) : null}
    </section>
  )
}
