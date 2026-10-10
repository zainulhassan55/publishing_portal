/**
 * Server-side validation.
 *
 * Hand-written rather than a schema library: the rules are few, they need
 * domain-specific checks (ORCID checksum, ROR shape) that a generic validator
 * would need custom refinements for anyway, and the error shape has to match
 * what the forms render.
 *
 * Client-side validation in the wizard is a convenience. This is the boundary
 * that actually has to hold.
 */

export type FieldError = { field: string; message: string }

export class ValidationError extends Error {
  // Declared as a field rather than a constructor parameter property: Node's
  // --experimental-strip-types runs the test suite without a transform, and
  // parameter properties need one.
  errors: FieldError[]

  constructor(errors: FieldError[]) {
    super('Validation failed')
    this.name = 'ValidationError'
    this.errors = errors
  }
}

export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())

/**
 * ORCID iDs carry an ISO 7064 MOD 11-2 check digit, so a typo is detectable.
 * Validating the shape alone would let 0000-0000-0000-0001 through.
 */
export function isOrcid(value: string): boolean {
  const trimmed = value.trim().replace(/^https?:\/\/orcid\.org\//, '')
  if (!/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(trimmed)) return false

  const digits = trimmed.replace(/-/g, '')
  let total = 0
  for (const char of digits.slice(0, 15)) {
    total = (total + Number(char)) * 2
  }
  const remainder = total % 11
  const expected = (12 - remainder) % 11
  const checkDigit = digits[15] === 'X' ? 10 : Number(digits[15])
  return checkDigit === expected
}

/** ROR IDs are a 9-character crockford-base32 string starting with 0. */
export const isRor = (value: string) =>
  /^(https?:\/\/ror\.org\/)?0[0-9a-hjkmnp-tv-z]{6}\d{2}$/.test(value.trim())

export const isDoi = (value: string) => /^10\.\d{4,9}\/\S+$/.test(value.trim())

type StringRule = {
  field: string
  value: unknown
  label: string
  required?: boolean
  min?: number
  max?: number
  pattern?: RegExp
  patternMessage?: string
}

export function validateString(rule: StringRule): { value: string; error?: FieldError } {
  const raw = typeof rule.value === 'string' ? rule.value.trim() : ''

  if (!raw) {
    return rule.required
      ? { value: '', error: { field: rule.field, message: `${rule.label} is required` } }
      : { value: '' }
  }

  if (rule.min && raw.length < rule.min) {
    return { value: raw, error: { field: rule.field, message: `${rule.label} must be at least ${rule.min} characters` } }
  }

  if (rule.max && raw.length > rule.max) {
    return { value: raw, error: { field: rule.field, message: `${rule.label} must be ${rule.max} characters or fewer` } }
  }

  if (rule.pattern && !rule.pattern.test(raw)) {
    return { value: raw, error: { field: rule.field, message: rule.patternMessage ?? `${rule.label} is not valid` } }
  }

  return { value: raw }
}

export class Validator {
  private errors: FieldError[] = []
  private values: Record<string, string> = {}

  string(rule: StringRule): string {
    const { value, error } = validateString(rule)
    if (error) this.errors.push(error)
    this.values[rule.field] = value
    return value
  }

  email(field: string, value: unknown, label = 'Email address', required = true): string {
    const raw = typeof value === 'string' ? value.trim() : ''
    if (!raw) {
      if (required) this.errors.push({ field, message: `${label} is required` })
      return ''
    }
    if (!isEmail(raw)) this.errors.push({ field, message: `Enter a valid ${label.toLowerCase()}` })
    return raw
  }

  orcid(field: string, value: unknown, label = 'ORCID iD', required = false): string {
    const raw = typeof value === 'string' ? value.trim() : ''
    if (!raw) {
      if (required) this.errors.push({ field, message: `${label} is required` })
      return ''
    }
    if (!isOrcid(raw)) {
      this.errors.push({ field, message: `${label} must be in the form 0000-0002-1825-0097` })
    }
    return raw.replace(/^https?:\/\/orcid\.org\//, '')
  }

  oneOf<T extends string>(field: string, value: unknown, allowed: readonly T[], label: string, required = true): T | '' {
    const raw = typeof value === 'string' ? value.trim() : ''
    if (!raw) {
      if (required) this.errors.push({ field, message: `${label} is required` })
      return ''
    }
    if (!allowed.includes(raw as T)) {
      this.errors.push({ field, message: `${label} is not a recognised value` })
      return ''
    }
    return raw as T
  }

  accepted(field: string, value: unknown, message: string): boolean {
    const ok = value === true || value === 'true' || value === 'on' || value === '1'
    if (!ok) this.errors.push({ field, message })
    return ok
  }

  add(error: FieldError) {
    this.errors.push(error)
  }

  get ok() {
    return this.errors.length === 0
  }

  get problems() {
    return this.errors
  }

  throwIfInvalid() {
    if (this.errors.length > 0) throw new ValidationError(this.errors)
  }
}
