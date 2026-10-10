'use client'

/**
 * Submission wizard — verbatim replication of Submit.dc.html (docs/REPLICATION.md).
 * Markup and inline styles are the mockup's; the step/validation logic reuses
 * src/components/submit/{types,validation}.ts so the rules match the API.
 *
 * Files are handled honestly inside the mockup's visuals: the rows and progress
 * bars render exactly as the mockup draws them, but only a metadata manifest is
 * kept — no bytes leave the browser, and the copy on the step says the files
 * are attached in the editorial system at final submission.
 */

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from '@/components/auth/SessionProvider'
import { deadlineState, formatFileSize, wordCount } from '@/lib/format'
import {
  FILE_KINDS,
  REQUIREMENTS,
  articleTypeSpec,
  emptyDraft,
  mergeDraft,
  newAuthor,
  type ArticleTypeName,
  type CallOption,
  type DraftAuthor,
  type DraftFile,
  type DraftFileKind,
  type DraftPayload,
  type DraftState,
  type JournalOption,
} from '@/components/submit/types'
import { ORCID_MESSAGES, authorField, errorMap, orcidState, validateStep } from '@/components/submit/validation'
import { ojsSubmitUrl } from '@/lib/ojs/config'

type Props = { journals: JournalOption[]; calls: CallOption[]; subjects: string[] }

type RorItem = { id: string; name: string; country: string }

type ApiDraft = {
  id: number
  journalSlug: string | null
  currentStep: number
  payload: unknown
  files: unknown
  updatedAt: string
}

type DoneState = { mode: 'api'; reference: string } | { mode: 'handoff'; continueUrl: string }

const LABELS = ['Journal and section', 'Requirements', 'Metadata', 'Authors', 'Files', 'Declarations', 'Review and submit']

const STEP_TITLES = [
  'Choose journal and article type',
  'Confirm submission requirements',
  'Title, abstract and keywords',
  'Authors and affiliations',
  'Upload files',
  'Declarations',
  'Review and submit',
]

/* Article-type cards, verbatim from the mockup's typeMeta (matches ARTICLE_TYPES). */
const TYPE_META: Record<ArticleTypeName, string> = {
  'Research Article': '8,000 words · structured abstract 250 words',
  Review: '10,000 words · abstract 250 words',
  'Short Communication': '3,000 words · abstract 150 words',
  'Case Study': '5,000 words · abstract 200 words',
  Perspective: '3,000 words · abstract 150 words',
}

/* The ten CRediT toggles exactly as the mockup draws them. */
const ROLES = [
  'Conceptualisation',
  'Methodology',
  'Software',
  'Formal analysis',
  'Investigation',
  'Data curation',
  'Writing – original draft',
  'Writing – review & editing',
  'Supervision',
  'Funding acquisition',
]

const AI_OPTS: { value: DraftPayload['generativeAi']; label: string }[] = [
  { value: 'none', label: 'No generative AI tools were used' },
  { value: 'language', label: 'Used for language editing only' },
  { value: 'content', label: 'Used for content, analysis or images (describe in the manuscript)' },
]

const kindGuess = (n: string): DraftFileKind | '' =>
  /title/i.test(n)
    ? 'Title page'
    : /cover/i.test(n)
      ? 'Cover letter'
      : /\.(png|tiff?|eps|jpe?g)$/i.test(n)
        ? 'Figure'
        : /\.(csv|xlsx)$/i.test(n)
          ? 'Table'
          : ''

const clampStep = (n: number) => Math.min(7, Math.max(1, Number.isFinite(n) ? n : 1))

const LINE = 'var(--line-strong,#B9C1C9)'

export function SubmitWizard({ journals, calls, subjects }: Props) {
  const sp = useSearchParams()
  const { user } = useSession()

  const jParam = sp.get('journal')
  const initialJournal = journals.some((j) => j.slug === jParam) ? (jParam as string) : (journals[0]?.slug ?? 'ijdh')
  const initialStep = clampStep(parseInt(sp.get('step') || '1', 10))

  const [step, setStepState] = useState(initialStep)
  const [dir, setDir] = useState(1)
  const [visited, setVisited] = useState<Record<number, boolean>>({ 1: true, [initialStep]: true })
  const [tried, setTried] = useState<Record<number, boolean>>({})
  const [draft, setDraft] = useState<DraftPayload>(() => emptyDraft(initialJournal))
  const [files, setFiles] = useState<DraftFile[]>([])
  const [pcts, setPcts] = useState<Record<string, number>>({})
  const [kwDraft, setKwDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState('All changes saved')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<DoneState | null>(null)
  const [drag, setDrag] = useState(false)
  const [draftId, setDraftId] = useState<number | null>(null)
  const [submitNote, setSubmitNote] = useState<'error' | null>(null)
  const [rorSuggest, setRorSuggest] = useState<Record<string, RorItem[]>>({})

  const uid = useRef(1)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rorTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const resumeTried = useRef(false)

  /**
   * Latest wizard state for the debounced autosave closure, which must not
   * capture a stale draft. Updated in an effect rather than during render:
   * writing a ref while rendering breaks under concurrent rendering, and the
   * save is 700ms-debounced so effects have always flushed before it fires.
   */
  const stateRef = useRef({ draft, files, step, draftId, user })
  useEffect(() => {
    stateRef.current = { draft, files, step, draftId, user }
  })

  /* ----------------------------- autosave ------------------------------- */

  async function persist(): Promise<number | null> {
    const s = stateRef.current
    if (!s.user) {
      setSaving(false)
      return null
    }
    try {
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: s.draftId ?? undefined,
          journalSlug: s.draft.journalSlug || null,
          currentStep: s.step,
          payload: s.draft,
          files: s.files,
        }),
      })
      const data = (await res.json()) as { ok?: boolean; id?: number }
      setSaving(false)
      if (res.ok && data.id) {
        if (!s.draftId) setDraftId(data.id)
        setSavedAt('All changes saved')
        return data.id
      }
      setSavedAt('Could not save — will retry on the next change')
      return s.draftId
    } catch {
      setSaving(false)
      setSavedAt('Could not save — will retry on the next change')
      return stateRef.current.draftId
    }
  }

  function scheduleSave() {
    if (!stateRef.current.user) return
    setSaving(true)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => void persist(), 700)
  }

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    },
    [],
  )

  /* -------------------------- resume via ?draft= ------------------------- */

  useEffect(() => {
    const dParam = sp.get('draft')
    if (!dParam || !user || resumeTried.current) return
    resumeTried.current = true
    void (async () => {
      try {
        const res = await fetch('/api/drafts', { cache: 'no-store' })
        const data = (await res.json()) as { ok?: boolean; drafts?: ApiDraft[] }
        const found = (data.drafts ?? []).find((d) => String(d.id) === dParam)
        if (!found) return
        setDraftId(found.id)
        setDraft(mergeDraft(found.payload, found.journalSlug ?? initialJournal))
        const stored = Array.isArray(found.files) ? (found.files as Partial<DraftFile>[]) : []
        setFiles(
          stored
            .filter((f) => f && typeof f.name === 'string')
            .map((f, i) => ({
              id: typeof f.id === 'string' ? f.id : `f${i + 1}`,
              name: String(f.name),
              size: Number(f.size ?? 0),
              kind: (FILE_KINDS as readonly string[]).includes(String(f.kind)) ? (f.kind as DraftFileKind) : '',
            })),
        )
        if (!sp.get('step')) {
          const n = clampStep(found.currentStep)
          setStepState(n)
          setVisited((v) => ({ ...v, [n]: true }))
        }
        setSavedAt('All changes saved')
      } catch {
        /* resume is best-effort; the author can keep working on a fresh draft */
      }
    })()
  }, [sp, user, initialJournal])

  /* ------------------------------ mutators ------------------------------- */

  const touchDraft = (patch: Partial<DraftPayload> | ((d: DraftPayload) => Partial<DraftPayload>)) => {
    setDraft((d) => ({ ...d, ...(typeof patch === 'function' ? patch(d) : patch) }))
    scheduleSave()
  }
  const setF = <K extends keyof DraftPayload>(k: K, v: DraftPayload[K]) =>
    touchDraft({ [k]: v } as unknown as Partial<DraftPayload>)
  const setAuthor = (id: string, patch: Partial<DraftAuthor>) =>
    touchDraft((d) => ({ authors: d.authors.map((a) => (a.id === id ? { ...a, ...patch } : a)) }))
  const touchFiles = (fn: (f: DraftFile[]) => DraftFile[]) => {
    setFiles(fn)
    scheduleSave()
  }

  const go = (n: number) => {
    setDir(n < step ? -1 : 1)
    setStepState(n)
    setVisited((v) => ({ ...v, [n]: true }))
    scheduleSave()
    window.scrollTo(0, 0)
  }

  /* ------------------------------- files --------------------------------- */

  const animate = (id: string) => {
    let pct = 0
    const tick = () => {
      pct = Math.min(100, pct + 20)
      setPcts((p) => ({ ...p, [id]: pct }))
      if (pct < 100) setTimeout(tick, 250)
    }
    setTimeout(tick, 250)
  }

  const addFiles = (list: File[]) => {
    if (!list.length) return
    const items: DraftFile[] = list.map((f) => ({ id: `f${Date.now()}-${uid.current++}`, name: f.name, size: f.size, kind: kindGuess(f.name) }))
    touchFiles((fs) => fs.concat(items))
    setPcts((p) => ({ ...p, ...Object.fromEntries(items.map((i) => [i.id, 0])) }))
    items.forEach((i) => animate(i.id))
  }

  /* -------------------------------- ROR ---------------------------------- */

  const queryRor = (authorId: string, q: string) => {
    if (rorTimers.current[authorId]) clearTimeout(rorTimers.current[authorId])
    if (q.trim().length < 3) {
      setRorSuggest((s) => ({ ...s, [authorId]: [] }))
      return
    }
    rorTimers.current[authorId] = setTimeout(async () => {
      try {
        const res = await fetch(`/api/ror?q=${encodeURIComponent(q.trim())}`)
        const data = (await res.json()) as { items?: RorItem[] }
        setRorSuggest((s) => ({ ...s, [authorId]: data.items ?? [] }))
      } catch {
        /* matching is an aid, never a gate */
      }
    }, 350)
  }

  /* ------------------------------ validation ----------------------------- */

  const vstate: DraftState = { draft, files }
  const fieldErrs = tried[step] ? errorMap(validateStep(step, vstate)) : {}
  const errors = tried[step] ? validateStep(step, vstate).map((e) => e.message) : []
  const eb = (field: string) => (fieldErrs[field] ? '#A52A2A' : LINE)

  const steps = LABELS.map((label, i) => {
    const n = i + 1
    const cur = n === step
    const errs = validateStep(n, vstate)
    const wasVisited = visited[n] || tried[n]
    const ok = wasVisited && !errs.length && !cur
    const bad = Boolean(wasVisited && errs.length && !cur && tried[n])
    return {
      n,
      label,
      current: cur,
      bar: cur ? 'var(--accent,#1D5DA8)' : 'transparent',
      bg: cur ? 'var(--accent-tint,#F5F8FC)' : 'var(--surface,#fff)',
      weight: cur ? 600 : 500,
      anim: ok ? 'ngiqPop .45s cubic-bezier(.2,.8,.3,1.2) both' : 'none',
      mark: ok ? '✓' : bad ? '!' : String(n),
      dotBg: ok ? '#1E6B3A' : bad ? '#A52A2A' : cur ? 'var(--accent,#1D5DA8)' : 'var(--surface,#fff)',
      dotFg: ok || bad || cur ? '#fff' : 'var(--ink-3,#3C4854)',
      dotBorder: ok ? '#1E6B3A' : bad ? '#A52A2A' : cur ? 'var(--accent,#1D5DA8)' : 'var(--line-strong,#B9C1C9)',
      sub: ok ? 'Complete' : bad ? `${errs.length} to fix` : cur ? 'In progress' : wasVisited ? 'Incomplete' : 'Not started',
      subColor: bad ? '#A52A2A' : 'var(--muted,#505C68)',
    }
  })

  /* ------------------------------ submission ----------------------------- */

  const next = async () => {
    if (step === 7) {
      const all = [1, 2, 3, 4, 5, 6, 7].filter((n) => validateStep(n, vstate).length)
      if (all.length) {
        setTried((t) => {
          const nt = { ...t }
          all.forEach((n) => {
            nt[n] = true
          })
          return nt
        })
        if (all[0] !== 7) go(all[0])
        return
      }
      // Signed out, which is every author until the portal session lands: hand
      // straight off to the OJS wizard for the chosen journal. Prompting for
      // sign-in here would be a dead end — the portal cannot resolve a session
      // yet, so /sign-in links out to OJS and the author would arrive back
      // still anonymous, with no way through.
      if (!user) {
        setDone({ mode: 'handoff', continueUrl: ojsSubmitUrl(draft.journalSlug || 'index') })
        window.scrollTo(0, 0)
        return
      }
      setSubmitNote(null)
      setBusy(true)
      try {
        if (saveTimer.current) clearTimeout(saveTimer.current)
        const id = await persist()
        if (!id) throw new Error('save-failed')
        const res = await fetch('/api/drafts/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        })
        const data = (await res.json()) as {
          ok?: boolean
          mode?: 'api' | 'handoff'
          reference?: string
          continueUrl?: string
        }
        if (!res.ok || !data.mode) throw new Error('submit-failed')
        if (data.mode === 'api' && data.reference) setDone({ mode: 'api', reference: data.reference })
        else if (data.mode === 'handoff' && data.continueUrl) setDone({ mode: 'handoff', continueUrl: data.continueUrl })
        else throw new Error('submit-failed')
        window.scrollTo(0, 0)
      } catch {
        setSubmitNote('error')
        window.scrollTo(0, 0)
      } finally {
        setBusy(false)
      }
      return
    }
    const errs = validateStep(step, vstate)
    if (errs.length) {
      setTried((t) => ({ ...t, [step]: true }))
      window.scrollTo(0, 0)
      return
    }
    go(step + 1)
  }

  /* ------------------------------ derived -------------------------------- */

  const j = journals.find((x) => x.slug === draft.journalSlug)
  const jCode = j?.code ?? '—'
  const jTitle = j?.title ?? ''
  const jHref = `/journals/${draft.journalSlug}`
  const siOpts = calls.filter((c) => c.journalSlug === draft.journalSlug && deadlineState(c.deadlineIso) !== 'closed')
  const wc = wordCount(draft.abstract)
  const abstractCap = articleTypeSpec(draft.articleType).abstractWords
  const kk = files.map((x) => x.kind)
  const stepAnim = `${dir < 0 ? 'ngiqSlideBack' : 'ngiqSlideIn'} .38s cubic-bezier(.2,.7,.2,1) both`
  const saveDot = saving ? '#D9A441' : '#1E6B3A'
  const saveLabel = saving ? 'Saving…' : savedAt
  const draftLabel = draftId ? `NGIQ-D-${new Date().getUTCFullYear()}-${String(draftId).padStart(4, '0')}` : 'not yet saved'

  const review = (
    [
      [
        'Journal and section',
        1,
        [
          { k: 'Journal', v: jTitle || 'Not chosen' },
          { k: 'Article type', v: draft.articleType },
          { k: 'Special issue', v: calls.find((c) => c.id === draft.specialIssueId)?.theme ?? 'None' },
        ],
      ],
      ['Requirements', 2, [{ k: 'Checklist', v: `${draft.requirements.filter(Boolean).length} of ${draft.requirements.length} confirmed` }]],
      [
        'Metadata',
        3,
        [
          { k: 'Title', v: draft.title || 'Not provided' },
          { k: 'Abstract', v: `${wc} words` },
          { k: 'Keywords', v: draft.keywords.join(', ') || 'None' },
        ],
      ],
      [
        'Authors',
        4,
        [
          {
            k: 'Authors',
            v: draft.authors.map((a) => `${a.given} ${a.family}${a.corresponding ? ' (corresponding)' : ''}`.trim()).join(', ') || 'None',
          },
        ],
      ],
      ['Files', 5, [{ k: 'Files', v: `${files.length} files · ${files.map((x) => x.kind || 'untyped').join(', ') || 'none listed'}` }]],
      [
        'Declarations',
        6,
        [
          { k: 'Funding', v: draft.funding === 'yes' ? `${draft.funder}${draft.grant ? ` (${draft.grant})` : ''}` : 'None' },
          { k: 'Data', v: draft.dataAvailability || 'Not provided' },
          { k: 'Generative AI', v: draft.generativeAi === 'none' ? 'Not used' : draft.generativeAi ? 'Disclosed' : 'Not declared' },
        ],
      ],
    ] as [string, number, { k: string; v: string }[]][]
  ).map(([h, n, rows]) => {
    const bad = validateStep(n, vstate).length > 0
    return { h, n, rows, dot: bad ? '#A52A2A' : '#1E6B3A', mark: bad ? '!' : '✓' }
  })

  const nextSteps = [
    {
      h: 'Technical check',
      t: 'Within 3 working days',
      p: 'The Editorial Office checks completeness, formatting and similarity. If anything is missing, the submission is returned to you with instructions.',
      dot: 'var(--accent,#1D5DA8)',
    },
    { h: 'Editorial assessment', t: 'Within 7 days', p: 'An editor assesses scope and suitability for peer review.', dot: 'var(--line-strong,#B9C1C9)' },
    { h: 'Peer review', t: '4–6 weeks', p: 'At least two independent reviewers assess the anonymised manuscript.', dot: 'var(--line-strong,#B9C1C9)' },
    {
      h: 'First decision',
      t: 'Target 6 weeks from today',
      p: 'You will receive the decision and reviewer reports by email and in your dashboard.',
      dot: 'var(--line-strong,#B9C1C9)',
    },
  ]

  const pageStyle = (
    <style>{`@keyframes ngiqSlideBack{from{opacity:0;transform:translateX(-28px)}to{opacity:1;transform:none}}@keyframes ngiqSlideIn{from{opacity:0;transform:translateX(28px)}to{opacity:1;transform:none}}@keyframes ngiqPop{0%{transform:scale(.3)}60%{transform:scale(1.25)}100%{transform:scale(1)}}body{margin:0;background:var(--page-2,var(--surface-2,#F5F6F7)) !important;color:var(--ink-2,#1F2A36);font-family:var(--font-sans);-webkit-font-smoothing:antialiased}input,select,textarea{box-sizing:border-box}@media (prefers-reduced-motion:reduce){.swAnim{animation:none !important}}`}</style>
  )

  /* ---------------------------- success screen ---------------------------- */

  if (done) {
    return (
      <div style={{ background: 'var(--page-2, var(--surface-2, #F5F6F7))', paddingBottom: 64 }}>
        {pageStyle}
        <main id="main-content" style={{ maxWidth: 760, margin: '48px auto 0', padding: '0 32px' }}>
          <div style={{ background: 'var(--surface,#fff)', border: '1px solid var(--line,#DCE1E6)', borderRadius: 3, padding: '36px 40px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                fontWeight: 600,
                color: '#1E6B3A',
                background: '#E7F3EB',
                border: '1px solid #B9DCC4',
                padding: '4px 10px',
                borderRadius: 2,
              }}
            >
              {done.mode === 'api' ? '✓ Submission received' : '✓ Draft saved'}
            </span>
            <h1 style={{ margin: '16px 0 6px', fontFamily: 'var(--font-serif)', fontSize: 30, fontWeight: 600, color: 'var(--ink,#101B27)' }}>
              {done.mode === 'api' ? 'Thank you. Your manuscript has been submitted.' : 'One final step in the editorial system.'}
            </h1>
            {done.mode === 'api' ? (
              <p style={{ margin: 0, fontSize: 15, color: 'var(--ink-3,#3C4854)', lineHeight: 1.6 }}>
                Submission ID{' '}
                <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink,#101B27)' }}>{done.reference}</strong> · {jTitle}. A
                receipt has been sent to {user?.email ?? 'your email address'} and to all co-authors.
              </p>
            ) : (
              <p style={{ margin: 0, fontSize: 15, color: 'var(--ink-3,#3C4854)', lineHeight: 1.6 }}>
                Your draft for {jTitle} is saved. Continue in the editorial system to attach your files and confirm the submission —
                your answers carry over.
              </p>
            )}
            <h2
              style={{
                margin: '28px 0 12px',
                fontSize: 13,
                letterSpacing: '.08em',
                textTransform: 'uppercase',
                color: 'var(--ink,#101B27)',
              }}
            >
              What happens next
            </h2>
            <ol style={{ listStyle: 'none', margin: '0 0 0 8px', padding: 0, borderLeft: '2px solid var(--line,#DCE1E6)' }}>
              {nextSteps.map((n) => (
                <li key={n.h} style={{ position: 'relative', padding: '0 0 18px 22px' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: -7,
                      top: 3,
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: n.dot,
                      border: '2px solid #fff',
                    }}
                  ></span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink,#101B27)' }}>{n.h}</span>
                    <span style={{ fontSize: 13, color: 'var(--muted,#505C68)' }}>{n.t}</span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--ink-3,#3C4854)', lineHeight: 1.5 }}>{n.p}</p>
                </li>
              ))}
            </ol>
            <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
              {done.mode === 'api' ? (
                <Link
                  href={`/dashboard?submitted=${encodeURIComponent(done.reference)}`}
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
                  Go to My submissions
                </Link>
              ) : (
                <a
                  href={done.continueUrl}
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
                  Continue in the editorial system
                </a>
              )}
              {done.mode === 'handoff' ? (
                <Link
                  href="/dashboard"
                  style={{
                    border: '1px solid var(--line-strong,#B9C1C9)',
                    color: 'var(--ink,#101B27)',
                    padding: '9px 18px',
                    borderRadius: 3,
                    fontSize: 14,
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                >
                  Go to My submissions
                </Link>
              ) : null}
              <Link
                href={jHref}
                style={{
                  border: '1px solid var(--line-strong,#B9C1C9)',
                  color: 'var(--ink,#101B27)',
                  padding: '9px 18px',
                  borderRadius: 3,
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                Back to the journal
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  /* ------------------------------- wizard -------------------------------- */

  return (
    <div style={{ background: 'var(--page-2, var(--surface-2, #F5F6F7))', paddingBottom: 48 }}>
      {pageStyle}
      <div style={{ background: 'var(--surface,#fff)', borderBottom: '1px solid var(--line,#DCE1E6)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 260 }}>
            <span style={{ fontSize: 12, color: 'var(--muted,#505C68)' }}>
              New submission · <span style={{ fontFamily: 'var(--font-mono)' }}>{jCode}</span> · Draft {draftLabel}
            </span>
            <h1 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 600, color: 'var(--ink,#101B27)' }}>
              {STEP_TITLES[step - 1]}
            </h1>
          </div>
          {user ? (
            <span role="status" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted,#505C68)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: saveDot }}></span>
              {saveLabel}
            </span>
          ) : (
            <span role="status" style={{ fontSize: 13, color: 'var(--muted,#505C68)' }}>
              Drafts are not saved until you <Link href="/sign-in?next=/submit">sign in</Link>.
            </span>
          )}
          <Link
            href="/dashboard"
            style={{
              border: '1px solid var(--line-strong,#B9C1C9)',
              color: 'var(--ink,#101B27)',
              padding: '8px 14px',
              borderRadius: 3,
              fontSize: 13,
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            Save and exit
          </Link>
        </div>
      </div>
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '28px 32px 0',
          display: 'flex',
          gap: 32,
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}
      >
        <nav aria-label="Submission steps" style={{ width: 240, flexShrink: 0, position: 'sticky', top: 16 }}>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, background: 'var(--surface,#fff)', border: '1px solid var(--line,#DCE1E6)', borderRadius: 3 }}>
            {steps.map((s) => (
              <li key={s.n} style={{ borderBottom: '1px solid var(--line-soft,#EEF1F4)' }}>
                <button
                  onClick={() => go(s.n)}
                  aria-current={s.current ? 'step' : 'false'}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 14px',
                    border: 0,
                    borderLeft: `3px solid ${s.bar}`,
                    background: s.bg,
                    font: 'inherit',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <span
                    className="swAnim"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      flexShrink: 0,
                      animation: s.anim,
                      transition: 'background .3s ease,border-color .3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 600,
                      background: s.dotBg,
                      color: s.dotFg,
                      border: `1.5px solid ${s.dotBorder}`,
                    }}
                  >
                    {s.mark}
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <span style={{ fontSize: 14, fontWeight: s.weight, color: 'var(--ink,#101B27)' }}>{s.label}</span>
                    <span style={{ fontSize: 12, color: s.subColor }}>{s.sub}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
          {user ? (
            <p style={{ fontSize: 12, color: 'var(--muted,#505C68)', lineHeight: 1.5, margin: '12px 4px 0' }}>
              Your draft is saved after every change. You can leave and resume from <Link href="/dashboard">My submissions</Link>.
            </p>
          ) : (
            <p style={{ fontSize: 12, color: 'var(--muted,#505C68)', lineHeight: 1.5, margin: '12px 4px 0' }}>
              You can work through every step now, but saving and submitting need an account.{' '}
              <Link href="/sign-in?next=/submit">Sign in</Link> to keep your draft.
            </p>
          )}
        </nav>

        <main id="main-content" style={{ flex: 1, minWidth: 320, background: 'var(--surface,#fff)', border: '1px solid var(--line,#DCE1E6)', borderRadius: 3 }}>
          <div style={{ padding: '28px 32px' }}>
            {errors.length > 0 ? (
              <div
                role="alert"
                style={{
                  border: '1px solid #E3B3B3',
                  background: '#FBEAEA',
                  borderRadius: 3,
                  padding: '12px 16px',
                  marginBottom: 22,
                  fontSize: 14,
                  color: '#5C1414',
                  lineHeight: 1.5,
                }}
              >
                <strong>Complete the highlighted fields to continue.</strong>
                <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                  {errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {submitNote === 'error' ? (
              <div
                role="alert"
                style={{
                  border: '1px solid #E3B3B3',
                  background: '#FBEAEA',
                  borderRadius: 3,
                  padding: '12px 16px',
                  marginBottom: 22,
                  fontSize: 14,
                  color: '#5C1414',
                  lineHeight: 1.5,
                }}
              >
                Something went wrong while submitting. Your draft is saved — please try again, or contact the editorial office if it
                keeps happening.
              </div>
            ) : null}

            {step === 1 ? (
              <div className="swAnim" style={{ animation: stepAnim, display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 640 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label htmlFor="f-journal" style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink,#101B27)' }}>
                    Journal <span style={{ color: '#A52A2A' }}>*</span>
                  </label>
                  <select
                    id="f-journal"
                    value={draft.journalSlug}
                    onChange={(e) => touchDraft({ journalSlug: e.target.value, specialIssueId: '' })}
                    style={{
                      font: 'inherit',
                      fontSize: 14,
                      padding: '9px 12px',
                      border: '1px solid var(--line-strong,#B9C1C9)',
                      borderRadius: 3,
                      background: 'var(--surface,#fff)',
                    }}
                  >
                    {journals.map((jo) => (
                      <option key={jo.slug} value={jo.slug}>
                        {jo.title} ({jo.code})
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: 13, color: 'var(--muted,#505C68)' }}>
                    Pre-selected from the journal you came from. <Link href={`/journals/${draft.journalSlug}/aims-scope`}>Check aims and scope</Link>
                  </span>
                </div>
                <fieldset style={{ border: 0, margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <legend style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink,#101B27)', marginBottom: 6 }}>
                    Article type <span style={{ color: '#A52A2A' }}>*</span>
                  </legend>
                  {(Object.keys(TYPE_META) as ArticleTypeName[]).map((t) => {
                    const on = draft.articleType === t
                    return (
                      <label
                        key={t}
                        style={{
                          display: 'flex',
                          gap: 10,
                          alignItems: 'flex-start',
                          padding: '10px 12px',
                          border: `1px solid ${on ? 'var(--accent,#1D5DA8)' : 'var(--line,#DCE1E6)'}`,
                          background: on ? 'var(--accent-tint,#F5F8FC)' : 'var(--surface,#fff)',
                          borderRadius: 3,
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="radio"
                          name="atype"
                          checked={on}
                          onChange={() => setF('articleType', t)}
                          style={{ margin: '3px 0 0', accentColor: 'var(--accent,#1D5DA8)' }}
                        />
                        <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink,#101B27)' }}>{t}</span>
                          <span style={{ fontSize: 12, color: 'var(--muted,#505C68)' }}>{TYPE_META[t]}</span>
                        </span>
                      </label>
                    )
                  })}
                </fieldset>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label htmlFor="f-si" style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink,#101B27)' }}>
                    Special issue
                  </label>
                  <select
                    id="f-si"
                    value={draft.specialIssueId}
                    onChange={(e) => setF('specialIssueId', e.target.value)}
                    style={{
                      font: 'inherit',
                      fontSize: 14,
                      padding: '9px 12px',
                      border: '1px solid var(--line-strong,#B9C1C9)',
                      borderRadius: 3,
                      background: 'var(--surface,#fff)',
                    }}
                  >
                    <option value="">Not submitting to a special issue</option>
                    {siOpts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.theme}
                      </option>
                    ))}
                  </select>
                </div>
                <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, lineHeight: 1.5, color: 'var(--ink-2,#1F2A36)' }}>
                  <input
                    type="checkbox"
                    checked={draft.inScope}
                    onChange={() => setF('inScope', !draft.inScope)}
                    style={{ margin: '3px 0 0', width: 16, height: 16, accentColor: 'var(--accent,#1D5DA8)' }}
                  />
                  <span>
                    I confirm the manuscript falls within the journal’s aims and scope. <span style={{ color: '#A52A2A' }}>*</span>
                  </span>
                </label>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="swAnim" style={{ animation: stepAnim, maxWidth: 680 }}>
                <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--ink-3,#3C4854)', lineHeight: 1.55 }}>
                  All items are required. Each links to the policy that explains it.
                </p>
                {REQUIREMENTS.map((c, i) => (
                  <label
                    key={c.pageId + i}
                    style={{
                      display: 'flex',
                      gap: 12,
                      alignItems: 'flex-start',
                      padding: '12px 0',
                      borderBottom: '1px solid var(--line-soft,#EEF1F4)',
                      fontSize: 14,
                      lineHeight: 1.5,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={draft.requirements[i]}
                      onChange={() =>
                        setF(
                          'requirements',
                          draft.requirements.map((v, k) => (k === i ? !v : v)),
                        )
                      }
                      style={{ margin: '3px 0 0', width: 16, height: 16, accentColor: 'var(--accent,#1D5DA8)', flexShrink: 0 }}
                    />
                    <span style={{ flex: 1, color: 'var(--ink-2,#1F2A36)' }}>{c.text}</span>
                    <Link href={`/journals/${draft.journalSlug}/${c.pageId}`} style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
                      Policy
                    </Link>
                  </label>
                ))}
              </div>
            ) : null}

            {step === 3 ? (
              <div className="swAnim" style={{ animation: stepAnim, display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 720 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label htmlFor="f-title" style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink,#101B27)' }}>
                    Full title <span style={{ color: '#A52A2A' }}>*</span>
                  </label>
                  <textarea
                    id="f-title"
                    rows={2}
                    value={draft.title}
                    onChange={(e) => setF('title', e.target.value)}
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: 17,
                      padding: '10px 12px',
                      border: `1px solid ${eb('f-title')}`,
                      borderRadius: 3,
                      resize: 'vertical',
                      lineHeight: 1.4,
                    }}
                  ></textarea>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label htmlFor="f-rt" style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink,#101B27)' }}>
                    Running title
                  </label>
                  <input
                    id="f-rt"
                    value={draft.runningTitle}
                    onChange={(e) => setF('runningTitle', e.target.value)}
                    maxLength={70}
                    style={{ font: 'inherit', fontSize: 14, padding: '9px 12px', border: '1px solid var(--line-strong,#B9C1C9)', borderRadius: 3 }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--muted,#505C68)' }}>Up to 70 characters, shown in page headers.</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <label htmlFor="f-abs" style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink,#101B27)' }}>
                      Abstract <span style={{ color: '#A52A2A' }}>*</span>
                    </label>
                    <span
                      aria-live="polite"
                      style={{ fontSize: 12, color: wc > abstractCap ? '#A52A2A' : 'var(--muted,#505C68)', fontVariantNumeric: 'tabular-nums' }}
                    >
                      {wc} / {abstractCap} words
                    </span>
                  </div>
                  <textarea
                    id="f-abs"
                    rows={7}
                    value={draft.abstract}
                    onChange={(e) => setF('abstract', e.target.value)}
                    style={{
                      font: 'inherit',
                      fontSize: 14,
                      padding: '10px 12px',
                      border: `1px solid ${eb('f-abstract')}`,
                      borderRadius: 3,
                      resize: 'vertical',
                      lineHeight: 1.55,
                    }}
                  ></textarea>
                  <span style={{ fontSize: 12, color: 'var(--muted,#505C68)' }}>
                    Structured abstract for Research Articles: Background, Methods, Results, Conclusions.
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label htmlFor="f-kw" style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink,#101B27)' }}>
                    Keywords <span style={{ color: '#A52A2A' }}>*</span>
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 6,
                      padding: 6,
                      border: `1px solid ${eb('f-keywords')}`,
                      borderRadius: 3,
                      minHeight: 40,
                      alignItems: 'center',
                    }}
                  >
                    {draft.keywords.map((k) => (
                      <span
                        key={k}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '3px 4px 3px 9px',
                          background: 'var(--line-soft,#EEF1F4)',
                          borderRadius: 2,
                          fontSize: 13,
                        }}
                      >
                        {k}
                        <button
                          onClick={() =>
                            setF(
                              'keywords',
                              draft.keywords.filter((x) => x !== k),
                            )
                          }
                          aria-label={`Remove keyword ${k}`}
                          style={{
                            border: 0,
                            background: 'none',
                            cursor: 'pointer',
                            fontSize: 15,
                            lineHeight: 1,
                            color: 'var(--ink-3,#3C4854)',
                            padding: '0 4px',
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      id="f-kw"
                      value={kwDraft}
                      onChange={(e) => setKwDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.key === 'Enter' || e.key === ',') && kwDraft.trim()) {
                          e.preventDefault()
                          if (draft.keywords.length < 8 && !draft.keywords.includes(kwDraft.trim())) {
                            setF('keywords', draft.keywords.concat(kwDraft.trim()))
                          }
                          setKwDraft('')
                        } else if (e.key === 'Backspace' && !kwDraft && draft.keywords.length) {
                          setF('keywords', draft.keywords.slice(0, -1))
                        }
                      }}
                      placeholder="Type a keyword and press Enter"
                      style={{ flex: 1, minWidth: 180, border: 0, outline: 'none', font: 'inherit', fontSize: 14, padding: 4 }}
                    />
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--muted,#505C68)' }}>3–8 keywords · {draft.keywords.length} added</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Language</label>
                    <select
                      value="en"
                      onChange={() => {}}
                      style={{
                        font: 'inherit',
                        fontSize: 14,
                        padding: '9px 12px',
                        border: '1px solid var(--line-strong,#B9C1C9)',
                        borderRadius: 3,
                        background: 'var(--surface,#fff)',
                      }}
                    >
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Subject category</label>
                    <select
                      value={draft.subject}
                      onChange={(e) => setF('subject', e.target.value)}
                      style={{
                        font: 'inherit',
                        fontSize: 14,
                        padding: '9px 12px',
                        border: '1px solid var(--line-strong,#B9C1C9)',
                        borderRadius: 3,
                        background: 'var(--surface,#fff)',
                      }}
                    >
                      <option value="">Choose a subject category</option>
                      {subjects.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="swAnim" style={{ animation: stepAnim, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-3,#3C4854)', lineHeight: 1.5, maxWidth: '60ch' }}>
                    List authors in the order they should appear. Exactly one corresponding author is required; their ORCID iD is
                    mandatory.
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() =>
                        touchDraft((d) => {
                          if (!user) return { authors: d.authors.concat(newAuthor(`n${uid.current++}`)) }
                          if (d.authors.some((a) => a.email === user.email)) return {}
                          return {
                            authors: d.authors.concat({
                              ...newAuthor(`n${uid.current++}`),
                              given: user.givenName ?? user.fullName.split(/\s+/).slice(0, -1).join(' ') ?? user.fullName,
                              family: user.familyName ?? user.fullName.split(/\s+/).slice(-1)[0] ?? '',
                              email: user.email,
                              affiliation: user.affiliation ?? '',
                              orcid: (user.orcid ?? '').replace(/^https?:\/\/orcid\.org\//, ''),
                              corresponding: !d.authors.some((a) => a.corresponding),
                            }),
                          }
                        })
                      }
                      style={{
                        border: '1px solid var(--line-strong,#B9C1C9)',
                        background: 'var(--surface,#fff)',
                        borderRadius: 3,
                        padding: '8px 12px',
                        font: 'inherit',
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      Add me as author
                    </button>
                    <button
                      onClick={() => touchDraft((d) => ({ authors: d.authors.concat(newAuthor(`n${uid.current++}`)) }))}
                      style={{
                        border: 0,
                        background: 'var(--accent-dark,#0A685C)',
                        color: '#fff',
                        borderRadius: 3,
                        padding: '8px 14px',
                        font: 'inherit',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      + Add author
                    </button>
                  </div>
                </div>
                {draft.authors.map((a, i, arr) => {
                  const orcid = orcidState(a.orcid)
                  const orcidBad = orcid === 'malformed' || orcid === 'checksum'
                  const suggestions = a.rorId ? [] : (rorSuggest[a.id] ?? [])
                  return (
                    <fieldset
                      key={a.id}
                      style={{ border: `1px solid ${a.corresponding ? 'var(--accent,#1D5DA8)' : 'var(--line,#DCE1E6)'}`, borderRadius: 3, margin: 0, padding: 0 }}
                    >
                      <legend style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>Author {i + 1}</legend>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 14px',
                          background: 'var(--surface-3,#FAFBFB)',
                          borderBottom: '1px solid var(--line,#DCE1E6)',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted,#505C68)' }}>{i + 1}</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink,#101B27)', flex: 1 }}>
                          {`${a.given} ${a.family}`.trim() || 'New author'}
                        </span>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink-2,#1F2A36)', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="corr"
                            checked={a.corresponding}
                            onChange={() =>
                              touchDraft((d) => ({ authors: d.authors.map((x) => ({ ...x, corresponding: x.id === a.id })) }))
                            }
                            style={{ accentColor: 'var(--accent,#1D5DA8)' }}
                          />
                          Corresponding author
                        </label>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            onClick={() =>
                              i > 0 &&
                              touchDraft((d) => {
                                const l = d.authors.slice()
                                ;[l[i - 1], l[i]] = [l[i], l[i - 1]]
                                return { authors: l }
                              })
                            }
                            disabled={i === 0}
                            aria-label={`Move author ${i + 1} up`}
                            style={{
                              border: '1px solid var(--line,#DCE1E6)',
                              background: 'var(--surface,#fff)',
                              borderRadius: 2,
                              width: 28,
                              height: 28,
                              cursor: 'pointer',
                              color: 'var(--ink-3,#3C4854)',
                            }}
                          >
                            ↑
                          </button>
                          <button
                            onClick={() =>
                              i < arr.length - 1 &&
                              touchDraft((d) => {
                                const l = d.authors.slice()
                                ;[l[i + 1], l[i]] = [l[i], l[i + 1]]
                                return { authors: l }
                              })
                            }
                            disabled={i === arr.length - 1}
                            aria-label={`Move author ${i + 1} down`}
                            style={{
                              border: '1px solid var(--line,#DCE1E6)',
                              background: 'var(--surface,#fff)',
                              borderRadius: 2,
                              width: 28,
                              height: 28,
                              cursor: 'pointer',
                              color: 'var(--ink-3,#3C4854)',
                            }}
                          >
                            ↓
                          </button>
                          <button
                            onClick={() => touchDraft((d) => ({ authors: d.authors.filter((x) => x.id !== a.id) }))}
                            aria-label={`Remove author ${i + 1}`}
                            style={{
                              border: '1px solid var(--line,#DCE1E6)',
                              background: 'var(--surface,#fff)',
                              borderRadius: 2,
                              padding: '0 10px',
                              height: 28,
                              cursor: 'pointer',
                              color: '#A52A2A',
                              font: 'inherit',
                              fontSize: 12,
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <div style={{ padding: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '12px 16px' }}>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 500, color: 'var(--ink,#101B27)' }}>
                          Given name *
                          <input
                            value={a.given}
                            onChange={(e) => setAuthor(a.id, { given: e.target.value })}
                            style={{
                              font: 'inherit',
                              fontSize: 14,
                              fontWeight: 400,
                              padding: '8px 10px',
                              border: `1px solid ${eb(authorField(i, 'given'))}`,
                              borderRadius: 3,
                            }}
                          />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 500, color: 'var(--ink,#101B27)' }}>
                          Family name *
                          <input
                            value={a.family}
                            onChange={(e) => setAuthor(a.id, { family: e.target.value })}
                            style={{
                              font: 'inherit',
                              fontSize: 14,
                              fontWeight: 400,
                              padding: '8px 10px',
                              border: `1px solid ${eb(authorField(i, 'family'))}`,
                              borderRadius: 3,
                            }}
                          />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 500, color: 'var(--ink,#101B27)' }}>
                          Email *
                          <input
                            type="email"
                            value={a.email}
                            onChange={(e) => setAuthor(a.id, { email: e.target.value })}
                            style={{
                              font: 'inherit',
                              fontSize: 14,
                              fontWeight: 400,
                              padding: '8px 10px',
                              border: `1px solid ${eb(authorField(i, 'email'))}`,
                              borderRadius: 3,
                            }}
                          />
                        </label>
                        <label
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                            fontSize: 13,
                            fontWeight: 500,
                            color: 'var(--ink,#101B27)',
                            gridColumn: 'span 2',
                          }}
                        >
                          Affiliation *
                          <input
                            value={a.affiliation}
                            onChange={(e) => {
                              setAuthor(a.id, { affiliation: e.target.value, rorId: '' })
                              queryRor(a.id, e.target.value)
                            }}
                            placeholder="Start typing to search the ROR registry"
                            style={{
                              font: 'inherit',
                              fontSize: 14,
                              fontWeight: 400,
                              padding: '8px 10px',
                              border: `1px solid ${eb(authorField(i, 'affiliation'))}`,
                              borderRadius: 3,
                            }}
                          />
                          <span style={{ fontSize: 12, fontWeight: 400, color: a.rorId ? '#1E6B3A' : 'var(--muted,#505C68)' }}>
                            {a.rorId
                              ? `✓ Matched in ROR: ${a.affiliation}`
                              : a.affiliation
                                ? 'No ROR match selected — the affiliation will be saved as typed'
                                : 'Institution, city'}
                          </span>
                          {suggestions.length > 0 ? (
                            <span style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {suggestions.slice(0, 3).map((it) => (
                                <button
                                  key={it.id}
                                  type="button"
                                  onClick={() => {
                                    setAuthor(a.id, { affiliation: it.name, rorId: it.id, country: a.country || it.country })
                                    setRorSuggest((s) => ({ ...s, [a.id]: [] }))
                                  }}
                                  style={{
                                    border: '1px solid var(--line,#DCE1E6)',
                                    background: 'var(--surface-3,#FAFBFB)',
                                    borderRadius: 2,
                                    padding: '3px 8px',
                                    font: 'inherit',
                                    fontSize: 12,
                                    fontWeight: 400,
                                    cursor: 'pointer',
                                    color: 'var(--ink-2,#1F2A36)',
                                  }}
                                >
                                  {it.name}
                                  {it.country ? ` (${it.country})` : ''}
                                </button>
                              ))}
                            </span>
                          ) : null}
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 500, color: 'var(--ink,#101B27)' }}>
                          Country
                          <input
                            value={a.country}
                            onChange={(e) => setAuthor(a.id, { country: e.target.value })}
                            style={{
                              font: 'inherit',
                              fontSize: 14,
                              fontWeight: 400,
                              padding: '8px 10px',
                              border: '1px solid var(--line-strong,#B9C1C9)',
                              borderRadius: 3,
                            }}
                          />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 500, color: 'var(--ink,#101B27)' }}>
                          ORCID iD {a.corresponding ? '*' : '(optional)'}
                          <input
                            value={a.orcid}
                            onChange={(e) => setAuthor(a.id, { orcid: e.target.value.trim() })}
                            placeholder="0000-0000-0000-0000"
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 13,
                              padding: '8px 10px',
                              border: `1px solid ${orcidBad ? '#A52A2A' : eb(authorField(i, 'orcid'))}`,
                              borderRadius: 3,
                            }}
                          />
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 400,
                              color: !a.orcid ? 'var(--muted,#505C68)' : orcid === 'valid' ? '#1E6B3A' : '#A52A2A',
                            }}
                          >
                            {!a.orcid
                              ? 'Required for the corresponding author'
                              : orcid === 'valid'
                                ? '✓ Valid ORCID iD'
                                : ORCID_MESSAGES[orcid as 'malformed' | 'checksum']}
                          </span>
                        </label>
                      </div>
                      <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink,#101B27)' }}>Contribution (CRediT)</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {ROLES.map((r) => {
                            const on = a.roles.includes(r)
                            return (
                              <button
                                key={r}
                                onClick={() => setAuthor(a.id, { roles: on ? a.roles.filter((x) => x !== r) : a.roles.concat(r) })}
                                aria-pressed={on}
                                style={{
                                  padding: '4px 9px',
                                  borderRadius: 2,
                                  font: 'inherit',
                                  fontSize: 12,
                                  cursor: 'pointer',
                                  border: `1px solid ${on ? 'var(--accent,#1D5DA8)' : 'var(--line,#DCE1E6)'}`,
                                  background: on ? 'var(--accent-soft,#E8F0FA)' : 'var(--surface,#fff)',
                                  color: on ? 'var(--accent-dark,#174C8A)' : 'var(--ink-3,#3C4854)',
                                }}
                              >
                                {r}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </fieldset>
                  )
                })}
              </div>
            ) : null}

            {step === 5 ? (
              <div className="swAnim" style={{ animation: stepAnim, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <label
                  htmlFor="f-files"
                  onDragOver={(e) => {
                    e.preventDefault()
                    if (!drag) setDrag(true)
                  }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDrag(false)
                    addFiles(Array.from(e.dataTransfer.files || []))
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    padding: 28,
                    border: `1.5px dashed ${drag ? 'var(--accent,#1D5DA8)' : 'var(--line-strong,#B9C1C9)'}`,
                    background: drag ? 'var(--accent-tint,#F5F8FC)' : 'var(--surface-3,#FAFBFB)',
                    borderRadius: 3,
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink,#101B27)' }}>
                    Drag files here or <span style={{ color: 'var(--accent,#1D5DA8)', textDecoration: 'underline' }}>browse</span>
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--muted,#505C68)' }}>
                    DOCX, PDF, TEX, ZIP, PNG, TIFF, EPS, CSV · up to 50 MB per file
                  </span>
                  <input
                    id="f-files"
                    type="file"
                    multiple
                    onChange={(e) => {
                      addFiles(Array.from(e.target.files || []))
                      e.target.value = ''
                    }}
                    style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
                  />
                </label>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--muted,#505C68)', lineHeight: 1.5 }}>
                  This is a checklist, not an upload: listing a file here records what you intend to attach. You will attach the
                  files themselves in the editorial system at the final step, so keep them to hand.
                </p>
                {(
                  [
                    ['Anonymised manuscript', kk.includes('Anonymised manuscript')],
                    ['Title page with author details and declarations', kk.includes('Title page')],
                  ] as [string, boolean][]
                ).map(([t, ok]) => (
                  <div key={t} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: ok ? '#1E6B3A' : '#8A5300' }}>
                    <span aria-hidden="true">{ok ? '✓' : '!'}</span>
                    {(ok ? 'Required: ' : 'Missing required file: ') + t}
                  </div>
                ))}
                <div role="table" aria-label="Manuscript files" style={{ border: '1px solid var(--line,#DCE1E6)', borderRadius: 3 }}>
                  <div
                    role="row"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0,1fr) 220px 90px 120px',
                      gap: 12,
                      padding: '9px 14px',
                      background: 'var(--surface-3,#FAFBFB)',
                      borderBottom: '1px solid var(--line,#DCE1E6)',
                      fontSize: 12,
                      color: 'var(--muted,#505C68)',
                      textTransform: 'uppercase',
                      letterSpacing: '.04em',
                      fontWeight: 600,
                    }}
                  >
                    <span>File</span>
                    <span>File type</span>
                    <span>Size</span>
                    <span></span>
                  </div>
                  {files.map((fl, i) => {
                    const pct = pcts[fl.id] ?? 100
                    return (
                      <div
                        key={fl.id}
                        role="row"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'minmax(0,1fr) 220px 90px 120px',
                          gap: 12,
                          padding: '10px 14px',
                          borderBottom: '1px solid var(--line-soft,#EEF1F4)',
                          alignItems: 'center',
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
                          <span style={{ fontSize: 14, color: 'var(--ink,#101B27)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {fl.name}
                          </span>
                          {pct < 100 ? (
                            <div
                              role="progressbar"
                              aria-valuenow={pct}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              style={{ height: 4, background: 'var(--line-soft,#EEF1F4)', borderRadius: 2, overflow: 'hidden' }}
                            >
                              <div style={{ height: '100%', width: `${pct}%`, transition: 'width .25s linear', background: 'var(--accent,#1D5DA8)' }}></div>
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: '#1E6B3A' }}>Listed · attached at final submission</span>
                          )}
                        </div>
                        <select
                          value={fl.kind}
                          onChange={(e) =>
                            touchFiles((fs) => fs.map((y) => (y.id === fl.id ? { ...y, kind: e.target.value as DraftFileKind | '' } : y)))
                          }
                          aria-label={`File type for ${fl.name}`}
                          style={{
                            font: 'inherit',
                            fontSize: 13,
                            padding: '6px 8px',
                            border: `1px solid ${fl.kind ? 'var(--line-strong,#B9C1C9)' : '#D9A441'}`,
                            borderRadius: 3,
                            background: 'var(--surface,#fff)',
                          }}
                        >
                          <option value="">Choose file type…</option>
                          {FILE_KINDS.map((k) => (
                            <option key={k} value={k}>
                              {k}
                            </option>
                          ))}
                        </select>
                        <span style={{ fontSize: 13, color: 'var(--muted,#505C68)', fontVariantNumeric: 'tabular-nums' }}>
                          {formatFileSize(fl.size)}
                        </span>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() =>
                              i > 0 &&
                              touchFiles((fs) => {
                                const l = fs.slice()
                                ;[l[i - 1], l[i]] = [l[i], l[i - 1]]
                                return l
                              })
                            }
                            aria-label="Move up"
                            style={{
                              border: '1px solid var(--line,#DCE1E6)',
                              background: 'var(--surface,#fff)',
                              borderRadius: 2,
                              width: 28,
                              height: 28,
                              cursor: 'pointer',
                            }}
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => touchFiles((fs) => fs.filter((y) => y.id !== fl.id))}
                            aria-label={`Delete ${fl.name}`}
                            style={{
                              border: '1px solid var(--line,#DCE1E6)',
                              background: 'var(--surface,#fff)',
                              borderRadius: 2,
                              padding: '0 8px',
                              height: 28,
                              cursor: 'pointer',
                              color: '#A52A2A',
                              font: 'inherit',
                              fontSize: 12,
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  {files.length === 0 ? (
                    <p style={{ margin: 0, padding: '18px 14px', fontSize: 14, color: 'var(--muted,#505C68)' }}>No files listed yet.</p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {step === 6 ? (
              <div className="swAnim" style={{ animation: stepAnim, display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 720 }}>
                <fieldset style={{ border: 0, margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <legend style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink,#101B27)', marginBottom: 6 }}>
                    Funding <span style={{ color: '#A52A2A' }}>*</span>
                  </legend>
                  <div style={{ display: 'flex', gap: 20, fontSize: 14 }}>
                    <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input
                        type="radio"
                        name="fund"
                        checked={draft.funding === 'yes'}
                        onChange={() => setF('funding', 'yes')}
                        style={{ accentColor: 'var(--accent,#1D5DA8)' }}
                      />
                      This work received funding
                    </label>
                    <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input
                        type="radio"
                        name="fund"
                        checked={draft.funding === 'no'}
                        onChange={() => setF('funding', 'no')}
                        style={{ accentColor: 'var(--accent,#1D5DA8)' }}
                      />
                      No funding
                    </label>
                  </div>
                  {draft.funding === 'yes' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                      <input
                        value={draft.funder}
                        onChange={(e) => setF('funder', e.target.value)}
                        aria-label="Funder"
                        placeholder="Funder (searches the Crossref Funder Registry)"
                        style={{ font: 'inherit', fontSize: 14, padding: '8px 10px', border: `1px solid ${eb('f-funder')}`, borderRadius: 3 }}
                      />
                      <input
                        value={draft.grant}
                        onChange={(e) => setF('grant', e.target.value)}
                        aria-label="Grant number"
                        placeholder="Grant number"
                        style={{ font: 'inherit', fontSize: 14, padding: '8px 10px', border: '1px solid var(--line-strong,#B9C1C9)', borderRadius: 3 }}
                      />
                    </div>
                  ) : null}
                </fieldset>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label htmlFor="f-coi" style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink,#101B27)' }}>
                    Competing interests <span style={{ color: '#A52A2A' }}>*</span>
                  </label>
                  <textarea
                    id="f-coi"
                    rows={2}
                    value={draft.competingInterests}
                    onChange={(e) => setF('competingInterests', e.target.value)}
                    style={{ font: 'inherit', fontSize: 14, padding: '9px 12px', border: `1px solid ${eb('f-competing-interests')}`, borderRadius: 3 }}
                  ></textarea>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label htmlFor="f-eth" style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink,#101B27)' }}>
                    Ethics approval and consent <span style={{ color: '#A52A2A' }}>*</span>
                  </label>
                  <textarea
                    id="f-eth"
                    rows={2}
                    value={draft.ethics}
                    onChange={(e) => setF('ethics', e.target.value)}
                    style={{ font: 'inherit', fontSize: 14, padding: '9px 12px', border: `1px solid ${eb('f-ethics')}`, borderRadius: 3 }}
                  ></textarea>
                  <span style={{ fontSize: 12, color: 'var(--muted,#505C68)' }}>
                    Name the approving committee and reference number, or state why approval was not required.
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label htmlFor="f-data" style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink,#101B27)' }}>
                    Data availability statement <span style={{ color: '#A52A2A' }}>*</span>
                  </label>
                  <textarea
                    id="f-data"
                    rows={2}
                    value={draft.dataAvailability}
                    onChange={(e) => setF('dataAvailability', e.target.value)}
                    style={{ font: 'inherit', fontSize: 14, padding: '9px 12px', border: `1px solid ${eb('f-data')}`, borderRadius: 3 }}
                  ></textarea>
                </div>
                <fieldset style={{ border: 0, margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <legend style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink,#101B27)', marginBottom: 6 }}>
                    Use of generative AI <span style={{ color: '#A52A2A' }}>*</span>
                  </legend>
                  {AI_OPTS.map((o) => (
                    <label key={o.value} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
                      <input
                        type="radio"
                        name="ai"
                        checked={draft.generativeAi === o.value}
                        onChange={() => setF('generativeAi', o.value)}
                        style={{ accentColor: 'var(--accent,#1D5DA8)' }}
                      />
                      {o.label}
                    </label>
                  ))}
                </fieldset>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label htmlFor="f-pre" style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink,#101B27)' }}>
                    Preprint
                  </label>
                  <input
                    id="f-pre"
                    value={draft.preprintDoi}
                    onChange={(e) => setF('preprintDoi', e.target.value)}
                    placeholder="Preprint DOI, if posted"
                    style={{ font: 'inherit', fontSize: 14, padding: '8px 10px', border: `1px solid ${eb('f-preprint')}`, borderRadius: 3 }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Suggested and opposed reviewers</span>
                  <textarea
                    rows={2}
                    value={draft.suggestedReviewers}
                    onChange={(e) => setF('suggestedReviewers', e.target.value)}
                    aria-label="Suggested and opposed reviewers"
                    style={{ font: 'inherit', fontSize: 14, padding: '9px 12px', border: '1px solid var(--line-strong,#B9C1C9)', borderRadius: 3 }}
                  ></textarea>
                  <span style={{ fontSize: 12, color: 'var(--muted,#505C68)' }}>
                    Optional. Name, institution and email; editors are not obliged to use suggestions.
                  </span>
                </div>
              </div>
            ) : null}

            {step === 7 ? (
              <div className="swAnim" style={{ animation: stepAnim, display: 'flex', flexDirection: 'column', gap: 0 }}>
                {review.map((r) => (
                  <section
                    key={r.h}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '200px minmax(0,1fr) auto',
                      gap: 16,
                      padding: '16px 0',
                      borderBottom: '1px solid var(--line,#DCE1E6)',
                      alignItems: 'start',
                    }}
                  >
                    <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--ink,#101B27)', display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          background: r.dot,
                          color: '#fff',
                          fontSize: 11,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {r.mark}
                      </span>
                      {r.h}
                    </h2>
                    <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '4px 14px', fontSize: 14 }}>
                      {r.rows.map((row) => (
                        <div key={row.k} style={{ display: 'contents' }}>
                          <dt style={{ color: 'var(--muted,#505C68)' }}>{row.k}</dt>
                          <dd style={{ margin: 0, color: 'var(--ink-2,#1F2A36)', lineHeight: 1.45 }}>{row.v}</dd>
                        </div>
                      ))}
                    </dl>
                    <button
                      onClick={() => go(r.n)}
                      style={{
                        border: 0,
                        background: 'none',
                        color: 'var(--accent,#1D5DA8)',
                        font: 'inherit',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      Edit
                    </button>
                  </section>
                ))}
                <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, lineHeight: 1.5, marginTop: 20 }}>
                  <input
                    type="checkbox"
                    checked={draft.authorsApproved}
                    onChange={() => setF('authorsApproved', !draft.authorsApproved)}
                    style={{ margin: '3px 0 0', width: 16, height: 16, accentColor: 'var(--accent,#1D5DA8)' }}
                  />
                  <span>I confirm that all authors have approved this submission and that the information provided is accurate.</span>
                </label>
              </div>
            ) : null}
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 32px',
              borderTop: '1px solid var(--line,#DCE1E6)',
              background: 'var(--surface-3,#FAFBFB)',
            }}
          >
            <button
              onClick={() => step > 1 && go(step - 1)}
              disabled={step === 1}
              style={{
                border: '1px solid var(--line-strong,#B9C1C9)',
                background: 'var(--surface,#fff)',
                borderRadius: 3,
                padding: '9px 16px',
                font: 'inherit',
                fontSize: 14,
                cursor: 'pointer',
                color: 'var(--ink,#101B27)',
                opacity: step === 1 ? 0.5 : 1,
              }}
            >
              Back
            </button>
            <span style={{ fontSize: 13, color: 'var(--muted,#505C68)' }}>Step {step} of 7</span>
            <button
              onClick={() => void next()}
              disabled={busy}
              style={{
                border: 0,
                background: 'var(--accent,#1D5DA8)',
                color: '#fff',
                borderRadius: 3,
                padding: '10px 20px',
                font: 'inherit',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {step === 7 ? (busy ? 'Submitting…' : 'Submit manuscript') : 'Save and continue'}
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}
