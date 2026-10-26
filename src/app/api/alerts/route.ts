import { clientIp, handler, jsonError, jsonOk, rateLimit, readJson, tokenUrlSafe } from '@/lib/api'
import { execute } from '@/lib/db'
import { Validator } from '@/lib/validate'
import { journalSlugs } from '@/data/registry'
import { sendTransactionalEmail } from '@/lib/email'
import { absoluteUrl } from '@/lib/site'
import { requireMember } from '@/lib/auth/require'

export const dynamic = 'force-dynamic'

const SCOPES = ['new_issue', 'cfp', 'news', 'digest'] as const

type Body = { email?: string; journalSlug?: string; scope?: string }

export const POST = handler(async (request) => {
  const limit = rateLimit(`alerts:${clientIp(request)}`, 5, 300_000)
  if (!limit.ok) return jsonError('rate-limited', 429, { retryAfter: limit.retryAfter })

  const member = await requireMember()
  if (member instanceof Response) return member

  const body = await readJson<Body>(request)
  const v = new Validator()

  const email = v.email('email', body.email)
  const scope = (v.oneOf('scope', body.scope ?? 'new_issue', SCOPES, 'Alert type') || 'new_issue') as (typeof SCOPES)[number]

  let journalSlug: string | null = null
  if (body.journalSlug && body.journalSlug !== 'all') {
    if (!journalSlugs.includes(body.journalSlug)) {
      v.add({ field: 'journalSlug', message: 'Choose a journal from the list' })
    } else {
      journalSlug = body.journalSlug
    }
  }

  v.throwIfInvalid()

  const verifyToken = tokenUrlSafe()
  const unsubscribeToken = tokenUrlSafe()

  // Re-signing up refreshes the verification token rather than erroring, so a
  // reader who lost the confirmation email can simply try again.
  await execute(
    `INSERT INTO alert_signups (email, journal_slug, scope, verify_token, unsubscribe_token)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE verify_token = VALUES(verify_token), unsubscribed_at = NULL`,
    [email, journalSlug, scope, verifyToken, unsubscribeToken],
  )

  await sendTransactionalEmail({
    to: email,
    subject: 'Confirm your email alerts',
    lines: [
      'Confirm that you would like to receive alerts from NextGenIQ Press by opening this link:',
      absoluteUrl(`/api/alerts/confirm?token=${verifyToken}`),
      '',
      'If you did not request this, ignore this message — no alerts are sent until the link is opened.',
    ],
  })

  // Double opt-in: report "check your inbox", never "you are subscribed".
  return jsonOk({ pending: true }, 202)
})
