import { cookies } from 'next/headers'
import { handler, jsonError, jsonOk } from '@/lib/api'
import { getSession } from '@/lib/auth/session'
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

export const GET = handler(async () => {
  const session = await getSession()
  if (!session.user) return jsonError('unauthenticated', 401)

  if (!ojsBaseUrl) return jsonOk({ submissions: [], reason: 'ojs-not-configured' })

  const store = await cookies()
  const token = store.get(PORTAL_SESSION_COOKIE)?.value
  const portalSession = token ? await readSession(token) : null

  if (!portalSession?.ojsSid) return jsonOk({ submissions: [], reason: 'no-ojs-session' })

  const auth = { sid: portalSession.ojsSid, csrfToken: portalSession.ojsCsrfToken }

  const perJournal = await Promise.all(
    journalSlugs.map(async (slug) => {
      const result = await ojsFetch<{ items?: OjsSubmission[] }>(slug, '/submissions?count=100', { auth })
      // 401 means the author holds no role in this journal, which is the normal
      // case for nine of ten journals. Not an error, nothing to report.
      if (!result.ok) return []
      return (result.data.items ?? []).map((item) => ({ slug, item }))
    }),
  )

  const submissions = perJournal
    .flat()
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

  return jsonOk({ submissions })
})
