'use client'

import { useCallback, useEffect, useState } from 'react'
import { CSRF_HEADER } from '@/lib/auth/csrf'
import { ojsHandoffUrl, ojsUrl } from '@/lib/ojs/config'
import { ojsContext } from '@/lib/ojs/contexts'

/**
 * Published papers, with the portal's show/hide switch for each.
 *
 * The list is what OJS has published and the scheduled harvest has seen. The
 * switch is the portal's own decision about display, defaulting to shown —
 * mirror OJS, hold back exceptionally (docs/ADMIN-PANEL-PLAN.md, D2). It is
 * not a Publish button and must not look like one: publishing happens in OJS,
 * and the empty state says so rather than offering to do it from here.
 *
 * Hiding asks for a reason inline rather than in a dialog. The reason is
 * optional — "not yet" is legitimate — but the box being there is what makes
 * the audit row worth reading later.
 */

type Row = {
  id: string
  slug: string
  title: string
  journalSlug: string
  journalCode: string
  journalTitle: string
  authors: string[]
  publishedIso: string
  volume: number
  issue: number
  doi: string
  hasPdf: boolean
  submissionId: number | null
  hidden: boolean
  note: string | null
  updatedBy: string | null
  updatedAtIso: string | null
}

type LoadResult = { rows: Row[] | null; harvestedAt: string | null; gate: string | null; error: string | null }

type Filter = 'all' | 'shown' | 'hidden'

const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const formatDateTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—'

const authorsShort = (names: string[]) =>
  names.length === 0 ? '—' : names.length <= 2 ? names.join(' and ') : `${names[0]} et al.`

const cell: React.CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid var(--line,#DCE1E6)',
  fontSize: 13,
  verticalAlign: 'top',
  textAlign: 'left',
}

const headCell: React.CSSProperties = {
  ...cell,
  fontWeight: 600,
  color: 'var(--ink-2,#1F2A36)',
  borderBottom: '1px solid var(--line-strong,#B9C1C9)',
  whiteSpace: 'nowrap',
}

const button: React.CSSProperties = {
  padding: '6px 11px',
  borderRadius: 3,
  border: '1px solid var(--line-strong,#B9C1C9)',
  background: 'var(--surface,#fff)',
  fontSize: 12,
  color: 'var(--ink-2,#1F2A36)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

const chipLink: React.CSSProperties = {
  display: 'inline-block',
  padding: '4px 9px',
  border: '1px solid var(--line,#DCE1E6)',
  borderRadius: 3,
  fontSize: 12,
  color: 'var(--ink-2,#1F2A36)',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
}

/** Pure fetch: returns rows and an error message, sets no state. */
async function fetchArticles(): Promise<LoadResult> {
  try {
    const response = await fetch('/api/admin/articles', { cache: 'no-store' })
    const data = (await response.json()) as {
      ok?: boolean
      articles?: Row[]
      harvestedAt?: string | null
      gate?: string
      message?: string
    }
    if (!response.ok || !data.ok) {
      return { rows: null, harvestedAt: null, gate: null, error: data.message ?? 'Could not load published papers.' }
    }
    return { rows: data.articles ?? [], harvestedAt: data.harvestedAt ?? null, gate: data.gate ?? null, error: null }
  } catch {
    return { rows: null, harvestedAt: null, gate: null, error: 'Could not load published papers. Check your connection and try again.' }
  }
}

export function AdminPublishing({ csrfToken }: { csrfToken: string }) {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [harvestedAt, setHarvestedAt] = useState<string | null>(null)
  const [gate, setGate] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  /** The row whose "hide" reason box is open. */
  const [hiding, setHiding] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  // Fetching is separated from state-setting on purpose, as in AdminProposals:
  // state is set only after an await, never straight from an effect body.
  const apply = useCallback((result: LoadResult) => {
    if (result.error !== null) {
      setError(result.error)
      return
    }
    setError(null)
    setRows(result.rows)
    setHarvestedAt(result.harvestedAt)
    setGate(result.gate)
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const result = await fetchArticles()
      if (!cancelled) apply(result)
    })()
    return () => {
      cancelled = true
    }
  }, [apply])

  const setDisplay = async (id: string, hidden: boolean, note: string) => {
    setBusy(id)
    setError(null)
    try {
      const response = await fetch(`/api/admin/articles/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', [CSRF_HEADER]: csrfToken },
        body: JSON.stringify({ hidden, note }),
      })
      const data = (await response.json()) as { ok?: boolean; message?: string; errors?: { message: string }[] }
      if (!response.ok || !data.ok) {
        setError(data.errors?.[0]?.message ?? data.message ?? 'Could not change that paper.')
        return
      }
      setHiding(null)
      setReason('')
      // Reload rather than patch local state: the server stamps who and when,
      // and a row the server has not confirmed is how an admin screen lies.
      apply(await fetchArticles())
    } catch {
      setError('Could not change that paper. Check your connection and try again.')
    } finally {
      setBusy(null)
    }
  }

  if (rows === null) {
    return <p style={{ fontSize: 14, color: 'var(--muted,#505C68)' }}>{error ?? 'Loading published papers…'}</p>
  }

  const hiddenCount = rows.filter((r) => r.hidden).length
  const visible = rows.filter((r) => (filter === 'all' ? true : filter === 'hidden' ? r.hidden : !r.hidden))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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

      {gate === 'unavailable' ? (
        <p
          role="status"
          style={{
            margin: 0,
            background: '#FFF4E0',
            border: '1px solid #E8CFA0',
            borderRadius: 3,
            padding: '10px 12px',
            fontSize: 13,
            color: '#8A5A00',
          }}
        >
          The portal database is not configured on this server, so every published paper is shown and the switch is
          off.
        </p>
      ) : null}

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, fontSize: 13 }}>
        <span style={{ color: 'var(--muted,#505C68)' }}>
          {rows.length} published · {rows.length - hiddenCount} shown on the site · {hiddenCount} hidden
        </span>
        <span aria-hidden="true" style={{ color: 'var(--line-strong,#B9C1C9)' }}>
          |
        </span>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted,#505C68)' }}>
          Show
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
            style={{ padding: '4px 6px', fontSize: 13, border: '1px solid var(--line,#DCE1E6)', borderRadius: 3 }}
          >
            <option value="all">All</option>
            <option value="shown">Shown on the site</option>
            <option value="hidden">Hidden</option>
          </select>
        </label>
        <span style={{ marginLeft: 'auto', color: 'var(--muted,#505C68)' }}>
          Last harvest from OJS: {formatDateTime(harvestedAt)}
        </span>
      </div>

      {rows.length === 0 ? (
        <p
          style={{
            margin: 0,
            background: 'var(--surface,#fff)',
            border: '1px solid var(--line,#DCE1E6)',
            borderRadius: 4,
            padding: '18px 20px',
            fontSize: 14,
            lineHeight: 1.6,
            color: 'var(--muted,#505C68)',
          }}
        >
          OJS has not published anything yet. A paper reaches this list once its issue is published in OJS and the
          scheduled harvest has run, which takes up to fifteen minutes. Publishing itself happens in OJS: open the
          journal from <a href="/admin/journals">Journals</a>, go to <strong>Issues → Future Issues</strong> and
          choose <strong>Publish Issue</strong>.
        </p>
      ) : (
        <div
          style={{
            overflowX: 'auto',
            background: 'var(--surface,#fff)',
            border: '1px solid var(--line,#DCE1E6)',
            borderRadius: 4,
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={headCell}>Paper</th>
                <th style={headCell}>Journal</th>
                <th style={headCell}>Published</th>
                <th style={headCell}>On the site</th>
                <th style={headCell}>Open</th>
                <th style={headCell}>Action</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => {
                const isHiding = hiding === r.id
                return (
                  <tr key={r.id}>
                    <td style={{ ...cell, minWidth: 260 }}>
                      <div style={{ fontWeight: 600, color: 'var(--ink,#101B27)' }}>{r.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted,#505C68)', marginTop: 3 }}>
                        {authorsShort(r.authors)}
                        {r.doi ? ` · doi:${r.doi}` : ''}
                        {r.hasPdf ? '' : ' · no PDF galley'}
                      </div>
                    </td>
                    <td style={{ ...cell, whiteSpace: 'nowrap' }}>
                      <span title={r.journalTitle}>{r.journalCode}</span>
                      <div style={{ fontSize: 12, color: 'var(--muted,#505C68)' }}>
                        Vol. {r.volume} No. {r.issue}
                      </div>
                    </td>
                    <td style={{ ...cell, whiteSpace: 'nowrap' }}>{formatDate(r.publishedIso)}</td>
                    <td style={{ ...cell, minWidth: 160 }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 3,
                          fontSize: 12,
                          fontWeight: 600,
                          background: r.hidden ? '#FBEAEA' : '#E6F6EC',
                          color: r.hidden ? '#A52A2A' : '#1C6B3C',
                        }}
                      >
                        {r.hidden ? 'Hidden' : 'Shown'}
                      </span>
                      {r.updatedAtIso ? (
                        <div style={{ fontSize: 12, color: 'var(--muted,#505C68)', marginTop: 4 }}>
                          {r.updatedBy ?? 'An administrator'} · {formatDateTime(r.updatedAtIso)}
                          {r.note ? <div style={{ marginTop: 2 }}>“{r.note}”</div> : null}
                        </div>
                      ) : null}
                    </td>
                    <td style={cell}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {r.hidden ? (
                          <span style={{ ...chipLink, color: 'var(--muted,#505C68)' }} title="Hidden papers have no portal page">
                            Portal page
                          </span>
                        ) : (
                          <a href={`/articles/${r.slug}`} style={chipLink} target="_blank" rel="noreferrer">
                            Portal page
                          </a>
                        )}
                        {r.submissionId ? (
                          <a
                            href={ojsHandoffUrl(ojsUrl(ojsContext(r.journalSlug), `/workflow/access/${r.submissionId}`))}
                            style={chipLink}
                          >
                            In OJS
                          </a>
                        ) : null}
                      </div>
                    </td>
                    <td style={{ ...cell, minWidth: 200 }}>
                      {gate === 'unavailable' ? (
                        <span style={{ fontSize: 12, color: 'var(--muted,#505C68)' }}>—</span>
                      ) : r.hidden ? (
                        <button
                          type="button"
                          style={button}
                          disabled={busy === r.id}
                          onClick={() => void setDisplay(r.id, false, '')}
                        >
                          {busy === r.id ? 'Showing…' : 'Show on the site'}
                        </button>
                      ) : isHiding ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Why is it being held back? (optional, recorded)"
                            rows={2}
                            style={{
                              width: '100%',
                              minWidth: 200,
                              padding: 6,
                              fontSize: 12,
                              border: '1px solid var(--line,#DCE1E6)',
                              borderRadius: 3,
                              resize: 'vertical',
                            }}
                          />
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              type="button"
                              style={{ ...button, borderColor: '#A52A2A', color: '#A52A2A' }}
                              disabled={busy === r.id}
                              onClick={() => void setDisplay(r.id, true, reason)}
                            >
                              {busy === r.id ? 'Hiding…' : 'Confirm hide'}
                            </button>
                            <button
                              type="button"
                              style={button}
                              disabled={busy === r.id}
                              onClick={() => {
                                setHiding(null)
                                setReason('')
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          style={button}
                          disabled={busy !== null}
                          onClick={() => {
                            setHiding(r.id)
                            setReason('')
                          }}
                        >
                          Hide from the site
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: 'var(--muted,#505C68)' }}>
        Hiding a paper removes it from the portal website only. It stays published in OJS, where it remains
        readable and continues to be harvested by indexers. Each change is recorded under{' '}
        <a href="/admin/activity">Activity</a>.
      </p>
    </div>
  )
}
