import { handler, jsonError, jsonOk, readJson } from '@/lib/api'
import { execute, query } from '@/lib/db'
import { OJS_SESSION_COOKIE, getSession } from '@/lib/auth/session'
import { ojsApiUrl, ojsBaseUrl, ojsSubmitUrl } from '@/lib/ojs/config'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * Final submit: hands a completed portal draft to OJS, which becomes the system
 * of record from that moment on.
 *
 * Two outcomes are designed for, because which one is reachable depends on the
 * OJS auth spike in docs/OJS-INTEGRATION.md:
 *
 *   mode: 'api'      — the draft was created as an OJS submission through the
 *                      REST API using the author's own session. The author
 *                      never leaves the portal.
 *   mode: 'handoff'  — the API path is unavailable (no base URL, OJS rejected
 *                      the session, or the endpoint shape changed). The draft
 *                      stays saved and the author is sent to the OJS wizard to
 *                      complete the final step.
 *
 * The handoff is a worse experience, not a broken one, and it is reported
 * explicitly so the UI can explain what is about to happen rather than
 * appearing to fail.
 */

type Body = { id?: number }

type DraftRow = { id: number; journal_slug: string | null; payload: string | object; current_step: number }

export const POST = handler(async (request) => {
  const session = await getSession()
  if (!session.user) return jsonError('unauthenticated', 401)

  const body = await readJson<Body>(request)
  if (!body.id) return jsonError('validation', 422, { errors: [{ field: 'id', message: 'Draft id is required' }] })

  const [draft] = await query<DraftRow>(
    'SELECT id, journal_slug, payload, current_step FROM submission_drafts WHERE id = ? AND ojs_user_id = ? AND submitted_at IS NULL',
    [body.id, session.user.id],
  )

  if (!draft) return jsonError('not-found', 404)
  if (!draft.journal_slug) {
    return jsonError('validation', 422, { errors: [{ field: 'journalSlug', message: 'Choose a journal before submitting' }] })
  }

  const payload = typeof draft.payload === 'string' ? JSON.parse(draft.payload) : draft.payload

  if (!ojsBaseUrl) {
    return jsonOk({
      mode: 'handoff' as const,
      reason: 'ojs-not-configured',
      continueUrl: ojsSubmitUrl(draft.journal_slug),
    })
  }

  const store = await cookies()
  const sid = store.get(OJS_SESSION_COOKIE)?.value

  if (!sid) {
    return jsonOk({ mode: 'handoff' as const, reason: 'no-ojs-session', continueUrl: ojsSubmitUrl(draft.journal_slug) })
  }

  try {
    const response = await fetch(ojsApiUrl(draft.journal_slug, '/submissions'), {
      method: 'POST',
      headers: {
        Cookie: `${OJS_SESSION_COOKIE}=${sid}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sectionId: payload.sectionId ?? undefined,
        locale: 'en',
        title: { en: payload.title },
        abstract: { en: payload.abstract },
        keywords: { en: payload.keywords ?? [] },
      }),
      cache: 'no-store',
    })

    if (!response.ok) {
      // A 403 here is the expected signal that OJS requires a CSRF token on
      // mutating API calls — the specific unknown the spike has to settle.
      return jsonOk({
        mode: 'handoff' as const,
        reason: `ojs-${response.status}`,
        continueUrl: ojsSubmitUrl(draft.journal_slug),
      })
    }

    const created = (await response.json()) as { id?: number }

    if (!created.id) {
      return jsonOk({ mode: 'handoff' as const, reason: 'no-submission-id', continueUrl: ojsSubmitUrl(draft.journal_slug) })
    }

    await execute('UPDATE submission_drafts SET ojs_submission_id = ?, submitted_at = NOW() WHERE id = ?', [
      created.id,
      draft.id,
    ])

    const reference = `NGIQ-${draft.journal_slug.toUpperCase()}-${new Date().getUTCFullYear()}-${String(created.id).padStart(4, '0')}`

    return jsonOk({ mode: 'api' as const, submissionId: created.id, reference })
  } catch (error) {
    console.error('[drafts/submit] OJS unreachable:', error)
    return jsonOk({ mode: 'handoff' as const, reason: 'ojs-unreachable', continueUrl: ojsSubmitUrl(draft.journal_slug) })
  }
})
