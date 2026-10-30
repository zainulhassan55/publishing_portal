'use client'

/**
 * The admin nav, with a live count of new submissions.
 *
 * A badge sits on each section that has something new, and a bar under the nav
 * says what is waiting. The counts start from the server render, then refresh
 * every minute, when the tab regains focus, on navigation, and straight after a
 * decision (DecisionComposer announces it). The tab title carries the total
 * too, so a panel left open in a background tab still shows "(2)".
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import type { PendingCounts } from '@/lib/admin/pending'

const NAV = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/journals', label: 'Journals' },
  { href: '/admin/publishing', label: 'Published papers' },
  { href: '/admin/proposals', label: 'Journal proposals' },
  { href: '/admin/forms', label: 'Editorial forms' },
  { href: '/admin/volumes', label: 'Book volumes' },
  { href: '/admin/submissions', label: 'All submissions' },
  { href: '/admin/activity', label: 'Activity' },
]

const POLL_MS = 60_000

const formsTotal = (c: PendingCounts) => c.forms.application + c.forms.special_issue + c.forms.book_volume + c.forms.book_submission

const badgeFor = (href: string, c: PendingCounts | null) =>
  !c ? 0 : href === '/admin/proposals' ? c.proposals : href === '/admin/forms' ? formsTotal(c) : href === '/admin' ? c.total : 0

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

async function fetchCounts(): Promise<PendingCounts | null | undefined> {
  try {
    const res = await fetch('/api/admin/pending', { cache: 'no-store' })
    if (!res.ok) return undefined
    const data = (await res.json()) as { counts?: PendingCounts | null }
    return data.counts ?? null
  } catch {
    // Offline or mid-deploy: keep showing the last counts rather than clearing them.
    return undefined
  }
}

export function AdminNav({ initial }: { initial: PendingCounts | null }) {
  const pathname = usePathname()
  const [counts, setCounts] = useState(initial)

  const refresh = useCallback(async () => {
    const next = await fetchCounts()
    if (next !== undefined) setCounts(next)
  }, [])

  useEffect(() => {
    let cancelled = false
    const tick = async () => {
      const next = await fetchCounts()
      if (!cancelled && next !== undefined) setCounts(next)
    }
    void tick()
    const timer = window.setInterval(tick, POLL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') void tick()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
    // Re-run on navigation so the counts are fresh on every admin screen.
  }, [pathname])

  useEffect(() => {
    const onChange = () => void refresh()
    window.addEventListener('admin:pending-changed', onChange)
    return () => window.removeEventListener('admin:pending-changed', onChange)
  }, [refresh])

  const total = counts?.total ?? 0

  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, '')
    document.title = total > 0 ? `(${total}) ${base}` : base
  }, [total, pathname])

  const parts = counts
    ? [
        counts.proposals ? { href: '/admin/proposals', text: plural(counts.proposals, 'journal proposal') } : null,
        counts.forms.application ? { href: '/admin/forms', text: plural(counts.forms.application, 'reviewer/board application') } : null,
        counts.forms.special_issue ? { href: '/admin/forms', text: plural(counts.forms.special_issue, 'special issue proposal') } : null,
        counts.forms.book_volume ? { href: '/admin/forms', text: plural(counts.forms.book_volume, 'book volume proposal') } : null,
        counts.forms.book_submission ? { href: '/admin/forms', text: plural(counts.forms.book_submission, 'book chapter') } : null,
      ].filter((p): p is { href: string; text: string } => p !== null)
    : []

  return (
    <>
      <nav aria-label="Administration" style={{ display: 'flex', flexWrap: 'wrap', gap: 4, margin: '14px 0 0' }}>
        {NAV.map((item) => {
          const n = badgeFor(item.href, counts)
          const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              aria-label={n > 0 ? `${item.label}, ${n} new` : undefined}
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 12px',
                borderRadius: 3,
                border: `1px solid ${active ? 'var(--accent,#1D5DA8)' : 'var(--line,#DCE1E6)'}`,
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                color: 'var(--ink-2,#1F2A36)',
                textDecoration: 'none',
              }}
            >
              {item.label}
              {n > 0 && item.href !== '/admin' ? (
                <span className="admin-count" aria-hidden="true">
                  {n}
                </span>
              ) : null}
            </Link>
          )
        })}
      </nav>

      {total > 0 ? (
        <div
          role="status"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '6px 10px',
            margin: '12px 0 0',
            padding: '10px 14px',
            border: '1px solid #F0D49A',
            background: '#FFF8E8',
            borderRadius: 4,
            fontSize: 13,
            color: '#5C4300',
          }}
        >
          <span className="admin-live-dot" aria-hidden="true" />
          <strong>{plural(total, 'new submission')} waiting:</strong>
          {parts.map((p, i) => (
            <span key={p.text}>
              <Link href={p.href} style={{ color: '#5C4300' }}>
                {p.text}
              </Link>
              {i < parts.length - 1 ? ',' : ''}
            </span>
          ))}
          <span style={{ color: '#7A6020' }}>· Clears when each one is marked under review or decided.</span>
        </div>
      ) : null}

      <div style={{ height: 24 }} />
    </>
  )
}
