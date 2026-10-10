import { NextResponse } from 'next/server'
import { ValidationError } from './validate'

export const jsonOk = <T extends object>(data: T, status = 200) =>
  NextResponse.json({ ok: true, ...data }, { status, headers: { 'Cache-Control': 'no-store' } })

export const jsonError = (error: string, status: number, extra: object = {}) =>
  NextResponse.json({ ok: false, error, ...extra }, { status, headers: { 'Cache-Control': 'no-store' } })

/**
 * Wraps a route handler so a validation failure becomes a 422 with field
 * errors, a rate limit becomes a 429, a missing database becomes a 503, and
 * anything else becomes a 500 that logs server-side without leaking internals
 * to the client.
 */
export function handler(fn: (request: Request) => Promise<Response>) {
  return async (request: Request): Promise<Response> => {
    try {
      return await fn(request)
    } catch (error) {
      if (error instanceof ValidationError) {
        return jsonError('validation', 422, { errors: error.errors })
      }

      const message = error instanceof Error ? error.message : 'unknown'

      // `enforceRateLimit` signals by throwing. Without this branch it fell
      // through to the 500 below, so every rate-limited request on every route
      // looked like a server fault — to the user, to the client code deciding
      // what to show, and to error tracking. A 429 with Retry-After is the
      // whole point of having a limit.
      if (message === 'rate-limited') {
        const retryAfter = (error as { retryAfter?: number }).retryAfter ?? 60
        return NextResponse.json(
          { ok: false, error: 'rate-limited', retryAfter },
          {
            status: 429,
            headers: { 'Cache-Control': 'no-store', 'Retry-After': String(retryAfter) },
          },
        )
      }

      if (message.includes('PORTAL_DATABASE_URL')) {
        console.error('[api] database not configured:', message)
        return jsonError('unavailable', 503, {
          message: 'This form is not accepting submissions yet. Please email the editorial office.',
        })
      }

      console.error('[api] unhandled error:', error)
      return jsonError('server', 500)
    }
  }
}

/**
 * The site's public base URL, for building redirect Locations.
 *
 * `request.url` is the wrong base behind nginx: the standalone server reports
 * its own bind address, so `new URL('/', request.url)` produced
 * `https://localhost:3000/` — a browser following a sign-out redirect there
 * just hangs. The configured site URL is authoritative; the proxy's forwarded
 * headers cover local development, where NEXT_PUBLIC_SITE_URL is unset; the
 * raw request URL remains only as the bare `next dev` fallback.
 */
export function publicBaseUrl(request: Request): URL {
  const site = process.env.NEXT_PUBLIC_SITE_URL
  if (site) {
    try {
      return new URL(site)
    } catch {
      /* a malformed env var must not break every redirect */
    }
  }

  const requestUrl = new URL(request.url)
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  const proto = request.headers.get('x-forwarded-proto') ?? requestUrl.protocol.replace(/:$/, '')
  return host ? new URL(`${proto}://${host}`) : requestUrl
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T
  } catch {
    throw new ValidationError([{ field: 'body', message: 'Request body must be valid JSON' }])
  }
}

/**
 * Fixed-window rate limit, per IP per route, held in process memory.
 *
 * In-memory is honest for a single Node process behind nginx, which is the
 * actual deployment. It does not survive a restart and would not coordinate
 * across instances — if the portal is ever scaled out, this must move to a
 * shared store, and spam protection should not be the thing that discovers it.
 */
const buckets = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(key: string, limit = 5, windowMs = 60_000): { ok: boolean; retryAfter: number } {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, retryAfter: 0 }
  }

  bucket.count += 1
  if (bucket.count > limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) }
  }

  return { ok: true, retryAfter: 0 }
}

/** Best-effort client IP from the nginx forwarding headers. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}

export function enforceRateLimit(request: Request, route: string, limit = 5) {
  const { ok, retryAfter } = rateLimit(`${route}:${clientIp(request)}`, limit)
  if (!ok) {
    throw Object.assign(new Error('rate-limited'), { retryAfter })
  }
}

export const tokenUrlSafe = () => {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Buffer.from(bytes).toString('base64url')
}
