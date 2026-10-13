import { cookies } from 'next/headers'
import { handler, jsonError, jsonOk } from '@/lib/api'
import { getSession } from '@/lib/auth/session'
import { resolveScope } from '@/lib/auth/access'
import { PORTAL_SESSION_COOKIE, readSession } from '@/lib/auth/portal-session'
import { ojsFetch } from '@/lib/ojs/client'
import { ojsBaseUrl } from '@/lib/ojs/config'
import { journalSlugs } from '@/data/registry'
import type { SubmissionStatus } from '@/types/publishing'

export const dynamic = 'force-dynamic'

/**
 * The signed-in author's real submissions, read from OJS.
 *
 * Replaces the fixture submissions the dashboard used to show. Those were
 * useful for building the UI and actively misleading once sign-in worked: an
 * author saw five invented manuscripts with decision letters alongside their
 * own real draft.
 *
 * ## Read here, act in OJS
 *
 * What OJS lets an author read is enough for a status view and no more:
 * `status`, `statusLabel`, `stageId`, `dateSubmitted`, `dateLastActivity`,
 * `revisionsRequested`, and the publication's title and authors. That covers
 * the list and the detail panel.
 *
 * What it does **not** expose, at all, is the editorial substance — reviewer
 * reports, review rounds and decision letters have no API in OJS 3.5. So every
 * *action* links to `urlAuthorWorkflow`, which OJS supplies per submission and
 * which lands the author on their own submission in OJS. The portal shows where
 * a manuscript stands; OJS remains the place things are done. Offering a
 * "Submit revision" button here that could not upload a file would be the dead
 * control of audit finding F-18 all over again.
 *
 * ## Scope
 *
 * This used to ask OJS for `/submissions?count=100` with no scope at all and
 * render the answer under "My submissions". That is a question whose meaning
 * depends on who is asking: OJS forces `assignedTo` to the caller for an
 * ordinary author, but returns **the whole journal queue** to anyone holding
 * `manager` or `site-admin` there — so a manager's dashboard presented every
 * other author's manuscript as their own submission.
 *
 * The scope is now always explicit, and `assignedTo` carries it. `mine` is the
 * default and means the same thing for every role: what OJS has assigned to
 * this person — their own papers as an author, the papers they were assigned to
 * handle as an editor, the ones they were invited to review as a reviewer. OJS
 * models all three as an assignment, so one query serves all three and no role
 * branch is needed to build it.
 *
 * `?scope=all` is the administrator's view and is refused to anyone without the
 * roles for it. The check is in src/lib/auth/access.ts, which also explains why
 * OJS remains the enforcement point and why the portal cannot add an ownership
 * filter of its own.
 *
 * ## Fan-out
 *
 * OJS submissions are journal-scoped, so this asks each journal in turn with
 * the author's own session. A journal the author has no role in answers 401,
 * which is expected and silently skipped — it means "nothing of yours here",
 * not an error. Ten small parallel requests is the cost of OJS having no
 * cross-journal endpoint for an author.
 */

type OjsSubmission = {
  id: number
  status?: number
  statusLabel?: string
  stageId?: number
  dateSubmitted?: string | null
  dateLastActivity?: string | null
  lastModified?: string | null
  revisionsRequested?: boolean
  submissionProgress?: string | number
  urlAuthorWorkflow?: string
  urlPublished?: string
  publications?: {
    id?: number
    fullTitle?: Record<string, string> | string
    title?: Record<string, string> | string
    authorsString?: string
    authors?: { fullName?: string }[]
  }[]
  currentPublicationId?: number
}

const localised = (value: Record<string, string> | string | undefined): string => {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value.en ?? Object.values(value)[0] ?? ''
}

/**
 * Maps OJS status and stage onto the portal's vocabulary.
 *
 * OJS keeps two orthogonal things: `status` (queued / published / declined /
 * scheduled) and `stageId` (submission / review / copyediting / production).
 * The portal's single status list has to be derived from both, and the order of
 * these checks matters — a declined submission is "Rejected" whatever stage it
 * reached, and `revisionsRequested` outranks the plain review stage because it
 * is the one state the author has to act on.
 */
const STATUS_PUBLISHED = 3
const STATUS_DECLINED = 4
const STATUS_SCHEDULED = 5

const STAGE_REVIEW = 3
const STAGE_COPYEDITING = 4
const STAGE_PRODUCTION = 5

function toPortalStatus(s: OjsSubmission): SubmissionStatus {
  if (s.status === STATUS_DECLINED) return 'Rejected'
  if (s.status === STATUS_PUBLISHED) return 'Published'
  if (s.status === STATUS_SCHEDULED) return 'In production'

  // `submissionProgress` is a non-empty step name while the OJS wizard is
  // incomplete — typically because the author never attached files. Calling
  // that "Submitted" would tell them they are done when no editor can act.
  if (!s.dateSubmitted || (typeof s.submissionProgress === 'string' && s.submissionProgress !== '')) {
    return 'Draft'
  }

  if (s.revisionsRequested) return 'Revisions requested'
  if (s.stageId === STAGE_PRODUCTION) return 'In production'
  if (s.stageId === STAGE_COPYEDITING) return 'Accepted'
  if (s.stageId === STAGE_REVIEW) return 'Under review'
  return 'Submitted'
}

/** Index into the portal's timeline, matching SubmissionStatus order of travel. */
const STAGE_INDEX: Record<SubmissionStatus, number> = {
  Draft: -1,
  Submitted: 1,
  'Under review': 2,
  'Revisions requested': 2,
  Accepted: 3,
  'In production': 4,
  Published: 5,
  Rejected: 3,
  Withdrawn: 3,
}

const isoDate = (value: string | null | undefined): string | undefined =>
  value ? value.replace(' ', 'T').slice(0, 19) + 'Z' : undefined

export const GET = handler(async (request) => {
  const session = await getSession()
  if (!session.user) return jsonError('unauthenticated', 401)

  const requested = new URL(request.url).searchParams.get('scope')
  const resolved = resolveScope(requested, session.user.roles)

  if (!resolved.ok) {
    if (resolved.reason === 'forbidden') {
      // Logged: an account asking for a scope it does not hold is either a stale
      // client or someone trying the URL by hand, and both are worth seeing.
      console.warn(
        `[submissions] refused scope=${JSON.stringify(requested)} for user ${session.user.id} with roles ${JSON.stringify(session.user.roles)}`,
      )
      return jsonError('forbidden', 403, {
        message: 'Your account does not have access to all submissions.',
      })
    }
    return jsonError('unknown-scope', 400, { message: `Unknown scope ${JSON.stringify(requested)}.` })
  }

  if (!ojsBaseUrl) return jsonOk({ submissions: [], scope: resolved.scope, reason: 'ojs-not-configured' })

  const store = await cookies()
  const token = store.get(PORTAL_SESSION_COOKIE)?.value
  const portalSession = token ? await readSession(token) : null

  if (!portalSession?.ojsSid) return jsonOk({ submissions: [], scope: resolved.scope, reason: 'no-ojs-session' })

  const auth = {
    sid: portalSession.ojsSid,
    csrfToken: portalSession.ojsCsrfToken,
    userAgent: request.headers.get('user-agent'),
  }

  // `assignedTo` is what makes "mine" mean the same thing for every role. It is
  // the caller's own id, which OJS permits for everyone — a non-manager is
  // forced to exactly this value anyway, and a manager is filtered down to it
  // instead of receiving the whole queue. Asking for another user's id answers
  // 403, so this is the only id the portal is ever in a position to send.
  const query =
    resolved.scope === 'all' ? '/submissions?count=100' : `/submissions?count=100&assignedTo[]=${session.user.id}`

  const perJournal = await Promise.all(
    journalSlugs.map(async (slug) => {
      const result = await ojsFetch<{ items?: OjsSubmission[] }>(slug, query, { auth })
      // 401 means the author holds no role in this journal, which is the normal
      // case for nine of ten journals. Not an error, nothing to report.
      if (!result.ok) return { slug, items: [] as OjsSubmission[], enrolled: false }
      return { slug, items: result.data.items ?? [], enrolled: true }
    }),
  )

  // The journals that answered are the ones this account holds a role in. The
  // dashboard needs that list for its link into the editorial system when
  // there is no submission to anchor it on: OJS's dashboard exists only inside
  // a journal, and the site-level `index` context answers every author with
  // "The current role does not have access to this operation". Verified
  // against the live 3.5.0.5 instance — index/dashboard/mySubmissions is
  // refused for a user who can open ijdh/dashboard/mySubmissions fine.
  const journals = perJournal.filter((j) => j.enrolled).map((j) => j.slug)

  const submissions = perJournal
    .flatMap(({ slug, items }) => items.map((item) => ({ slug, item })))
    .map(({ slug, item }) => {
      const publication =
        item.publications?.find((p) => p.id === item.currentPublicationId) ?? item.publications?.[0]
      const status = toPortalStatus(item)

      return {
        id: `NGIQ-${slug.toUpperCase()}-${new Date(item.dateSubmitted ?? item.lastModified ?? Date.now()).getUTCFullYear()}-${String(item.id).padStart(4, '0')}`,
        ojsSubmissionId: item.id,
        journalSlug: slug,
        title: localised(publication?.fullTitle ?? publication?.title) || 'Untitled submission',
        status,
        stage: STAGE_INDEX[status],
        submittedIso: isoDate(item.dateSubmitted),
        updatedIso: isoDate(item.dateLastActivity ?? item.lastModified) ?? new Date().toISOString(),
        coauthors: (publication?.authors ?? [])
          .map((a) => a.fullName ?? '')
          .filter((n) => n && n !== session.user!.fullName),
        // OJS supplies this per submission; everything the author has to *do*
        // happens behind it.
        ojsUrl: item.urlAuthorWorkflow ?? null,
        publishedUrl: item.urlPublished ?? null,
      }
    })
    .sort((a, b) => b.updatedIso.localeCompare(a.updatedIso))

  // The scope is echoed so the client can label the list honestly rather than
  // assuming it is looking at the reader's own work.
  return jsonOk({ submissions, journals, scope: resolved.scope })
})
