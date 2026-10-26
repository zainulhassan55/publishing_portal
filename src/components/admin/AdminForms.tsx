'use client'

import { useCallback, useEffect, useState } from 'react'
import { CSRF_HEADER } from '@/lib/auth/csrf'
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

function Decision({ record, csrfToken, onSaved }: { record: FormRecord; csrfToken: string; onSaved: () => void }) {
  const [status, setStatus] = useState(record.status)
  const [note, setNote] = useState(record.decisionNote ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const statuses = Object.keys(STATUS_LABELS).filter((s) => record.kind === 'book_submission' || s !== 'revisions')

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/forms/${record.kind}/${record.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', [CSRF_HEADER]: csrfToken },
        body: JSON.stringify({ status, note }),
      })
      const data = (await res.json().catch(() => ({}))) as { errors?: { message: string }[]; message?: string }
      if (!res.ok) setError(data.errors?.[0]?.message ?? data.message ?? 'Could not save')
      else onSaved()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 520 }}>
      <label style={{ fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
        Status
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ font: 'inherit', fontSize: 14, padding: '5px 8px' }}>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </label>
      <label style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
        Note {status === 'declined' ? '(required: the reason for declining)' : '(optional)'}
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} style={{ font: 'inherit', fontSize: 14, padding: 8 }} />
      </label>
      {error ? <span role="alert" style={{ color: '#A52A2A', fontSize: 13 }}>{error}</span> : null}
      <button onClick={save} disabled={busy} style={{ alignSelf: 'flex-start', background: 'var(--accent,#1D5DA8)', color: '#fff', border: 0, borderRadius: 3, padding: '8px 14px', font: 'inherit', fontSize: 14, cursor: 'pointer' }}>
        {busy ? 'Saving…' : 'Save decision'}
      </button>
    </div>
  )
}

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
          const active = t.kind === tab
          return (
            <button key={t.kind} role="tab" aria-selected={active} onClick={() => setTab(t.kind)} style={{ border: 0, background: 'none', padding: '10px 0', font: 'inherit', fontSize: 14, fontWeight: active ? 600 : 500, borderBottom: `2px solid ${active ? 'var(--accent,#1D5DA8)' : 'transparent'}`, cursor: 'pointer' }}>
              {t.label} ({count})
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
                  <td style={cell}>{STATUS_LABELS[r.status] ?? r.status}</td>
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
