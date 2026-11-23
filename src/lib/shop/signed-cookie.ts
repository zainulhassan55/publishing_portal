/**
 * Small HMAC-signed cookie values for the shop's Google sign-in.
 *
 * The shop buyer is held in a signed cookie, not a database row, so the portal
 * keeps no account of its own (ARCHITECTURE.md §2): the cookie carries what
 * Google said about the reader and expires, and that is all. Signed with
 * `SHOP_SESSION_SECRET`; changing that secret signs every shop buyer out.
 *
 * Format: `<base64url JSON>.<base64url HMAC-SHA256>`. Every payload carries
 * `exp` (seconds since the epoch), checked on read.
 */

import { createHmac, timingSafeEqual } from 'node:crypto'

const mac = (body: string, secret: string) => createHmac('sha256', secret).update(body).digest('base64url')

export function signValue(payload: Record<string, unknown> & { exp: number }, secret: string): string {
  if (!secret) throw new Error('signValue needs a secret')
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  return `${body}.${mac(body, secret)}`
}

/** The payload when the signature is good and it has not expired; otherwise null. `now` is in seconds. */
export function verifyValue<T extends { exp: number }>(value: string | undefined | null, secret: string, now = Math.floor(Date.now() / 1000)): T | null {
  if (!value || !secret || value.length > 4096) return null
  const dot = value.indexOf('.')
  if (dot <= 0 || dot !== value.lastIndexOf('.')) return null
  const body = value.slice(0, dot)
  const given = Buffer.from(value.slice(dot + 1), 'base64url')
  const expected = Buffer.from(mac(body, secret), 'base64url')
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as T
    if (!payload || typeof payload.exp !== 'number' || payload.exp <= now) return null
    return payload
  } catch {
    return null
  }
}
