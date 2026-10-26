import { clientIp, jsonError } from '@/lib/api'

/**
 * Cloudflare Turnstile, checked by the portal before a credential is relayed
 * to OJS. It sits here rather than in OJS because the portal drives OJS's
 * login and register forms server-side: a captcha inside OJS would block the
 * relay itself (see ojs-register.ts), whereas one checked here stops a script
 * before OJS ever sees the attempt.
 *
 * With `TURNSTILE_SECRET_KEY` unset the check is skipped, so development and
 * a server without keys keep working. The page hides the widget on the same
 * condition through NEXT_PUBLIC_TURNSTILE_SITE_KEY; set both or neither.
 */

const secret = process.env.TURNSTILE_SECRET_KEY?.trim() || ''

export const captchaEnabled = secret !== ''

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

type VerifyResult = { ok: true } | { ok: false; reason: 'missing' | 'rejected' | 'unreachable'; codes?: string[] }

export async function verifyCaptcha(token: unknown, ip: string): Promise<VerifyResult> {
  if (!captchaEnabled) return { ok: true }
  // Cloudflare's tokens are at most 2048 characters.
  if (typeof token !== 'string' || token === '' || token.length > 2048) return { ok: false, reason: 'missing' }

  const form = new URLSearchParams({ secret, response: token })
  if (ip !== 'unknown') form.set('remoteip', ip)

  try {
    const res = await fetch(VERIFY_URL, { method: 'POST', body: form, signal: AbortSignal.timeout(8000) })
    if (!res.ok) return { ok: false, reason: 'unreachable' }
    const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] }
    return data.success ? { ok: true } : { ok: false, reason: 'rejected', codes: data['error-codes'] }
  } catch {
    // Fails closed. Letting attempts through whenever Cloudflare is slow would
    // make the check worthless to anyone who can make it slow.
    return { ok: false, reason: 'unreachable' }
  }
}

/**
 * The route-level gate: null when the request may proceed, otherwise the
 * response to return as-is. `route` only labels the log line.
 */
export async function captchaGate(request: Request, token: unknown, route: string): Promise<Response | null> {
  const result = await verifyCaptcha(token, clientIp(request))
  if (result.ok) return null
  if (result.reason === 'unreachable') {
    console.error(`[${route}] Turnstile verification did not answer; attempt refused`)
    return jsonError('captcha-unavailable', 503, {
      message: 'The security check could not be verified just now. Wait a moment and try again.',
    })
  }
  if (result.reason === 'rejected') console.warn(`[${route}] Turnstile rejected a token: ${result.codes?.join(', ') || 'no codes'}`)
  return jsonError('captcha-failed', 403, {
    message: 'Please complete the security check, then try again.',
  })
}
