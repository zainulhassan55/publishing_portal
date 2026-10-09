import { handler, jsonError, jsonOk, readJson } from '@/lib/api'
import { execute, query } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { journalSlugs } from '@/data/registry'
import { Validator } from '@/lib/validate'

export const dynamic = 'force-dynamic'

/**
 * Portal-owned profile preferences.
 *
 * Scope is set by docs/OJS-INTEGRATION.md: OJS owns the identity, so names,
 * email, affiliation and passwords are not readable or writable here. This route
 * touches only `user_prefs`, whose columns exist precisely because OJS has no
 * concept of them, and it keys on the OJS user id from the session rather than
 * anything the client sends.
 *
 * `orcid_verified_at` is deliberately never written: the portal has no way to
 * verify an ORCID iD (that needs ORCID OAuth, which is not part of this
 * integration), so an iD recorded here stays unverified and the profile UI says
 * so instead of implying a check that did not happen.
 */

type PrefsRow = {
  orcid: string | null
  orcid_verified_at: Date | null
  research_interests: string | object | null
  journal_interests: string | object | null
  available_to_review: number
  max_concurrent_reviews: number
  notify_toc: number
  notify_cfp: number
  notify_news: number
  notify_digest: number
  updated_at: Date | null
}

export type ProfilePrefs = {
  orcid: string | null
  orcidVerified: boolean
  researchInterests: string[]
  journalInterests: string[]
  availableToReview: boolean
  maxConcurrentReviews: number
  notifyToc: boolean
  notifyCfp: boolean
  notifyNews: boolean
  notifyDigest: boolean
  updatedAt: string | null
}

/** Mirrors the column defaults in migrations/001_initial.sql. */
export const defaultPrefs: ProfilePrefs = {
  orcid: null,
  orcidVerified: false,
  researchInterests: [],
  journalInterests: [],
  availableToReview: false,
  maxConcurrentReviews: 2,
  notifyToc: true,
  notifyCfp: true,
  notifyNews: false,
  notifyDigest: false,
  updatedAt: null,
}

const parseList = (value: string | object | null): string[] => {
  if (value === null) return []
  const parsed = typeof value === 'string' ? (JSON.parse(value) as unknown) : value
  return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
}

const toPrefs = (row: PrefsRow): ProfilePrefs => ({
  orcid: row.orcid,
  orcidVerified: row.orcid_verified_at !== null,
  researchInterests: parseList(row.research_interests),
  journalInterests: parseList(row.journal_interests),
  availableToReview: row.available_to_review === 1,
  maxConcurrentReviews: row.max_concurrent_reviews,
  notifyToc: row.notify_toc === 1,
  notifyCfp: row.notify_cfp === 1,
  notifyNews: row.notify_news === 1,
  notifyDigest: row.notify_digest === 1,
  updatedAt: row.updated_at?.toISOString() ?? null,
})

export const GET = handler(async () => {
  const session = await getSession()
  if (!session.user) return jsonError('unauthenticated', 401)

  const rows = await query<PrefsRow>(
    `SELECT orcid, orcid_verified_at, research_interests, journal_interests, available_to_review,
            max_concurrent_reviews, notify_toc, notify_cfp, notify_news, notify_digest, updated_at
       FROM user_prefs
      WHERE ojs_user_id = ?`,
    [session.user.id],
  )

  // No row is the normal state for a user who has never changed a preference.
  return jsonOk({ prefs: rows[0] ? toPrefs(rows[0]) : defaultPrefs })
})

type SaveBody = {
  orcid?: string | null
  researchInterests?: unknown
  journalInterests?: unknown
  availableToReview?: unknown
  maxConcurrentReviews?: unknown
  notifyToc?: unknown
  notifyCfp?: unknown
  notifyNews?: unknown
  notifyDigest?: unknown
}

const asBoolean = (value: unknown, fallback: boolean) => (typeof value === 'boolean' ? value : fallback)

const asStringList = (value: unknown): string[] =>
  Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean))]
    : []

export const POST = handler(async (request) => {
  const session = await getSession()
  if (!session.user) return jsonError('unauthenticated', 401)

  const body = await readJson<SaveBody>(request)
  const v = new Validator()

  const researchInterests = asStringList(body.researchInterests)
  if (researchInterests.length > 20) {
    v.add({ field: 'researchInterests', message: 'Record at most 20 research interests' })
  }
  if (researchInterests.some((item) => item.length > 80)) {
    v.add({ field: 'researchInterests', message: 'Each research interest must be 80 characters or fewer' })
  }

  const journalInterests = asStringList(body.journalInterests)
  if (journalInterests.some((slug) => !journalSlugs.includes(slug))) {
    v.add({ field: 'journalInterests', message: 'One of the selected journals is not in the portfolio' })
  }

  const maxConcurrentReviews = Number(body.maxConcurrentReviews ?? defaultPrefs.maxConcurrentReviews)
  if (!Number.isInteger(maxConcurrentReviews) || maxConcurrentReviews < 1 || maxConcurrentReviews > 12) {
    v.add({ field: 'maxConcurrentReviews', message: 'Choose between 1 and 12 concurrent reviews' })
  }

  // An empty string clears a portal-recorded iD; anything else must pass the
  // ORCID checksum, so a mistyped digit is caught here rather than stored.
  const rawOrcid = typeof body.orcid === 'string' ? body.orcid.trim() : ''
  const orcid = rawOrcid ? v.orcid('orcid', rawOrcid) : ''

  v.throwIfInvalid()

  await execute(
    `INSERT INTO user_prefs
       (ojs_user_id, orcid, research_interests, journal_interests, available_to_review,
        max_concurrent_reviews, notify_toc, notify_cfp, notify_news, notify_digest)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       orcid = VALUES(orcid),
       research_interests = VALUES(research_interests),
       journal_interests = VALUES(journal_interests),
       available_to_review = VALUES(available_to_review),
       max_concurrent_reviews = VALUES(max_concurrent_reviews),
       notify_toc = VALUES(notify_toc),
       notify_cfp = VALUES(notify_cfp),
       notify_news = VALUES(notify_news),
       notify_digest = VALUES(notify_digest)`,
    [
      session.user.id,
      orcid || null,
      JSON.stringify(researchInterests),
      JSON.stringify(journalInterests),
      asBoolean(body.availableToReview, defaultPrefs.availableToReview) ? 1 : 0,
      maxConcurrentReviews,
      asBoolean(body.notifyToc, defaultPrefs.notifyToc) ? 1 : 0,
      asBoolean(body.notifyCfp, defaultPrefs.notifyCfp) ? 1 : 0,
      asBoolean(body.notifyNews, defaultPrefs.notifyNews) ? 1 : 0,
      asBoolean(body.notifyDigest, defaultPrefs.notifyDigest) ? 1 : 0,
    ],
  )

  return jsonOk({
    prefs: {
      ...defaultPrefs,
      orcid: orcid || null,
      researchInterests,
      journalInterests,
      availableToReview: asBoolean(body.availableToReview, defaultPrefs.availableToReview),
      maxConcurrentReviews,
      notifyToc: asBoolean(body.notifyToc, defaultPrefs.notifyToc),
      notifyCfp: asBoolean(body.notifyCfp, defaultPrefs.notifyCfp),
      notifyNews: asBoolean(body.notifyNews, defaultPrefs.notifyNews),
      notifyDigest: asBoolean(body.notifyDigest, defaultPrefs.notifyDigest),
      updatedAt: new Date().toISOString(),
    } satisfies ProfilePrefs,
  })
})
