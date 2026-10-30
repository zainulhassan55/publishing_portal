import { createHash, randomInt } from 'node:crypto'

/** The pure parts of email codes, kept apart from the database so they can be unit tested. See email-otp.ts. */

export const normaliseEmail = (email: string) => email.trim().toLowerCase()

/** Six digits, leading zeros allowed, from the CSPRNG. */
export const generateCode = () => String(randomInt(0, 1_000_000)).padStart(6, '0')

export const hashCode = (code: string, salt: string, email: string) =>
  createHash('sha256').update(`${salt}:${normaliseEmail(email)}:${code}`).digest('hex')

/** Accepts "123 456" or "123-456" as typed or pasted. */
export const cleanCode = (value: unknown) => (typeof value === 'string' ? value.replace(/[\s-]/g, '') : '')
