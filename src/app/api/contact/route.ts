import { clientIp, handler, jsonError, jsonOk, rateLimit, readJson } from '@/lib/api'
import { insert } from '@/lib/db'
import { Validator } from '@/lib/validate'
import { journalSlugs } from '@/data/registry'
import { sendEditorialEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

const TOPICS = [
  'Submission enquiry',
  'Manuscript status',
  'Peer review',
  'Special issue proposal',
  'Editorial board application',
  'Indexing or metadata',
  'Technical problem',
  'Other',
] as const

type Body = {
  name?: string
  email?: string
  journalSlug?: string
  topic?: string
  message?: string
}

/**
 * Audit finding F-18: the contact form's submit control was `href="#"` with no
 * backend, so it silently dropped business correspondence. The message is
 * stored first and mailed second — if the relay fails the enquiry is still in
 * the database and recoverable, which is the opposite of the old behaviour.
 */
export const POST = handler(async (request) => {
  const limit = rateLimit(`contact:${clientIp(request)}`, 4, 300_000)
  if (!limit.ok) return jsonError('rate-limited', 429, { retryAfter: limit.retryAfter })

  const body = await readJson<Body>(request)
  const v = new Validator()

  const name = v.string({ field: 'name', value: body.name, label: 'Your name', required: true, max: 200 })
  const email = v.email('email', body.email)
  const topic = v.oneOf('topic', body.topic, TOPICS, 'Topic')
  const message = v.string({ field: 'message', value: body.message, label: 'Message', required: true, min: 20, max: 5000 })

  let journalSlug: string | null = null
  if (body.journalSlug && body.journalSlug !== 'none') {
    if (!journalSlugs.includes(body.journalSlug)) {
      v.add({ field: 'journalSlug', message: 'Choose a journal from the list' })
    } else {
      journalSlug = body.journalSlug
    }
  }

  v.throwIfInvalid()

  const id = await insert(
    'INSERT INTO contact_messages (name, email, journal_slug, topic, message) VALUES (?, ?, ?, ?, ?)',
    [name, email, journalSlug, topic, message],
  )

  const reference = `NGIQ-MSG-${String(id).padStart(6, '0')}`

  const relay = await sendEditorialEmail({
    subject: `[${topic}] ${reference}${journalSlug ? ` · ${journalSlug.toUpperCase()}` : ''}`,
    replyTo: email,
    lines: [`From: ${name} <${email}>`, journalSlug ? `Journal: ${journalSlug.toUpperCase()}` : '', '', message],
  })

  return jsonOk({ reference, relayed: relay.sent }, 201)
})
