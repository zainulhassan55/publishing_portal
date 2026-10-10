import { cookies } from 'next/headers'
import { handler, jsonError, jsonOk } from '@/lib/api'
import { execute, query } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { PORTAL_SESSION_COOKIE, readSession } from '@/lib/auth/portal-session'
import { ojsFetch, localeValue } from '@/lib/ojs/client'
import { ojsBaseUrl, ojsSectionId, ojsSubmissionUrl, ojsSubmitUrl } from '@/lib/ojs/config'

export const dynamic = 'force-dynamic'

/**
 * Final submit: creates the real OJS submission from the portal draft.
 *
 * The point of this route is that the author types their metadata **once**. The
 * portal collects it across seven steps, then writes it into OJS so the author
 * lands on their own submission to attach files — rather than on a blank OJS
 * wizard with everything to retype, which is what the plain hand-off did.
 *
 * Three calls, in order, all with the author's own OJS session so the paper is
 * attributed to them and not to an administrator:
 *
 *   1. `POST {journal}/submissions`                           → submission + publication ids
 *   2. `PUT  {journal}/submissions/{id}/publications/{pubId}` → title, abstract, keywords, …
 *   3. `POST .../publications/{pubId}/contributors`           → each co-author
 *
 * Step 1 cannot carry the metadata: OJS 3.4 moved title, abstract and keywords
 * off the submission and onto the publication. An earlier version of this route
 * sent them at the submission level, where they were silently ignored.
 *
 * ## Outcomes
 *
 *   mode: 'api'      — submission created and metadata written. The author
 *                      continues in OJS only to attach files.
 *   mode: 'handoff'  — nothing was created. The draft is untouched and the
 *                      author completes the whole thing in OJS. Reached when
 *                      OJS is not configured, the session has no OJS side, the
 *                      journal's section id is unknown, or the create failed.
 *
 * The hand-off is a worse experience, not a broken one, and it is reported with
 * a reason so the UI can explain what is about to happen.
 *
 * ## What cannot be transferred, and why
 *
 * **ORCID iDs.** OJS refuses them on this path: *"Assigning an author's ORCiD
 * ID via the Edit/Add Author endpoints is not permitted."* That is a sound
 * policy — an ORCID asserted by whoever filled the form is not evidence the
 * person owns it, and unverified ORCIDs are a real problem in scholarly
 * metadata. The verification endpoint OJS points at is itself denied to an
 * author role. So the portal validates the checksum (catching typos OJS would
 * accept) and the author confirms ORCIDs in OJS. The response says so
 * explicitly rather than letting it vanish.
 *
 * **Declarations and the submission checklist.** OJS has no field for most of
 * them and its checklist is per journal. `dataAvailability` and funding do have
 * homes and are sent; the rest the author ticks in OJS.
 */

type Body = { id?: number }

type DraftRow = {
  id: number
  journal_slug: string | null
  payload: string | object
  current_step: number
}

type DraftAuthor = {
  given?: string
  family?: string
  email?: string
  affiliation?: string
  country?: string
  orcid?: string
  corresponding?: boolean
}

type DraftPayload = {
  title?: string
  subtitle?: string
  abstract?: string
  keywords?: string[]
  subject?: string
  authors?: DraftAuthor[]
  funder?: string
  dataAvailability?: string
}

type CreatedSubmission = {
  id?: number
  currentPublicationId?: number
  publications?: { id?: number }[]
}

/** OJS user group id for the Author role. Stable per install; ijdh uses 14. */
const AUTHOR_USER_GROUP_ID = 14

export const POST = handler(async (request) => {
  const session = await getSession()
  if (!session.user) return jsonError('unauthenticated', 401)

  const body = (await request.json().catch(() => ({}))) as Body
  if (!body.id) {
    return jsonError('validation', 422, { errors: [{ field: 'id', message: 'Draft id is required' }] })
  }

  const [draft] = await query<DraftRow>(
    `SELECT id, journal_slug, payload, current_step
       FROM submission_drafts
      WHERE id = ? AND ojs_user_id = ? AND submitted_at IS NULL`,
    [body.id, session.user.id],
  )

  if (!draft) return jsonError('not-found', 404)
  if (!draft.journal_slug) {
    return jsonError('validation', 422, {
      errors: [{ field: 'journalSlug', message: 'Choose a journal before submitting' }],
    })
  }

  const slug = draft.journal_slug
  const payload = (typeof draft.payload === 'string' ? JSON.parse(draft.payload) : draft.payload) as DraftPayload

  const handoff = (reason: string) => jsonOk({ mode: 'handoff' as const, reason, continueUrl: ojsSubmitUrl(slug) })

  if (!ojsBaseUrl) return handoff('ojs-not-configured')

  // The author's OJS session, held server-side. Read from the store rather than
  // a cookie: the browser never holds OJSSID by design, which is why the
  // previous version of this route always fell through to the hand-off.
  const store = await cookies()
  const token = store.get(PORTAL_SESSION_COOKIE)?.value
  const portalSession = token ? await readSession(token) : null

  if (!portalSession?.ojsSid) return handoff('no-ojs-session')

  const sectionId = ojsSectionId(slug)
  if (sectionId === null) {
    // Not guessed. Filing a manuscript into the wrong section is an editorial
    // error that surfaces late; a retype is merely annoying. See ojsSectionId.
    return handoff('unknown-section')
  }

  const auth = { sid: portalSession.ojsSid, csrfToken: portalSession.ojsCsrfToken }

  /* ----------------------------- 1. create ------------------------------ */

  const created = await ojsFetch<CreatedSubmission>(slug, '/submissions', {
    auth,
    method: 'POST',
    body: { locale: 'en', sectionId },
  })

  if (!created.ok || !created.data?.id) {
    console.error('[drafts/submit] create failed:', created.ok ? 'no id returned' : created.error, created.ok ? '' : created.body)
    return handoff(created.ok ? 'no-submission-id' : created.error)
  }

  const submissionId = created.data.id
  const publicationId = created.data.currentPublicationId ?? created.data.publications?.[0]?.id

  // From here the submission EXISTS in OJS. Later steps are best-effort: a
  // failure must not re-create it, and must not look like nothing happened.
  // The author is sent to a real submission either way, and anything that did
  // not transfer is named in the response.
  const notTransferred: string[] = []

  /* -------------------------- 2. publication ---------------------------- */

  if (publicationId) {
    const metadata: Record<string, unknown> = {
      title: localeValue(payload.title ?? ''),
      abstract: localeValue(payload.abstract ? `<p>${payload.abstract}</p>` : ''),
      keywords: localeValue(payload.keywords ?? []),
    }
    if (payload.subtitle) metadata.subtitle = localeValue(payload.subtitle)
    if (payload.subject) metadata.subjects = localeValue([payload.subject])
    if (payload.funder) metadata.supportingAgencies = localeValue([payload.funder])
    if (payload.dataAvailability) metadata.dataAvailability = localeValue(payload.dataAvailability)

    const updated = await ojsFetch(slug, `/submissions/${submissionId}/publications/${publicationId}`, {
      auth,
      method: 'PUT',
      body: metadata,
    })

    if (!updated.ok) {
      console.error('[drafts/submit] publication update failed:', updated.error, updated.body)
      notTransferred.push('title, abstract and keywords')
    }
  } else {
    notTransferred.push('title, abstract and keywords')
  }

  /* --------------------------- 3. co-authors ---------------------------- */

  /**
   * OJS adds the submitting user as a contributor automatically, from their OJS
   * profile. Posting the draft's author list blindly therefore duplicates them.
   *
   * Deduplicated against what OJS actually created, not against the session.
   * Matching on `session.user.email` was the obvious approach and is wrong:
   * OJS 3.5's `currentUser` blob carries no email, so that field is an empty
   * string and every comparison succeeded — which put the submitter in twice,
   * once with their profile affiliation and once with whatever they typed.
   *
   * Email is the reliable key where present; a normalised full name is the
   * fallback, because the author may well have typed a different form of their
   * own affiliation or email than their OJS profile holds.
   */
  const existing = publicationId
    ? await ojsFetch<{ items?: { email?: string; fullName?: string }[] }>(
        slug,
        `/submissions/${submissionId}/publications/${publicationId}/contributors`,
        { auth },
      )
    : null

  const normalise = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim()
  const taken = new Set<string>()
  for (const contributor of existing?.ok ? (existing.data.items ?? []) : []) {
    if (contributor.email) taken.add(`e:${normalise(contributor.email)}`)
    if (contributor.fullName) taken.add(`n:${normalise(contributor.fullName)}`)
  }

  const coAuthors = (payload.authors ?? []).filter((a) => {
    const email = a.email ? `e:${normalise(a.email)}` : null
    const name = `n:${normalise(`${a.given ?? ''} ${a.family ?? ''}`)}`
    return !(email && taken.has(email)) && !taken.has(name)
  })

  let authorsAdded = 0
  if (publicationId) {
    for (const author of coAuthors) {
      if (!author.given && !author.family) continue

      const result = await ojsFetch(slug, `/submissions/${submissionId}/publications/${publicationId}/contributors`, {
        auth,
        method: 'POST',
        body: {
          givenName: localeValue(author.given ?? ''),
          familyName: localeValue(author.family ?? ''),
          email: author.email ?? '',
          country: author.country || undefined,
          userGroupId: AUTHOR_USER_GROUP_ID,
          includeInBrowse: true,
          ...(author.affiliation ? { affiliations: [{ name: localeValue(author.affiliation) }] } : {}),
          // ORCID deliberately omitted — OJS rejects it here. See the header.
        },
      })

      if (result.ok) authorsAdded += 1
      else console.error('[drafts/submit] contributor failed:', result.error, result.body)
    }
  }

  if (authorsAdded < coAuthors.length) notTransferred.push('some co-authors')
  if ((payload.authors ?? []).some((a) => a.orcid)) notTransferred.push('ORCID iDs, which OJS requires each author to confirm')

  /* ----------------------------- 4. record ------------------------------ */

  await execute('UPDATE submission_drafts SET ojs_submission_id = ?, submitted_at = NOW() WHERE id = ?', [
    submissionId,
    draft.id,
  ])

  const reference = `NGIQ-${slug.toUpperCase()}-${new Date().getUTCFullYear()}-${String(submissionId).padStart(4, '0')}`

  return jsonOk({
    mode: 'api' as const,
    submissionId,
    reference,
    // Where to finish: attach the files to this submission.
    continueUrl: ojsSubmissionUrl(slug, submissionId),
    notTransferred,
  })
})
