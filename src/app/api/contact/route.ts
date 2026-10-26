import { clientIp, handler, jsonError, jsonOk, rateLimit, readJson } from '@/lib/api'
import { databaseConfigured, insert } from '@/lib/db'
import { sendEditorialEmail, sendTransactionalEmail } from '@/lib/email'
import { CONTACT_TOPICS } from '@/lib/forms/options'
import { honeypotTripped } from '@/lib/forms/server'
import { Validator } from '@/lib/validate'
import { getJournal, getSeries, journalSlugs, seriesSlugs } from '@/data/registry'
import { requireMember } from '@/lib/auth/require'

export const dynamic = 'force-dynamic'

const TOPICS = CONTACT_TOPICS

type Body = {
  website?: string
  name?: string
  email?: string
  journalSlug?: string
  topic?: string
  message?: string
}

/**
 * Audit finding F-18: the contact form's submit control was `href="#"` with no
 * backend, so it silently dropped business correspondence.
 *
 * Email is how the publisher reads these messages, so the relay to the
 * editorial inbox (EDITORIAL_INBOX, Reply-To set to the sender) is the main
 * path, and the database copy is the safety net. Either one succeeding counts
 * as received; the sender is told to email directly only when both failed.
 */
export const POST = handler(async (request) => {
  const limit = rateLimit(`contact:${clientIp(request)}`, 4, 300_000)
  if (!limit.ok) return jsonError('rate-limited', 429, { retryAfter: limit.retryAfter })

  const member = await requireMember()
  if (member instanceof Response) return member

  const body = await readJson<Body>(request)
  if (honeypotTripped(body as Record<string, unknown>)) return jsonOk({ reference: 'NGIQ-MSG-000000', relayed: true }, 201)
  const v = new Validator()

  const name = v.string({ field: 'name', value: body.name, label: 'Your name', required: true, max: 200 })
  const email = v.email('email', body.email)
  const topic = v.oneOf('topic', body.topic, TOPICS, 'Topic')
  const message = v.string({ field: 'message', value: body.message, label: 'Message', required: true, min: 20, max: 5000 })

  let journalSlug: string | null = null
  if (body.journalSlug && body.journalSlug !== 'none') {
    if (![...journalSlugs, ...seriesSlugs].includes(body.journalSlug)) {
      v.add({ field: 'journalSlug', message: 'Choose a journal or book series from the list' })
    } else {
      journalSlug = body.journalSlug
    }
  }

  v.throwIfInvalid()

  // Saved when the database is reachable; a failure here must not lose the message, which still goes by email.
  let id: number | null = null
  if (databaseConfigured) {
    try {
      id = await insert('INSERT INTO contact_messages (name, email, journal_slug, topic, message) VALUES (?, ?, ?, ?, ?)', [
        name,
        email,
        journalSlug,
        topic,
        message,
      ])
    } catch (error) {
      console.error('[contact] could not store message; relaying by email only:', error)
    }
  }

  const reference = id !== null ? `NGIQ-MSG-${String(id).padStart(6, '0')}` : `NGIQ-MSG-${Date.now().toString(36).toUpperCase()}`
  const title = journalSlug ? (getJournal(journalSlug)?.title ?? getSeries(journalSlug)?.title ?? journalSlug) : null

  const relay = await sendEditorialEmail({
    subject: `[${topic}] ${reference}${journalSlug ? ` · ${journalSlug.toUpperCase()}` : ''}`,
    replyTo: email,
    lines: [`From: ${name} <${email}>`, title ? `Journal or series: ${title}` : '', `Topic: ${topic}`, '', message, '', 'Reply to this email to answer the sender directly.'],
  })

  if (id === null && !relay.sent) {
    return jsonError('unavailable', 503, { message: 'The message could not be delivered.' })
  }

  // Best effort: a copy for the sender, so they have the reference and a record of what they wrote.
  if (relay.sent) {
    await sendTransactionalEmail({
      to: email,
      subject: `We have received your message (${reference})`,
      lines: [`Dear ${name},`, 'Thank you for contacting NextGenIQ Press. Your message has reached the editorial office.', `Your reference is ${reference}.`, '', 'Your message:', '', message],
    })
  }

  return jsonOk({ reference, relayed: relay.sent }, 201)
})
