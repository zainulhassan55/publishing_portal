import { handler, jsonError, jsonOk, readJson } from '@/lib/api'
import { insert, execute, query } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { journalSlugs } from '@/data/registry'

export const dynamic = 'force-dynamic'

type DraftRow = {
  id: number
  journal_slug: string | null
  current_step: number
  payload: string | object
  file_manifest: string | object | null
  ojs_submission_id: number | null
  submitted_at: Date | null
  updated_at: Date
}

const parseJson = (value: string | object | null) => {
  if (value === null) return null
  return typeof value === 'string' ? JSON.parse(value) : value
}

const toDraft = (row: DraftRow) => ({
  id: row.id,
  journalSlug: row.journal_slug,
  currentStep: row.current_step,
  payload: parseJson(row.payload),
  files: parseJson(row.file_manifest) ?? [],
  ojsSubmissionId: row.ojs_submission_id,
  submittedAt: row.submitted_at?.toISOString() ?? null,
  updatedAt: row.updated_at.toISOString(),
})

/** Lists the signed-in author's drafts. */
export const GET = handler(async () => {
  const session = await getSession()
  if (!session.user) return jsonError('unauthenticated', 401)

  const rows = await query<DraftRow>(
    `SELECT id, journal_slug, current_step, payload, file_manifest, ojs_submission_id, submitted_at, updated_at
       FROM submission_drafts
      WHERE ojs_user_id = ? AND submitted_at IS NULL
      ORDER BY updated_at DESC`,
    [session.user.id],
  )

  return jsonOk({ drafts: rows.map(toDraft) })
})

type SaveBody = {
  id?: number
  journalSlug?: string | null
  currentStep?: number
  payload?: unknown
  files?: unknown
}

/**
 * Autosave. Called on a debounce from the wizard, so it must be cheap and
 * idempotent. The draft is keyed on the OJS user id from the session, never on
 * an id supplied by the client — otherwise one author could overwrite another's
 * draft by guessing a number.
 */
export const POST = handler(async (request) => {
  const session = await getSession()
  if (!session.user) return jsonError('unauthenticated', 401)

  const body = await readJson<SaveBody>(request)

  if (body.journalSlug && !journalSlugs.includes(body.journalSlug)) {
    return jsonError('validation', 422, { errors: [{ field: 'journalSlug', message: 'Unknown journal' }] })
  }

  const step = Math.min(Math.max(Number(body.currentStep ?? 1), 1), 7)
  const payload = JSON.stringify(body.payload ?? {})
  const files = body.files ? JSON.stringify(body.files) : null

  if (body.id) {
    const affected = await execute(
      `UPDATE submission_drafts
          SET journal_slug = ?, current_step = ?, payload = ?, file_manifest = ?
        WHERE id = ? AND ojs_user_id = ? AND submitted_at IS NULL`,
      [body.journalSlug ?? null, step, payload, files, body.id, session.user.id],
    )

    if (affected === 0) return jsonError('not-found', 404)
    return jsonOk({ id: body.id, savedAt: new Date().toISOString() })
  }

  const id = await insert(
    `INSERT INTO submission_drafts (ojs_user_id, journal_slug, current_step, payload, file_manifest)
     VALUES (?, ?, ?, ?, ?)`,
    [session.user.id, body.journalSlug ?? null, step, payload, files],
  )

  return jsonOk({ id, savedAt: new Date().toISOString() }, 201)
})

export const DELETE = handler(async (request) => {
  const session = await getSession()
  if (!session.user) return jsonError('unauthenticated', 401)

  const id = Number(new URL(request.url).searchParams.get('id'))
  if (!id) return jsonError('validation', 422, { errors: [{ field: 'id', message: 'Draft id is required' }] })

  const affected = await execute('DELETE FROM submission_drafts WHERE id = ? AND ojs_user_id = ? AND submitted_at IS NULL', [
    id,
    session.user.id,
  ])

  if (affected === 0) return jsonError('not-found', 404)
  return jsonOk({ deleted: true })
})
