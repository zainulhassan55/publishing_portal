import { sendEditorialEmail, sendTransactionalEmail } from '../email'
import type { UploadPurpose } from '../uploads/policy'
import type { UploadRef } from '../uploads/service'
import type { Validator } from '../validate'
import { HONEYPOT } from './options'

/** True when the hidden honeypot field was filled in, i.e. the sender is almost certainly a bot. */
export const honeypotTripped = (body: Record<string, unknown>) =>
  typeof body[HONEYPOT] === 'string' && (body[HONEYPOT] as string).trim() !== ''

export const reference = (prefix: string, id: number) => `NGIQ-${prefix}-${String(id).padStart(5, '0')}`

export type FileSpec = { field: string; purpose: UploadPurpose; label: string; required?: boolean; max?: number }

/**
 * Reads `files: { [field]: string | string[] }` from a form body — upload ids
 * returned by /api/uploads/sign — and checks each field's count.
 */
export function readFileRefs(files: unknown, specs: FileSpec[], v: Validator): UploadRef[] {
  const map = files && typeof files === 'object' ? (files as Record<string, unknown>) : {}
  const refs: UploadRef[] = []
  for (const spec of specs) {
    const raw = map[spec.field]
    const ids = (Array.isArray(raw) ? raw : raw ? [raw] : []).filter((x): x is string => typeof x === 'string' && /^[0-9a-f-]{36}$/.test(x))
    if (spec.required && ids.length === 0) v.add({ field: `files.${spec.field}`, message: `${spec.label} is required` })
    if (ids.length > (spec.max ?? 1)) v.add({ field: `files.${spec.field}`, message: `Attach at most ${spec.max ?? 1} file(s) for ${spec.label.toLowerCase()}` })
    for (const id of ids) refs.push({ id, purpose: spec.purpose, field: `files.${spec.field}` })
  }
  return refs
}

/** Reads an array of objects from a repeater field, capped at `max` entries. */
export const readList = (value: unknown, max: number): Record<string, unknown>[] =>
  (Array.isArray(value) ? value : []).filter((x): x is Record<string, unknown> => !!x && typeof x === 'object').slice(0, max)

/**
 * The acknowledgement to the sender and the notification to the editorial
 * inbox. Best effort: the submission is already stored, so a mail outage must
 * not make the sender think it was lost.
 */
export async function notifyReceived(opts: {
  to: string
  name: string
  ref: string
  what: string
  title: string
  summary: string[]
  ackNote?: string
}) {
  await Promise.allSettled([
    sendTransactionalEmail({
      to: opts.to,
      subject: `We have received your ${opts.what} (${opts.ref})`,
      lines: [
        `Dear ${opts.name},`,
        `Thank you for your ${opts.what}: “${opts.title}”.`,
        `Your reference is ${opts.ref}. Please quote it in any correspondence with contact@nextgeniqpress.com.`,
        opts.ackNote ?? 'The editorial team will review it and be in touch.',
      ],
    }),
    sendEditorialEmail({
      subject: `${opts.what[0].toUpperCase()}${opts.what.slice(1)} ${opts.ref}: ${opts.title}`,
      lines: [`From: ${opts.name} <${opts.to}>`, '', ...opts.summary, '', 'Files and full details are in the admin panel under Editorial forms.'],
    }),
  ])
}
