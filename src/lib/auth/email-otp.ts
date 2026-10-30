import { randomBytes, timingSafeEqual } from 'node:crypto'
import { execute, query } from '../db'
import { sendTransactionalEmail } from '../email'
import { cleanCode, generateCode, hashCode, normaliseEmail } from './otp-code'

export { normaliseEmail } from './otp-code'

/**
 * Email one-time codes: proof that a person can read the inbox they typed.
 *
 * Registration is the only user today. OJS's own email validation cannot be
 * used (it would break the register-then-sign-in relay, see the register
 * route), so the portal sends a six-digit code first and only relays the
 * registration once the code comes back.
 *
 * The rules, and why:
 *   - Ten minutes to live: long enough for a slow inbox, short enough that a
 *     code found later is useless.
 *   - Five wrong guesses kill the code. Guessing one in a million in five
 *     tries is not a strategy.
 *   - A minute between sends per address, so the button cannot be used to
 *     flood someone's inbox. The route adds per-IP and per-address hourly caps.
 *   - Only a salted hash is stored. A correct code is deleted once the account
 *     exists, not when it is first matched: if OJS then refuses the username,
 *     the person fixes it and tries again without waiting for a new email.
 */

export type OtpPurpose = 'register'

export const OTP_TTL_MINUTES = 10
export const OTP_MAX_ATTEMPTS = 5
export const OTP_RESEND_SECONDS = 60

export type IssueResult = { ok: true; sent: boolean } | { ok: false; reason: 'cooldown'; retryAfter: number }

/** Creates a fresh code for the address, replacing any earlier one, and emails it. */
export async function issueCode(rawEmail: string, purpose: OtpPurpose): Promise<IssueResult> {
  const email = normaliseEmail(rawEmail)

  const [existing] = await query<{ age: number }>(
    'SELECT TIMESTAMPDIFF(SECOND, created_at, NOW()) AS age FROM email_otps WHERE email = ? AND purpose = ?',
    [email, purpose],
  )
  if (existing && Number(existing.age) < OTP_RESEND_SECONDS) {
    return { ok: false, reason: 'cooldown', retryAfter: OTP_RESEND_SECONDS - Number(existing.age) }
  }

  const code = generateCode()
  const salt = randomBytes(16).toString('hex')

  await execute(
    `INSERT INTO email_otps (email, purpose, code_hash, salt, attempts, expires_at, created_at)
     VALUES (?, ?, ?, ?, 0, NOW() + INTERVAL ${OTP_TTL_MINUTES} MINUTE, NOW())
     ON DUPLICATE KEY UPDATE code_hash = VALUES(code_hash), salt = VALUES(salt), attempts = 0,
       expires_at = VALUES(expires_at), created_at = VALUES(created_at)`,
    [email, purpose, hashCode(code, salt, email), salt],
  )

  // Housekeeping on the write path; there is no cron for a table this small.
  await execute('DELETE FROM email_otps WHERE expires_at < NOW() - INTERVAL 1 DAY').catch(() => undefined)

  const mail = await sendTransactionalEmail({
    to: email,
    subject: `${code} is your NextGenIQ Press verification code`,
    lines: [
      'Use this code to confirm your email address and finish creating your NextGenIQ Press account:',
      '',
      `    ${code}`,
      '',
      `It expires in ${OTP_TTL_MINUTES} minutes and can be used once.`,
      '',
      'If you did not try to create an account, ignore this email. Nobody can use your address without this code.',
    ],
  })

  if (!mail.sent) {
    // No email, no point keeping a code nobody can read, and no reason to make
    // them wait out the cooldown before trying again.
    await execute('DELETE FROM email_otps WHERE email = ? AND purpose = ?', [email, purpose]).catch(() => undefined)
  }

  return { ok: true, sent: mail.sent }
}

export type CheckResult = 'ok' | 'missing' | 'expired' | 'wrong' | 'locked'

/** Checks a code without using it up. A wrong guess counts against the code. */
export async function checkCode(rawEmail: string, purpose: OtpPurpose, rawCode: unknown): Promise<CheckResult> {
  const email = normaliseEmail(rawEmail)
  const code = cleanCode(rawCode)

  const [row] = await query<{ code_hash: string; salt: string; attempts: number; expired: number }>(
    'SELECT code_hash, salt, attempts, expires_at < NOW() AS expired FROM email_otps WHERE email = ? AND purpose = ?',
    [email, purpose],
  )
  if (!row) return 'missing'
  if (Number(row.expired)) return 'expired'
  if (Number(row.attempts) >= OTP_MAX_ATTEMPTS) return 'locked'

  const expected = Buffer.from(row.code_hash, 'hex')
  const actual = Buffer.from(hashCode(/^\d{6}$/.test(code) ? code : 'invalid', row.salt, email), 'hex')
  if (expected.length === actual.length && timingSafeEqual(expected, actual)) return 'ok'

  await execute('UPDATE email_otps SET attempts = attempts + 1 WHERE email = ? AND purpose = ?', [email, purpose])
  return Number(row.attempts) + 1 >= OTP_MAX_ATTEMPTS ? 'locked' : 'wrong'
}

/** Deletes the code once it has done its job. */
export async function consumeCode(rawEmail: string, purpose: OtpPurpose) {
  await execute('DELETE FROM email_otps WHERE email = ? AND purpose = ?', [normaliseEmail(rawEmail), purpose]).catch((error) =>
    console.error('[otp] could not delete a used code:', error),
  )
}

export const CHECK_MESSAGES: Record<Exclude<CheckResult, 'ok'>, string> = {
  missing: 'Request a verification code first.',
  expired: 'That code has expired. Send a new one.',
  wrong: 'That code is not right. Check the email and try again.',
  locked: 'Too many wrong codes. Send a new one.',
}
