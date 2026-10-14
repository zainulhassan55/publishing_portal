'use client'

/**
 * Dashboard — verbatim replication of Dashboard.dc.html (see docs/REPLICATION.md).
 * Markup and inline styles are copied from the mockup; the DCLogic renderVals
 * body is ported to React state below.
 *
 * All data is real. Submissions come from GET /api/submissions, which reads
 * them out of OJS on the signed-in author's behalf — including incomplete
 * ones, which OJS keeps and lets the author resume in its own wizard. The
 * portal's own draft store was removed with the submission form; OJS is the
 * single home for in-progress work. The fixture submissions, decision
 * letters and review invitations that
 * used to populate this page are gone — they were useful while building the UI
 * and misleading the moment sign-in started working, because invented
 * manuscripts sat beside the author's real ones.
 *
 * The division: **read here, act in OJS.** Status, dates and metadata render in
 * the portal, so selecting a submission opens the detail panel rather than
 * bouncing the author out. Every action links to the per-submission URL OJS
 * supplies, because uploading a revision needs a file and reviewer reports and
 * decision letters have no API in OJS 3.5 at all.
 *
 * The reviewer tab links out permanently for the same reason: OJS exposes no
 * reviewer or review-round resource.
 */

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from '@/components/auth/SessionProvider'
import { formatDate, formatDateShort } from '@/lib/format'
import { ojsDashboardUrl, ojsEditorialUrl, ojsHandoffUrl, ojsProfileUrlRelative, ojsReviewUrl } from '@/lib/ojs/config'
import { hasEditorialRole } from '@/lib/auth/roles'
import type { Submission, SubmissionStatus } from '@/types/publishing'

export type JournalRef = { slug: string; code: string; title: string }

type Props = {
  journals: JournalRef[]
}

type ApiSubmission = {
  id: string
  ojsSubmissionId: number
  journalSlug: string
  title: string
  status: SubmissionStatus
  stage: number
  submittedIso?: string
  updatedIso: string
  coauthors: string[]
  ojsUrl: string | null
  publishedUrl: string | null
}

type Letter = NonNullable<Submission['decisionLetter']>

type Row = {
  id: string
  code: string
  jTitle: string
  journalSlug: string | null
  type: string
  title: string
  submitted: string
  updated: string
  status: SubmissionStatus
  action?: string
  co: string
  stage: number
  letter?: Letter
  /** OJS's own per-submission author workflow URL. Where actions go. */
  ojsUrl?: string | null
  publishedUrl?: string | null
}

type TimelineItem = {
  h: string
  d: string
  dot: string
  ring: string
  line: string
  weight: number
  fg: string
}

type ActionDef = {
  label: string
  /** Internal route (next/link), external/OJS href, or a click action. */
  href?: string
  external?: boolean
  onClick?: () => void
  primary?: boolean
}

/* Status chip colours, verbatim from the mockup's S map. */
const S: Record<SubmissionStatus, [string, string, string]> = {
  Draft: ['var(--surface-2,#F5F6F7)', 'var(--ink-3,#3C4854)', 'var(--line,#DCE1E6)'],
  Submitted: ['var(--line-soft,#EEF1F4)', 'var(--ink-2,#1F2A36)', 'var(--line-strong,#B9C1C9)'],
  'Under review': ['var(--accent-soft,#E8F0FA)', 'var(--accent-dark,#174C8A)', '#B7CDEA'],
  'Revisions requested': ['#FDF1DE', '#8A5300', '#EBCB98'],
  Accepted: ['#E7F3EB', '#1E6B3A', '#B9DCC4'],
  'In production': ['#E6F2F2', '#145E5E', '#A9D3D3'],
  Published: ['#1E6B3A', '#FFFFFF', '#1E6B3A'],
  Rejected: ['#FBEAEA', '#A52A2A', '#E3B3B3'],
  Withdrawn: ['var(--surface-2,#F5F6F7)', 'var(--muted,#505C68)', 'var(--line,#DCE1E6)'],
}

/** Status → the mockup's `stage` index (-1 is the rejection/withdrawal branch). */
const STATUS_STAGE: Record<SubmissionStatus, number> = {
  Draft: 0,
  Submitted: 1,
  'Under review': 2,
  'Revisions requested': 3,
  Accepted: 4,
  'In production': 5,
  Published: 6,
  Rejected: -1,
  Withdrawn: -1,
}

const GROUPS: Record<string, (s: Row) => boolean> = {
  all: () => true,
  action: (s) => ['Revisions requested', 'Draft'].includes(s.status),
  progress: (s) => ['Submitted', 'Under review', 'Accepted', 'In production'].includes(s.status),
  closed: (s) => ['Published', 'Rejected', 'Withdrawn'].includes(s.status),
}

function buildTimeline(cur: Row): TimelineItem[] {
  if (cur.stage === -1) {
    const reviewers = cur.letter?.reviews.length ?? 2
    return [
      { h: 'Submitted', d: cur.submitted },
      { h: 'Under review', d: `${reviewers} reviewers` },
      { h: cur.status, d: cur.letter ? `${cur.updated} · decision letter available` : cur.updated },
    ].map((t, i, a) => ({
      ...t,
      dot: i === a.length - 1 ? '#A52A2A' : '#1E6B3A',
      ring: i === a.length - 1 ? '#A52A2A' : '#1E6B3A',
      line: i === a.length - 1 ? 'transparent' : 'var(--line-strong,#B9C1C9)',
      weight: i === a.length - 1 ? 600 : 400,
      fg: 'var(--ink,#101B27)',
    }))
  }

  const decisionNote =
    cur.stage === 3
      ? cur.letter
        ? `Major revision · ${formatDateShort(cur.letter.dateIso)}`
        : 'Major revision'
      : cur.stage >= 4
        ? 'Accepted'
        : ''

  const stages: [string, string][] = [
    ['Draft started', ''],
    ['Submitted', cur.submitted === '—' ? '' : cur.submitted],
    ['Under review', cur.stage >= 2 ? 'Reviewers assigned' : ''],
    ['Decision', decisionNote],
    ['Accepted', cur.stage >= 4 ? 'Complete' : ''],
    ['In production', cur.stage >= 5 ? 'Copy-editing in progress' : ''],
    ['Published', ''],
  ]

  return stages
    .filter((_, i) => !(cur.stage !== 3 && i === 3))
    .map((t, i, a) => {
      const idx = cur.stage === 3 ? i : i >= 3 ? i + 1 : i
      const target = cur.stage === 3 ? 3 : cur.stage
      const done = idx < target || idx === 0
      const now = idx === target
      return {
        h: t[0],
        d: now && !t[1] ? 'Current stage' : t[1] || (done ? 'Complete' : 'Upcoming'),
        dot: now ? 'var(--accent,#1D5DA8)' : done ? '#1E6B3A' : 'var(--surface,#fff)',
        ring: now ? 'var(--accent,#1D5DA8)' : done ? '#1E6B3A' : 'var(--line-strong,#B9C1C9)',
        line: i === a.length - 1 ? 'transparent' : 'var(--line,#DCE1E6)',
        weight: now ? 600 : 400,
        fg: done || now ? 'var(--ink,#101B27)' : 'var(--muted,#505C68)',
      }
    })
}

export function DashboardPage({ journals }: Props) {
  const sp = useSearchParams()
  const { user, loading } = useSession()

  // `?submitted=<reference>` is set by the wizard after a successful submit.
  // The `?new=1` demo trigger and its hardcoded reference are gone: it injected
  // a fabricated submission row and preselected it, which made the dashboard
  // show a manuscript that did not exist.
  const submittedParam = sp.get('submitted')
  const justSubmitted = submittedParam !== null
  const bannerRef = submittedParam ?? ''

  // `?ojs=role-needed` is set by /api/auth/ojs-handoff when it declines to
  // forward this account to an OJS page its roles cannot open — the reader
  // would otherwise have met OJS's own "The current role does not have access
  // to this operation" page. The explanation belongs here, where the fix can
  // be named.
  const roleNeeded = sp.get('ojs') === 'role-needed' ? sp.get('needs') ?? 'author' : null
  const roleNeededJournal = sp.get('journal') ?? ''

  const requestedTab = sp.get('tab')
  const [tab, setTab] = useState<'author' | 'reviewer' | 'editorial'>(
    requestedTab === 'reviewer' || requestedTab === 'editorial' ? requestedTab : 'author',
  )
  const [filter, setFilter] = useState<'all' | 'action' | 'progress' | 'closed'>('all')
  const [panel, setPanel] = useState<{ sel: string | null; count: number; letter: boolean }>({
    sel: null,
    count: 0,
    letter: false,
  })
  const [apiSubs, setApiSubs] = useState<ApiSubmission[]>([])
  /** Journal slugs this account holds a role in, per OJS. See /api/submissions. */
  const [roleJournals, setRoleJournals] = useState<string[]>([])
  const [avail, setAvail] = useState(true)
  const prefsRef = useRef<Record<string, unknown> | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    // Real submissions, read from OJS on this author's behalf. Replaces the
    // fixtures that used to sit here, which were useful while building the UI
    // and misleading the moment sign-in worked.
    fetch('/api/submissions', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || !data?.ok) return
        if (Array.isArray(data.submissions)) setApiSubs(data.submissions)
        if (Array.isArray(data.journals)) setRoleJournals(data.journals)
      })
      .catch(() => {})
    fetch('/api/profile/prefs', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data?.ok && data.prefs) {
          prefsRef.current = data.prefs as Record<string, unknown>
          setAvail(Boolean((data.prefs as { availableToReview?: boolean }).availableToReview))
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [user])

  const subs: Row[] = useMemo(() => {
    const bySlug = new Map(journals.map((j) => [j.slug, j]))
    const list: Row[] = apiSubs.map((s) => {
      const j = bySlug.get(s.journalSlug)
      return {
        id: s.id,
        code: j?.code ?? s.journalSlug.toUpperCase(),
        jTitle: j?.title ?? s.journalSlug,
        journalSlug: s.journalSlug,
        // OJS has no per-submission article type the author can read, so this
        // is left blank rather than guessed. The portal knows it only for
        // submissions it created itself, and inventing it for the rest would
        // make the column untrustworthy everywhere.
        type: '—',
        title: s.title,
        submitted: s.submittedIso ? formatDateShort(s.submittedIso) : '—',
        updated: formatDateShort(s.updatedIso),
        status: s.status,
        action:
          s.status === 'Draft' && s.submittedIso === undefined
            ? 'Incomplete in the editorial system — files not attached'
            : undefined,
        co: s.coauthors.length ? s.coauthors.join(', ') : 'None added',
        stage: STATUS_STAGE[s.status],
        ojsUrl: s.ojsUrl,
        publishedUrl: s.publishedUrl,
      }
    })
    return list
  }, [apiSubs, journals])

  const select = (id: string) => setPanel((p) => (p.sel === id ? p : { sel: id, count: p.count + 1, letter: false }))
  const toggleLetter = () => setPanel((p) => ({ ...p, letter: !p.letter }))

  const list = subs.filter(GROUPS[filter])
  const cur = subs.find((s) => s.id === panel.sel) ?? subs[0]
  const flipA = panel.count % 2 === 0
  const timeline = cur ? buildTimeline(cur) : []

  /**
   * The split that makes this dashboard honest: **read here, act in OJS.**
   *
   * Status, dates and metadata come from the API and render in the portal — so
   * clicking a submission opens the detail panel here rather than bouncing the
   * author out. But every action goes to `cur.ojsUrl`, the per-submission
   * author workflow URL OJS supplies, because the things an author actually
   * *does* have no API in OJS 3.5: uploading a revision needs a file, and
   * reviewer reports and decision letters are not exposed at all.
   *
   * A "Submit revision" button here that could not upload a file, or a
   * "View decision letter" that had no letter to show, would be the dead
   * control of audit finding F-18. Labels therefore say where they lead.
   */
  // Wrapped in the hand-off so the reader arrives in OJS already signed in,
  // instead of being asked for credentials a second time.
  //
  // The fallback must name a journal the reader is enrolled in. OJS has no
  // site-level dashboard: `index/dashboard/mySubmissions` answers every author
  // with "The current role does not have access to this operation", which is
  // the page a reader with nothing in progress used to land on from here. With
  // no enrolment known at all, the profile page is the one OJS page every
  // signed-in account can open.
  const ojsHome = roleJournals[0] ? ojsDashboardUrl(roleJournals[0]) : ojsProfileUrlRelative
  const ojsHref = ojsHandoffUrl(cur?.ojsUrl ?? (cur?.journalSlug ? ojsDashboardUrl(cur.journalSlug) : ojsHome))

  const actions: ActionDef[] = !cur
    ? []
    : cur.status === 'Revisions requested'
        ? [
            { label: 'Submit revision in the editorial system', href: ojsHref, external: true, primary: true },
            { label: 'Message editorial office', href: '/contact' },
          ]
        : cur.status === 'Published'
          ? [
              ...(cur.publishedUrl
                ? [{ label: 'View published article', href: cur.publishedUrl, external: true, primary: true }]
                : []),
              { label: 'Open in the editorial system', href: ojsHref, external: true },
            ]
          : cur.status === 'Rejected'
            ? [
                // The letter itself lives in OJS; there is no API for it.
                { label: 'Read the decision in the editorial system', href: ojsHref, external: true, primary: true },
                { label: 'Message editorial office', href: '/contact' },
              ]
            : [
                { label: 'Open in the editorial system', href: ojsHref, external: true, primary: true },
                { label: 'Message editorial office', href: '/contact' },
              ]

  const actionStyle = (primary?: boolean): React.CSSProperties => ({
    fontSize: 13,
    fontWeight: 500,
    padding: '7px 12px',
    borderRadius: 3,
    textDecoration: 'none',
    background: primary ? 'var(--accent,#1D5DA8)' : 'var(--surface,#fff)',
    color: primary ? '#fff' : 'var(--ink,#101B27)',
    border: `1px solid ${primary ? 'var(--accent,#1D5DA8)' : 'var(--line-strong,#B9C1C9)'}`,
  })

  const toggleAvail = () => {
    const next = !avail
    setAvail(next)
    if (!user) return
    const base = prefsRef.current ?? {}
    const body = { ...base, availableToReview: next }
    prefsRef.current = body
    fetch('/api/profile/prefs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => {})
  }

  // Shown only to accounts OJS reports an editorial role for. An author
  // seeing an empty "As editor" tab would be reading it as a permission they
  // do not have.
  const editorial = hasEditorialRole(user?.roles)

  // OJS refuses the submission wizard and the author dashboard to an account
  // that holds no Author role, with a bare "The current role does not have
  // access to this operation" page. On this install author self-registration
  // is off in every journal, so a newly registered member is a reader only —
  // and would otherwise be handed from here straight to that page. Tell them
  // instead. Editorial roles already carry the access.
  const canAuthor = editorial || (user?.roles ?? []).includes('author')

  const roleTabs = (
    [
      ['author', 'As author', subs.length],
      // No count: OJS exposes no reviewer resource, so the portal cannot know
      // how many invitations there are. A "0" would be a claim, not a fact.
      ['reviewer', 'As reviewer', null],
      ...(editorial ? ([['editorial', 'As editor', null]] as const) : []),
    ] as const
  ).map(([k, label, n]) => ({
    k,
    label,
    n,
    sel: tab === k,
    weight: tab === k ? 600 : 500,
    bar: tab === k ? 'var(--accent,#1D5DA8)' : 'transparent',
  }))

  const filters = (
    [
      ['all', 'All'],
      ['action', 'Needs your action'],
      ['progress', 'In progress'],
      ['closed', 'Completed'],
    ] as const
  ).map(([k, label]) => {
    const a = filter === k
    return {
      k,
      label,
      n: subs.filter(GROUPS[k]).length,
      pressed: a,
      bg: a ? 'var(--accent-soft,#E8F0FA)' : 'var(--surface,#fff)',
      fg: a ? 'var(--accent-dark,#174C8A)' : 'var(--ink-2,#1F2A36)',
      border: a ? 'var(--accent,#1D5DA8)' : 'var(--line,#DCE1E6)',
    }
  })

  const fade = (flipA ? 'ngiqFadeA' : 'ngiqFadeB') + ' .4s ease both'
  const grow = (flipA ? 'ngiqGrowA' : 'ngiqGrowB') + ' .35s ease both'

  return (
    <div style={{ background: 'var(--page-2, var(--surface-2, #F5F6F7))', paddingBottom: 48 }}>
      <style>{`@keyframes ngiqFadeA{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}@keyframes ngiqFadeB{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}@keyframes ngiqGrowA{from{transform:scaleY(0)}to{transform:scaleY(1)}}@keyframes ngiqGrowB{from{transform:scaleY(0)}to{transform:scaleY(1)}}body{margin:0;background:var(--page-2,var(--surface-2,#F5F6F7)) !important;color:var(--ink-2,#1F2A36);font-family:var(--font-sans);-webkit-font-smoothing:antialiased}tr.dbRow{background:var(--rb,var(--surface,#fff))}tr.dbRow:hover{background:var(--surface-3,#FAFBFB)}@media (prefers-reduced-motion:reduce){.dbAnim{animation:none !important}}`}</style>
      <main id="main-content" style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 32px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {user ? (
              <span style={{ fontSize: 13, color: 'var(--muted,#505C68)' }}>
                Signed in as {user.fullName}
                {user.orcid ? ` · ORCID ${user.orcid.replace(/^https?:\/\/orcid\.org\//, '')}` : ''}
              </span>
            ) : null}
            <h1 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 600, color: 'var(--ink,#101B27)' }}>
              My submissions
            </h1>
          </div>
          <Link
            href="/submit"
            style={{
              background: 'var(--accent,#1D5DA8)',
              color: '#fff',
              padding: '10px 18px',
              borderRadius: 3,
              fontSize: 14,
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            New submission
          </Link>
        </div>

        {!loading && !user ? (
          <div
            style={{
              marginTop: 24,
              background: 'var(--surface,#fff)',
              border: '1px solid var(--line,#DCE1E6)',
              borderRadius: 3,
              padding: '28px 32px',
              maxWidth: 560,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, color: 'var(--ink,#101B27)' }}>
              Sign in to see your submissions
            </h2>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)' }}>
              Your drafts, submissions and review invitations are tied to your NextGenIQ Press account.
            </p>
            <div>
              <Link
                href="/sign-in?next=/dashboard"
                style={{
                  display: 'inline-block',
                  background: 'var(--accent,#1D5DA8)',
                  color: '#fff',
                  padding: '10px 18px',
                  borderRadius: 3,
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                Sign in
              </Link>
            </div>
          </div>
        ) : null}

        {!loading && user ? (
          <>
            {justSubmitted ? (
              <div
                role="status"
                style={{
                  marginTop: 18,
                  border: '1px solid #B9DCC4',
                  background: '#E7F3EB',
                  color: '#1E6B3A',
                  borderRadius: 3,
                  padding: '12px 16px',
                  fontSize: 14,
                }}
              >
                Submission {bannerRef} received. A receipt has been emailed to you and your co-authors.
              </div>
            ) : null}
            {roleNeeded ? (
              <div
                role="alert"
                style={{
                  marginTop: 18,
                  border: '1px solid #F0D9A8',
                  background: '#FFF7E6',
                  color: '#6B4A00',
                  borderRadius: 3,
                  padding: '12px 16px',
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              >
                {roleNeeded === 'author' ? (
                  <>
                    Your account is registered with{' '}
                    {journals.find((j) => j.slug === roleNeededJournal)?.title ?? 'that journal'} as a reader, so the
                    editorial system will not accept a submission from it yet. Ask the{' '}
                    <Link href="/contact">editorial office</Link> to add the Author role to your account; once that is
                    done, <Link href="/submit">start the submission</Link> again and it will open in the editorial
                    system straight away.
                  </>
                ) : roleNeeded === 'reviewer' ? (
                  <>
                    Your account does not hold the Reviewer role with{' '}
                    {journals.find((j) => j.slug === roleNeededJournal)?.title ?? 'that journal'}, so the editorial
                    system has no review queue to show you. Review invitations arrive by email from the editorial
                    office.
                  </>
                ) : (
                  <>
                    That page of the editorial system is for editors of{' '}
                    {journals.find((j) => j.slug === roleNeededJournal)?.title ?? 'that journal'}. Your account does
                    not hold an editorial role there.
                  </>
                )}
              </div>
            ) : null}
            <div role="tablist" style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--line,#DCE1E6)', marginTop: 20 }}>
              {roleTabs.map((t) => (
                <button
                  key={t.k}
                  role="tab"
                  aria-selected={t.sel}
                  onClick={() => setTab(t.k)}
                  style={{
                    border: 0,
                    background: 'transparent',
                    padding: '10px 14px 9px',
                    font: 'inherit',
                    fontSize: 14,
                    cursor: 'pointer',
                    color: 'var(--ink,#101B27)',
                    fontWeight: t.weight,
                    borderBottom: `3px solid ${t.bar}`,
                  }}
                >
                  {t.label}
                  {t.n !== null ? (
                    <span style={{ color: 'var(--muted,#505C68)', fontWeight: 400 }}> ({t.n})</span>
                  ) : null}
                </button>
              ))}
            </div>

            {tab === 'author' ? (
              <>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '16px 0' }}>
                  {filters.map((fl) => (
                    <button
                      key={fl.k}
                      onClick={() => setFilter(fl.k)}
                      aria-pressed={fl.pressed}
                      style={{
                        padding: '5px 11px',
                        borderRadius: 2,
                        font: 'inherit',
                        fontSize: 13,
                        cursor: 'pointer',
                        border: `1px solid ${fl.border}`,
                        background: fl.bg,
                        color: fl.fg,
                      }}
                    >
                      {fl.label} · {fl.n}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.35fr) minmax(0,1fr)', gap: 24, alignItems: 'start' }}>
                  <div style={{ background: 'var(--surface,#fff)', border: '1px solid var(--line,#DCE1E6)', borderRadius: 3, overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 620 }}>
                      <thead>
                        <tr style={{ background: 'var(--surface-3,#FAFBFB)' }}>
                          {['Manuscript', 'Status', 'Updated'].map((h) => (
                            <th
                              key={h}
                              scope="col"
                              style={{
                                textAlign: 'left',
                                padding: '10px 14px',
                                fontSize: 12,
                                color: 'var(--muted,#505C68)',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '.04em',
                                borderBottom: '1px solid var(--line,#DCE1E6)',
                              }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {list.map((r) => {
                          const [chipBg, chipFg, chipBorder] = S[r.status]
                          const isSel = panel.sel ? r.id === panel.sel : r.id === cur?.id
                          return (
                            <tr
                              key={r.id}
                              className="dbRow"
                              onClick={() => select(r.id)}
                              style={
                                {
                                  cursor: 'pointer',
                                  '--rb': isSel ? 'var(--accent-tint,#F5F8FC)' : 'var(--surface,#fff)',
                                } as React.CSSProperties
                              }
                            >
                              <td
                                style={{
                                  padding: 14,
                                  borderBottom: '1px solid var(--line-soft,#EEF1F4)',
                                  borderLeft: `3px solid ${isSel ? 'var(--accent,#1D5DA8)' : 'transparent'}`,
                                }}
                              >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted,#505C68)' }}>
                                    {r.id} · {r.code}
                                  </span>
                                  <button
                                    onClick={() => select(r.id)}
                                    style={{
                                      border: 0,
                                      background: 'none',
                                      padding: 0,
                                      textAlign: 'left',
                                      font: 'inherit',
                                      fontFamily: 'var(--font-serif)',
                                      fontSize: 16,
                                      fontWeight: 600,
                                      color: 'var(--ink,#101B27)',
                                      lineHeight: 1.35,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    {r.title}
                                  </button>
                                  <span style={{ fontSize: 12, color: 'var(--muted,#505C68)' }}>
                                    {r.type} · Submitted {r.submitted}
                                  </span>
                                </div>
                              </td>
                              <td style={{ padding: 14, borderBottom: '1px solid var(--line-soft,#EEF1F4)', verticalAlign: 'top' }}>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    fontSize: 12,
                                    fontWeight: 500,
                                    padding: '2px 8px',
                                    borderRadius: 2,
                                    whiteSpace: 'nowrap',
                                    background: chipBg,
                                    color: chipFg,
                                    border: `1px solid ${chipBorder}`,
                                  }}
                                >
                                  {r.status}
                                </span>
                                {r.action ? <div style={{ fontSize: 12, color: '#8A5300', marginTop: 6 }}>{r.action}</div> : null}
                              </td>
                              <td
                                style={{
                                  padding: 14,
                                  borderBottom: '1px solid var(--line-soft,#EEF1F4)',
                                  verticalAlign: 'top',
                                  fontSize: 13,
                                  color: 'var(--ink-3,#3C4854)',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {r.updated}
                              </td>
                            </tr>
                          )
                        })}
                        {list.length === 0 ? (
                          <tr>
                            <td colSpan={3} style={{ padding: '18px 14px', fontSize: 14, color: 'var(--muted,#505C68)', lineHeight: 1.6 }}>
                              {canAuthor ? (
                                <>
                                  Nothing in progress. <Link href="/submit">Start a submission</Link>, or{' '}
                                  <a href={ojsHandoffUrl(ojsHome)}>check submissions already with the editorial system</a>.
                                </>
                              ) : (
                                <>
                                  Your account is registered as a reader, so the editorial system will not yet accept a
                                  submission from it. Ask the <Link href="/contact">editorial office</Link> to add the
                                  Author role for the journal you want to submit to; once that is done, submissions start
                                  from <Link href="/submit">here</Link>.
                                </>
                              )}
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>

                  {cur ? (
                    <aside
                      aria-label="Submission detail"
                      className="dbAnim"
                      style={{
                        animation: fade,
                        background: 'var(--surface,#fff)',
                        border: '1px solid var(--line,#DCE1E6)',
                        borderRadius: 3,
                        position: 'sticky',
                        top: 16,
                      }}
                    >
                      <div
                        style={{
                          padding: '18px 20px',
                          borderBottom: '1px solid var(--line,#DCE1E6)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                        }}
                      >
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted,#505C68)' }}>{cur.id}</span>
                        <h2
                          style={{
                            margin: 0,
                            fontFamily: 'var(--font-serif)',
                            fontSize: 19,
                            fontWeight: 600,
                            color: 'var(--ink,#101B27)',
                            lineHeight: 1.35,
                          }}
                        >
                          {cur.title}
                        </h2>
                        <span style={{ fontSize: 13, color: 'var(--ink-3,#3C4854)' }}>
                          {cur.jTitle} · {cur.type}
                        </span>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                          {actions.map((ac) =>
                            ac.onClick ? (
                              <button
                                key={ac.label}
                                onClick={ac.onClick}
                                style={{ ...actionStyle(ac.primary), font: 'inherit', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                              >
                                {ac.label}
                              </button>
                            ) : ac.external ? (
                              <a key={ac.label} href={ac.href} style={actionStyle(ac.primary)}>
                                {ac.label}
                              </a>
                            ) : (
                              <Link key={ac.label} href={ac.href ?? '/dashboard'} style={actionStyle(ac.primary)}>
                                {ac.label}
                              </Link>
                            ),
                          )}
                        </div>
                      </div>
                      {cur.letter ? (
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line,#DCE1E6)', background: '#FFFBF2' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Decision: {cur.letter.summary}</span>
                            <span style={{ fontSize: 12, color: 'var(--muted,#505C68)' }}>{formatDate(cur.letter.dateIso)}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--ink-2,#1F2A36)' }}>{cur.letter.body[0]}</p>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateRows: panel.letter ? '1fr' : '0fr',
                              transition: 'grid-template-rows .45s cubic-bezier(.2,.7,.2,1)',
                            }}
                          >
                            <div style={{ overflow: 'hidden' }}>
                              <div
                                style={{
                                  paddingTop: 10,
                                  fontSize: 13,
                                  lineHeight: 1.6,
                                  color: 'var(--ink-2,#1F2A36)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 8,
                                  opacity: panel.letter ? 1 : 0,
                                  transition: 'opacity .35s ease .1s',
                                }}
                              >
                                {cur.letter.reviews.map((rv) => (
                                  <p key={rv.reviewer} style={{ margin: 0 }}>
                                    <strong>{rv.reviewer}.</strong> {rv.comments.join(' ')}
                                  </p>
                                ))}
                                {cur.letter.body.slice(1).map((p) => (
                                  <p key={p} style={{ margin: 0 }}>
                                    {p}
                                  </p>
                                ))}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={toggleLetter}
                            aria-expanded={panel.letter}
                            style={{
                              border: 0,
                              background: 'none',
                              padding: 0,
                              marginTop: 8,
                              color: 'var(--accent,#1D5DA8)',
                              font: 'inherit',
                              fontSize: 13,
                              fontWeight: 500,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            {panel.letter
                              ? 'Hide full letter'
                              : `Read full letter and ${cur.letter.reviews.length} reviewer reports`}
                            <span
                              aria-hidden="true"
                              style={{
                                display: 'inline-block',
                                transition: 'transform .3s ease',
                                transform: panel.letter ? 'rotate(180deg)' : 'none',
                              }}
                            >
                              ▾
                            </span>
                          </button>
                        </div>
                      ) : null}
                      <div style={{ padding: '16px 20px' }}>
                        <h3
                          style={{
                            margin: '0 0 12px',
                            fontSize: 12,
                            letterSpacing: '.08em',
                            textTransform: 'uppercase',
                            color: 'var(--muted,#505C68)',
                          }}
                        >
                          Status history
                        </h3>
                        <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                          {timeline.map((t, i) => (
                            <li
                              key={`${cur.id}-${t.h}-${i}`}
                              className="dbAnim"
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '18px minmax(0,1fr)',
                                gap: 12,
                                animation: fade,
                                animationDelay: `${120 + i * 90}ms`,
                              }}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span
                                  style={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: '50%',
                                    marginTop: 3,
                                    background: t.dot,
                                    border: `2px solid ${t.ring}`,
                                    boxSizing: 'border-box',
                                  }}
                                ></span>
                                <span
                                  className="dbAnim"
                                  style={{
                                    flex: 1,
                                    width: 1,
                                    background: t.line,
                                    minHeight: 18,
                                    transformOrigin: 'top',
                                    animation: grow,
                                    animationDelay: `${200 + i * 90}ms`,
                                  }}
                                ></span>
                              </div>
                              <div style={{ paddingBottom: 14, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <span style={{ fontSize: 14, fontWeight: t.weight, color: t.fg }}>{t.h}</span>
                                <span style={{ fontSize: 12, color: 'var(--muted,#505C68)' }}>{t.d}</span>
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>
                      <div
                        style={{
                          padding: '14px 20px',
                          borderTop: '1px solid var(--line,#DCE1E6)',
                          fontSize: 13,
                          color: 'var(--ink-3,#3C4854)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            letterSpacing: '.08em',
                            textTransform: 'uppercase',
                            color: 'var(--muted,#505C68)',
                            fontWeight: 600,
                          }}
                        >
                          Co-authors
                        </span>
                        <span>{cur.co}</span>
                      </div>
                    </aside>
                  ) : null}
                </div>
              </>
            ) : null}

            {tab === 'reviewer' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 20, maxWidth: 900 }}>
                  {/*
                    Peer review runs in OJS and works. What OJS 3.5 does not
                    expose is a reviewer REST resource, so there is nothing for
                    the portal to read review state from — not a gap that
                    sign-in or Phase 4 closes. This panel is the permanent
                    answer, not a placeholder. See docs/OJS-INTEGRATION.md.
                  */}
                  <div
                    style={{
                      background: 'var(--surface,#fff)',
                      border: '1px solid var(--line,#DCE1E6)',
                      borderRadius: 3,
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 600, color: 'var(--ink,#101B27)' }}>
                      Reviewing happens in the editorial system
                    </span>
                    <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-3,#3C4854)', lineHeight: 1.55 }}>
                      Invitations, manuscripts and review forms are all held there. Open the reviewer workspace for the
                      journal that invited you — the invitation email links straight to it.
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
                      {journals.map((j) => (
                        <a
                          key={j.slug}
                          href={ojsHandoffUrl(ojsReviewUrl(j.slug))}
                          title={j.title}
                          style={{
                            border: '1px solid var(--line-strong,#B9C1C9)',
                            background: 'var(--surface,#fff)',
                            borderRadius: 3,
                            padding: '6px 11px',
                            fontSize: 13,
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--ink,#101B27)',
                            textDecoration: 'none',
                          }}
                        >
                          {j.code}
                        </a>
                      ))}
                    </div>
                  </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'var(--surface,#fff)',
                    border: '1px solid var(--line,#DCE1E6)',
                    borderRadius: 3,
                    padding: '14px 20px',
                    fontSize: 14,
                  }}
                >
                  <span>Available for new review invitations</span>
                  <button
                    role="switch"
                    aria-checked={avail}
                    onClick={toggleAvail}
                    style={{
                      width: 40,
                      height: 22,
                      borderRadius: 11,
                      border: 0,
                      cursor: 'pointer',
                      position: 'relative',
                      background: avail ? 'var(--accent,#1D5DA8)' : 'var(--line-strong,#B9C1C9)',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: 3,
                        left: avail ? '21px' : '3px',
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: 'var(--surface,#fff)',
                      }}
                    ></span>
                  </button>
                </div>
              </div>
            ) : null}

            {tab === 'editorial' && editorial ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 20, maxWidth: 900 }}>
                {/*
                  Links out for the same reason the reviewer tab does: OJS 3.5
                  exposes no editorial resource, so there is nothing for the
                  portal to read a queue from. Assigning reviewers, recording
                  decisions and moving a manuscript between stages all happen
                  in OJS, and a portal screen that could only link to them
                  would add a step without adding information.

                  One list per journal, because OJS grants editorial roles per
                  journal while the session carries a flat set of role names —
                  it says this account edits *somewhere*, not where. Rather
                  than guess a journal and land an editor on a permission
                  error, the choice is theirs. Each link rides the sign-on
                  hand-off, so the queue opens already authenticated.
                */}
                <div
                  style={{
                    background: 'var(--surface,#fff)',
                    border: '1px solid var(--line,#DCE1E6)',
                    borderRadius: 3,
                    padding: '20px 22px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 600, color: 'var(--ink,#101B27)' }}>
                    Editorial work happens in the editorial system
                  </span>
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-3,#3C4854)', lineHeight: 1.55 }}>
                    Submission queues, reviewer assignment, decisions and production are all held there. Open the
                    editorial queue for the journal you work on — you will arrive already signed in.
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
                    {journals.map((j) => (
                      <a
                        key={j.slug}
                        href={ojsHandoffUrl(ojsEditorialUrl(j.slug))}
                        title={j.title}
                        style={{
                          border: '1px solid var(--line-strong,#B9C1C9)',
                          background: 'var(--surface,#fff)',
                          borderRadius: 3,
                          padding: '6px 11px',
                          fontSize: 13,
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--ink,#101B27)',
                          textDecoration: 'none',
                        }}
                      >
                        {j.code}
                      </a>
                    ))}
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted,#505C68)', lineHeight: 1.5 }}>
                    A journal you hold no role on will refuse the queue — that is OJS enforcing its own permissions,
                    not an error here.
                  </p>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </main>
    </div>
  )
}
