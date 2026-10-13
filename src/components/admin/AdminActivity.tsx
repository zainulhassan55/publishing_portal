'use client'

/**
 * The audit log.
 *
 * Renders `before` → `after` rather than a sentence, because the question asked
 * of an audit log is "what exactly changed", and a prose summary is where the
 * detail that mattered gets lost. IP addresses are recorded but deliberately
 * not returned by the API — see src/app/api/admin/activity/route.ts.
 */

import { useEffect, useState } from 'react'

type Entry = {
  id: number
  actorUserId: number
  actorName: string | null
  action: string
  targetType: string
  targetId: string
  before: unknown
  after: unknown
  note: string | null
  createdAtIso: string
}

const ACTION_LABEL: Record<string, string> = {
  'proposal.status_changed': 'Journal proposal decision',
  'journal.visibility_changed': 'Journal visibility',
  'article.display_changed': 'Article display',
  'cfp.status_changed': 'Call for papers decision',
}

const TARGET_LABEL: Record<string, string> = {
  journal_proposal: 'Proposal',
  journal: 'Journal',
  article: 'Article',
  cfp_proposal: 'Call',
}

const summarise = (value: unknown): string => {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => `${k}: ${String(v)}`)
    return entries.length ? entries.join(', ') : '—'
  }
  return String(value)
}

const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

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

export function AdminActivity() {
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const response = await fetch('/api/admin/activity', { cache: 'no-store' })
        const data = (await response.json()) as { ok?: boolean; entries?: Entry[]; message?: string }
        if (cancelled) return
        if (!response.ok || !data.ok) {
          setError(data.message ?? 'Could not load the activity log.')
          return
        }
        setEntries(data.entries ?? [])
      } catch {
        if (!cancelled) setError('Could not load the activity log.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (entries === null) {
    return <p style={{ fontSize: 14, color: 'var(--muted,#505C68)' }}>{error ?? 'Loading…'}</p>
  }

  if (entries.length === 0) {
    return (
      <p
        style={{
          margin: 0,
          background: 'var(--surface,#fff)',
          border: '1px solid var(--line,#DCE1E6)',
          borderRadius: 4,
          padding: '18px 20px',
          fontSize: 14,
          color: 'var(--muted,#505C68)',
          maxWidth: 760,
        }}
      >
        Nothing recorded yet. Every decision made in this panel appears here — who made it, when, and what changed.
        Actions taken inside the editorial system are logged by OJS instead.
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          overflowX: 'auto',
          background: 'var(--surface,#fff)',
          border: '1px solid var(--line,#DCE1E6)',
          borderRadius: 4,
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
          <thead>
            <tr>
              <th style={headCell}>When</th>
              <th style={headCell}>Who</th>
              <th style={headCell}>What</th>
              <th style={headCell}>Target</th>
              <th style={headCell}>Change</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td style={{ ...cell, whiteSpace: 'nowrap' }}>{formatWhen(e.createdAtIso)}</td>
                <td style={cell}>
                  {e.actorName ?? `user ${e.actorUserId}`}
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--muted,#505C68)' }}>
                    id {e.actorUserId}
                  </span>
                </td>
                <td style={cell}>{ACTION_LABEL[e.action] ?? e.action}</td>
                <td style={{ ...cell, whiteSpace: 'nowrap' }}>
                  {TARGET_LABEL[e.targetType] ?? e.targetType} {e.targetId}
                </td>
                <td style={{ ...cell, minWidth: 260 }}>
                  <span style={{ color: 'var(--muted,#505C68)' }}>{summarise(e.before)}</span>
                  <span aria-hidden="true" style={{ margin: '0 6px' }}>
                    →
                  </span>
                  <span style={{ color: 'var(--ink,#101B27)' }}>{summarise(e.after)}</span>
                  {e.note ? (
                    <span
                      style={{
                        display: 'block',
                        marginTop: 4,
                        fontSize: 12,
                        color: 'var(--ink-3,#3C4854)',
                        lineHeight: 1.5,
                      }}
                    >
                      {e.note}
                    </span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--muted,#505C68)' }}>
        Most recent 100 entries.
      </p>
    </div>
  )
}
