import { NextResponse } from 'next/server'
import { clientIp, handler, jsonError, jsonOk, rateLimit, readJson } from '@/lib/api'
import { databaseConfigured } from '@/lib/db'
import { Validator } from '@/lib/validate'
import { captchaGate } from '@/lib/captcha'
import { OTP_RESEND_SECONDS, OTP_TTL_MINUTES, issueCode, normaliseEmail } from '@/lib/auth/email-otp'
import { checkAvailability } from '@/lib/auth/ojs-register'

export const dynamic = 'force-dynamic'

/**
 * Emails a registration code. The first step of creating an account; the code
 * is checked by /api/auth/register.
 *
 * This is the endpoint that sends mail to an address a stranger typed, so it
 * carries the captcha (registration itself no longer needs one: nobody reaches
 * it without a code from a real inbox) and three limits: per IP, per address
 * per hour, and the per-address cooldown inside issueCode.
 *
 * Before the code is sent, OJS is asked whether the username and address are
 * already taken (checkAvailability). Finding that out only after the person
 * has fetched a code from their inbox wasted the trip. The check runs after
 * the captcha, so it is no easier to use for looking up accounts than OJS's
 * own register form.
 */

type Body = { email?: string; username?: string; captchaToken?: string }

const tooMany = (retryAfter: number, message: string) =>
  NextResponse.json(
    { ok: false, error: 'rate-limited', retryAfter, message },
    { status: 429, headers: { 'Cache-Control': 'no-store', 'Retry-After': String(retryAfter) } },
  )

export const POST = handler(async (request) => {
  if (!databaseConfigured) {
    return jsonError('unavailable', 503, { message: 'Registration is temporarily unavailable. Please try again shortly.' })
  }

  const byIp = rateLimit(`email-code:${clientIp(request)}`, 6, 600_000)
  if (!byIp.ok) return tooMany(byIp.retryAfter, 'Too many codes requested. Please wait a few minutes and try again.')

  const body = await readJson<Body>(request)
  const v = new Validator()
  const email = v.email('email', body.email)
  const username = v.string({ field: 'username', value: body.username, label: 'Username', max: 32 })
  v.throwIfInvalid()

  const byAddress = rateLimit(`email-code-to:${normaliseEmail(email)}`, 5, 3_600_000)
  if (!byAddress.ok) return tooMany(byAddress.retryAfter, 'Too many codes have been sent to this address. Please try again later.')

  const blocked = await captchaGate(request, body.captchaToken, 'email-code')
  if (blocked) return blocked

  // Null means OJS could not be asked; the registration itself still checks.
  const taken = await checkAvailability({ email, username }, request.headers.get('user-agent'))
  if (taken?.length) return jsonError('validation', 422, { errors: taken })

  const result = await issueCode(email, 'register')
  if (!result.ok) {
    return tooMany(result.retryAfter, `A code was sent moments ago. You can ask for another in ${result.retryAfter} seconds.`)
  }
  if (!result.sent) {
    return jsonError('unavailable', 503, {
      message: 'We could not send the email just now. Please try again in a few minutes, or contact contact@nextgeniqpress.com.',
    })
  }

  return jsonOk({ sent: true, resendIn: OTP_RESEND_SECONDS, expiresInMinutes: OTP_TTL_MINUTES })
})
