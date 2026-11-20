/**
 * Checkout billing details: the rules for what may be entered.
 *
 * One module, used twice: by the checkout form, so a reader sees what is wrong
 * next to the field before anything is sent, and by /api/checkout, which is
 * the boundary that actually holds (a request can skip the form). A rejected
 * value is never cleared from the form; the reader corrects it in place.
 *
 * The rules are deliberately international: names and places may be in any
 * script (accents, Chinese, Thai, Arabic …), postcodes may contain letters
 * (UK, Canada, Netherlands), and some countries have no postcode at all.
 * What is refused is what is never a real name, address or phone number:
 * control characters, markup, links, email addresses outside the email field,
 * digits in a name or city, and fields made only of punctuation.
 */
import { isEmail, type FieldError } from '../validate.ts'

export type CheckoutFields = {
  email: string
  phone: string
  firstName: string
  lastName: string
  company: string
  street: string
  unit: string
  city: string
  /** ISO 3166-1 alpha-2, e.g. "TW". */
  country: string
  region: string
  postcode: string
}

export const CHECKOUT_KEYS: (keyof CheckoutFields)[] = ['email', 'phone', 'firstName', 'lastName', 'company', 'street', 'unit', 'city', 'country', 'region', 'postcode']

/** Longest accepted value per field; the form sets the same maxLength. */
export const MAX_LENGTH: Record<keyof CheckoutFields, number> = {
  email: 120,
  phone: 24,
  firstName: 60,
  lastName: 60,
  company: 120,
  street: 160,
  unit: 60,
  city: 80,
  country: 2,
  region: 80,
  postcode: 12,
}

/** Countries and territories without postcodes: the field is optional there. */
const NO_POSTCODE = new Set(
  'AE AG AO AW BF BI BJ BO BS BW BZ CD CF CG CI CK CM DJ DM ER FJ GA GD GH GM GQ GY HK JM KI KM KN KP LY ML MO MR MW NR NU QA RW SB SC SL SR ST SY TD TF TG TK TL TO TV UG VU YE ZW'.split(' '),
)

/** Postcode shapes for the countries buyers most often come from; elsewhere the generic rule applies. */
const POSTCODE_RULES: Record<string, { re: RegExp; example: string }> = {
  TW: { re: /^\d{3}(\d{2}|\d{3})?$/, example: '407 or 40743' },
  US: { re: /^\d{5}(-\d{4})?$/, example: '94105 or 94105-1234' },
  CN: { re: /^\d{6}$/, example: '100080' },
  IN: { re: /^\d{6}$/, example: '110001' },
  JP: { re: /^\d{3}-?\d{4}$/, example: '100-0001' },
  KR: { re: /^\d{5}$/, example: '03187' },
  TH: { re: /^\d{5}$/, example: '10330' },
  MY: { re: /^\d{5}$/, example: '50450' },
  SG: { re: /^\d{6}$/, example: '018956' },
  GB: { re: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i, example: 'SW1A 1AA' },
  CA: { re: /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/i, example: 'K1A 0B1' },
  AU: { re: /^\d{4}$/, example: '2000' },
  DE: { re: /^\d{5}$/, example: '10115' },
  FR: { re: /^\d{5}$/, example: '75001' },
  IT: { re: /^\d{5}$/, example: '00118' },
  ES: { re: /^\d{5}$/, example: '28001' },
  NL: { re: /^\d{4} ?[A-Z]{2}$/i, example: '1012 AB' },
  HR: { re: /^\d{5}$/, example: '10000' },
  GR: { re: /^\d{3} ?\d{2}$/, example: '546 21' },
  PK: { re: /^\d{5}$/, example: '44000' },
  BD: { re: /^\d{4}$/, example: '1000' },
  VN: { re: /^\d{6}$/, example: '100000' },
  ID: { re: /^\d{5}$/, example: '10110' },
  PH: { re: /^\d{4}$/, example: '1000' },
}

export const postcodeRequired = (country: string) => !NO_POSTCODE.has(country.toUpperCase())

// Groupings and reserved codes are not places to bill.
const NOT_PLACES = new Set(['EU', 'EZ', 'UN', 'QO', 'ZZ', 'AA', 'QM', 'QN', 'QP', 'QQ', 'QR', 'QS', 'QT', 'QU', 'QV', 'QW', 'QX', 'QY', 'QZ'])

/** Every country and territory the runtime knows, as { code, name } in English, sorted by name. */
export function countryList(): { code: string; name: string }[] {
  const names = new Intl.DisplayNames(['en'], { type: 'region' })
  const out: { code: string; name: string }[] = []
  for (let a = 65; a <= 90; a++) {
    for (let b = 65; b <= 90; b++) {
      const code = String.fromCharCode(a, b)
      if (NOT_PLACES.has(code) || code.startsWith('X')) continue
      const name = names.of(code)
      if (name && name !== code) out.push({ code, name })
    }
  }
  return out.sort((x, y) => x.name.localeCompare(y.name))
}

let countryCodes: Set<string> | null = null
export const isCountryCode = (code: string) => /^[A-Z]{2}$/.test(code) && (countryCodes ??= new Set(countryList().map((c) => c.code))).has(code)

/** English name of a country code ("TW" → "Taiwan"); the code itself if unknown. */
export const countryName = (code: string) => {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code
  } catch {
    return code
  }
}

/** Trim, collapse inner whitespace, upper-case the country code. Applied before validating and sending. */
export function normalizeCheckout(raw: Partial<Record<keyof CheckoutFields, unknown>>): CheckoutFields {
  const out = {} as CheckoutFields
  for (const k of CHECKOUT_KEYS) {
    const v = typeof raw[k] === 'string' ? (raw[k] as string) : ''
    out[k] = v.replace(/\s+/g, ' ').trim()
  }
  out.country = out.country.toUpperCase()
  out.email = out.email.toLowerCase()
  return out
}

const CONTROL = /[\u0000-\u001F\u007F-\u009F]/
const MARKUP = /[<>{}\\`|^$]/
const LINK = /(https?:\/\/|www\.)/i
const HAS_LETTER = /[\p{L}]/u
// A person's name: letters in any script, plus the joiners real names use.
const NAME = /^[\p{L}\p{M}][\p{L}\p{M}'’.\- ·]*$/u
// A place name (city, region): letters, spaces and a little punctuation, no digits.
const PLACE = /^[\p{L}\p{M}][\p{L}\p{M}'’.\-(), ]*$/u
// An address line: letters, digits and the punctuation addresses use (No. 12, #3F-2, 3/F, Rd.).
const ADDRESS = /^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}'’.,#\/\-()&:;° ]*$/u
// An organisation: as an address line, plus "+" and "@"-free symbols seen in company names.
const ORG = /^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}'’.,#\/\-()&:;+! ]*$/u

/** Field-by-field problems; an empty list means the details can be accepted. */
export function validateCheckout(f: CheckoutFields): FieldError[] {
  const errors: FieldError[] = []
  const add = (field: keyof CheckoutFields, message: string) => {
    if (!errors.some((e) => e.field === field)) errors.push({ field, message })
  }

  for (const k of CHECKOUT_KEYS) {
    const v = f[k]
    if (v.length > MAX_LENGTH[k]) add(k, `This is too long (at most ${MAX_LENGTH[k]} characters).`)
    if (CONTROL.test(v) || MARKUP.test(v)) add(k, 'Remove the symbols < > { } \\ ` | ^ $ — they are not used in names or addresses.')
    if (k !== 'email' && (LINK.test(v) || v.includes('@'))) add(k, 'Links and email addresses do not belong in this field.')
  }

  // Contact
  if (!f.email) add('email', 'Enter your email address.')
  else if (!isEmail(f.email)) add('email', 'Enter a valid email address, like name@example.com.')

  if (f.phone) {
    const digits = f.phone.replace(/\D/g, '')
    if (!/^\+?[\d\s().\-]+$/.test(f.phone)) add('phone', 'Use only digits, spaces, + - ( ) in a phone number.')
    else if (digits.length < 7 || digits.length > 15) add('phone', 'A phone number has 7 to 15 digits, including the country code.')
    else if (/^(\d)\1+$/.test(digits)) add('phone', 'Enter your real phone number, or leave it empty.')
  }

  // Name
  for (const [k, label] of [['firstName', 'first name'], ['lastName', 'last name']] as const) {
    if (!f[k]) add(k, `Enter your ${label}.`)
    else if (!NAME.test(f[k])) add(k, `Use letters only in your ${label} (hyphens, apostrophes and spaces are fine).`)
  }

  // Organisation (optional)
  if (f.company && (!ORG.test(f.company) || !/[\p{L}\p{N}]/u.test(f.company))) add('company', 'Use letters, digits and ordinary punctuation in the organisation name.')

  // Address
  if (!f.street) add('street', 'Enter your street address.')
  else if (f.street.length < 3 || !HAS_LETTER.test(f.street)) add('street', 'Enter a full street address, including the street name.')
  else if (!ADDRESS.test(f.street)) add('street', 'Use letters, digits and ordinary punctuation (. , # / - ) in the address.')

  if (f.unit && (!ADDRESS.test(f.unit) || !/[\p{L}\p{N}]/u.test(f.unit))) add('unit', 'Use letters, digits and ordinary punctuation (. , # / - ) here.')

  if (!f.city) add('city', 'Enter your city or town.')
  else if (f.city.length < 2 || !PLACE.test(f.city)) add('city', 'Use letters only in the city name.')

  if (f.region && !PLACE.test(f.region)) add('region', 'Use letters only in the state or province.')

  if (!f.country) add('country', 'Select your country or region.')
  else if (!isCountryCode(f.country)) add('country', 'Select your country or region from the list.')

  const rule = POSTCODE_RULES[f.country]
  if (!f.postcode) {
    if (postcodeRequired(f.country)) add('postcode', 'Enter your postal code.')
  } else if (!/^[A-Za-z0-9][A-Za-z0-9 \-]{1,11}$/.test(f.postcode) || !/\d/.test(f.postcode)) {
    add('postcode', 'A postal code has digits, and may also have letters, spaces and hyphens.')
  } else if (rule && !rule.re.test(f.postcode)) {
    add('postcode', `This is not a valid postal code for ${countryName(f.country)} (for example ${rule.example}).`)
  }

  return errors
}
