'use client'

/**
 * The cross-journal submission queue.
 *
 * Reads `/api/submissions?scope=all`, which the access layer gates to
 * administrators and journal managers. Nothing here is portal-owned data: it is
 * OJS's answer, rendered in one table instead of ten.
 *
 * ## Why days-in-stage is the headline column
 *
 * "What is stuck" is the question an administrator of ten journals actually
 * has, and no OJS screen answers it across journals. A manuscript sitting at
 * review for ninety days is the single most useful thing this panel can
 * surface — audit finding F-07 was exactly that failure, reviewers never
 * receiving invitations and the process stalling silently with nobody watching.
 * So the default sort is staleness, not date, and the figure is highlighted
 * once it passes a threshold.
 *
 * `Draft` is excluded from the staleness warning: an incomplete submission is
 * the author's to finish, and flagging it as editorial delay would point the
 * administrator at the wrong person.
 */

import { useEffect, useMemo, useState } from 'react'
import { ojsHandoffUrl } from '@/lib/ojs/config'
import type { JournalRef } from '@/components/mockup/DashboardPage'

type Row = {
  id: string
  ojsSubmissionId: number
  journalSlug: string
  title: string
  status: string
  stage: number
  submittedIso?: string
  updatedIso: string
  ojsUrl: string | null
  publishedUrl: string | null
}

/** Past this, a manuscript that is not a draft is worth a second look. */
const STALE_DAYS = 60

const STATUS_COLOUR: Record<string, { bg: string; fg: string }> = {
  Draft: { bg: '#EEF2F5', fg: '#505C68' },
  Submitted: { bg: '#FFF4E0', fg: '#8A5A00' },
  'Under review': { bg: '#E8F0FA', fg: '#174C8A' },
  'Revisions requested': { bg: '#FFF0E6', fg: '#9A4A00' },
  Accepted: { bg: '#E6F6EC', fg: '#1C6B3C' },
  'In production': { bg: '#E6F6EC', fg: '#1C6B3C' },
  Published: { bg: '#E6F6EC', fg: '#1C6B3C' },
  Rejected: { bg: '#FBEAEA', fg: '#A52A2A' },
  Withdrawn: { bg: '#FBEAEA', fg: '#A52A2A' },
}

const daysSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

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

/**
 * Pure fetch: returns rows and an error message, sets no state.
 *
 * `rows` and `error` are not exclusive. A successful call can still carry a
 * `reason` — the editorial system unconfigured, or an expired OJS session —
 * which means "nothing to show, and here is why", a different situation from a
 * failed request and with a different fix.
 */
async function fetchSubmissions(): Promise<{ rows: Row[] | null; error: string | null }> {
  try {
    const response = await fetch('/api/submissions?scope=all', { cache: 'no-store' })
    const data = (await response.json()) as {
      ok?: boolean
      submissions?: Row[]
      message?: string
      reason?: string
    }

    if (!response.ok || !data.ok) {
      return { rows: null, error: data.message ?? 'Could not load submissions.' }
    }

    const reason =
      data.reason === 'ojs-not-configured'
        ? 'The editorial system is not configured on this server.'
        : data.reason === 'no-ojs-session'
          ? 'Your editorial-system session has expired. Sign out and back in.'
          : null

    return { rows: data.submissions ?? [], error: reason }
  } catch {
    return { rows: null, error: 'Could not load submissions. Check your connection and try again.' }
  }
}

export function AdminSubmissions({ journals }: { journals: JournalRef[] }) {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [journal, setJournal] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState<'stale' | 'recent'>('stale')

  const codeFor = useMemo(() => new Map(journals.map((j) => [j.slug, j.code])), [journals])

  // Fetch and state-setting are separated for the same reason as in
  // AdminProposals: state is only set after an await.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const result = await fetchSubmissions()
      if (cancelled) return
      setError(result.error)
      setRows(result.rows ?? [])
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const visible = useMemo(() => {
    if (!rows) return []
    const filtered = rows.filter(
      (r) => (!journal || r.journalSlug === journal) && (!status || r.status === status),
    )
    return [...filtered].sort((a, b) =>
      sort === 'recent'
        ? b.updatedIso.localeCompare(a.updatedIso)
        : // Staleness: oldest activity first, which is the top of the worklist.
          a.updatedIso.localeCompare(b.updatedIso),
    )
  }, [rows, journal, status, sort])

  const statuses = useMemo(() => [...new Set((rows ?? []).map((r) => r.status))].sort(), [rows])

  if (rows === null) {
    return <p style={{ fontSize: 14, color: 'var(--muted,#505C68)' }}>{error ?? 'Loading submissions from OJS…'}</p>
  }

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

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
        <Select label="Journal" value={journal} onChange={setJournal}>
          <option value="">All journals</option>
          {journals.map((j) => (
            <option key={j.slug} value={j.slug}>
              {j.code}
            </option>
          ))}
        </Select>

        <Select label="Status" value={status} onChange={setStatus}>
          <option value="">Any status</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>

        <Select label="Sort" value={sort} onChange={(v) => setSort(v as 'stale' | 'recent')}>
          <option value="stale">Longest without activity</option>
          <option value="recent">Most recent activity</option>
        </Select>

        <span style={{ fontSize: 13, color: 'var(--muted,#505C68)', paddingBottom: 9, marginLeft: 'auto' }}>
          {visible.length} of {rows.length}
        </span>
      </div>

      {rows.length === 0 && !error ? (
        <p
          style={{
            margin: 0,
            background: 'var(--surface,#fff)',
            border: '1px solid var(--line,#DCE1E6)',
            borderRadius: 4,
            padding: '18px 20px',
            fontSize: 14,
            color: 'var(--muted,#505C68)',
          }}
        >
          No submissions in any journal yet.
        </p>
      ) : null}

      {rows.length > 0 ? (
        <div style={{ overflowX: 'auto', background: 'var(--surface,#fff)', border: '1px solid var(--line,#DCE1E6)', borderRadius: 4 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
            <thead>
              <tr>
                <th style={headCell}>Journal</th>
                <th style={headCell}>Title</th>
                <th style={headCell}>Status</th>
                <th style={headCell}>Submitted</th>
                <th style={headCell}>Last activity</th>
                <th style={headCell}>Idle</th>
                <th style={headCell}>In OJS</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => {
                const idle = daysSince(r.updatedIso)
                const stale = r.status !== 'Draft' && idle >= STALE_DAYS
                const colour = STATUS_COLOUR[r.status] ?? { bg: '#EEF2F5', fg: '#505C68' }

                return (
                  <tr key={`${r.journalSlug}-${r.ojsSubmissionId}`}>
                    <td style={{ ...cell, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                      {codeFor.get(r.journalSlug) ?? r.journalSlug.toUpperCase()}
                    </td>
                    <td style={{ ...cell, minWidth: 260 }}>
                      {r.title}
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--muted,#505C68)', marginTop: 2 }}>
                        {r.id}
                      </span>
                    </td>
                    <td style={cell}>
                      <span
                        style={{
                          background: colour.bg,
                          color: colour.fg,
                          borderRadius: 3,
                          padding: '2px 8px',
                          fontSize: 12,
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td style={{ ...cell, whiteSpace: 'nowrap' }}>{formatDate(r.submittedIso)}</td>
                    <td style={{ ...cell, whiteSpace: 'nowrap' }}>{formatDate(r.updatedIso)}</td>
                    <td
                      style={{
                        ...cell,
                        whiteSpace: 'nowrap',
                        color: stale ? '#A52A2A' : 'var(--ink-3,#3C4854)',
                        fontWeight: stale ? 600 : 400,
                      }}
                      title={stale ? `No activity for ${idle} days` : undefined}
                    >
                      {idle} {idle === 1 ? 'day' : 'days'}
                    </td>
                    <td style={cell}>
                      {r.ojsUrl ? (
                        <a href={ojsHandoffUrl(r.ojsUrl)} style={{ whiteSpace: 'nowrap' }}>
                          Open
                        </a>
                      ) : (
                        <span style={{ color: 'var(--muted,#505C68)' }}>—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      <p style={{ margin: 0, fontSize: 12, color: 'var(--muted,#505C68)', lineHeight: 1.5, maxWidth: 760 }}>
        Read-only. Reviewer assignment, decisions and stage changes happen in the editorial system — follow a row
        into OJS and you will arrive already signed in. &ldquo;Idle&rdquo; counts days since the last activity OJS
        recorded; drafts are the author&rsquo;s to finish and are never flagged.
      </p>
    </div>
  )
}

const Select = ({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
}) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--muted,#505C68)' }}>
    {label}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        border: '1px solid var(--line-strong,#B9C1C9)',
        borderRadius: 3,
        padding: '7px 10px',
        font: 'inherit',
        fontSize: 13,
        background: 'var(--surface,#fff)',
        color: 'var(--ink,#101B27)',
      }}
    >
      {children}
    </select>
  </label>
)
