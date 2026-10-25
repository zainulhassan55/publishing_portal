import { clientIp, handler, jsonError, jsonOk, rateLimit, readJson } from '@/lib/api'
import { isPurpose, PUBLIC_PURPOSES } from '@/lib/uploads/policy'
import { createPendingUpload } from '@/lib/uploads/service'
import { ValidationError } from '@/lib/validate'

export const dynamic = 'force-dynamic'

type Body = { purpose?: string; filename?: string; contentType?: string; size?: number }

/**
 * Step one of an upload: returns a presigned URL the browser PUTs the file to.
 * No sign-in, because the forms that use it do not need one; the rate limit,
 * the per-purpose type and size rules, and the post-upload signature check are
 * what stand between this and abuse.
 */
export const POST = handler(async (request) => {
  const limit = rateLimit(`uploads:${clientIp(request)}`, 20, 600_000)
  if (!limit.ok) return jsonError('rate-limited', 429, { retryAfter: limit.retryAfter })

  const body = await readJson<Body>(request)
  if (!isPurpose(body.purpose) || !PUBLIC_PURPOSES.includes(body.purpose)) throw new ValidationError([{ field: 'purpose', message: 'Unknown upload purpose' }])
  const filename = typeof body.filename === 'string' ? body.filename : ''
  const contentType = typeof body.contentType === 'string' ? body.contentType : ''
  const size = typeof body.size === 'number' ? body.size : 0

  const upload = await createPendingUpload(body.purpose, filename, contentType, size)
  return jsonOk(upload, 201)
})
