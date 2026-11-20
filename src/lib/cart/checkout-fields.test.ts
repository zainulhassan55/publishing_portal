import { test } from 'node:test'
import assert from 'node:assert/strict'
import { countryList, isCountryCode, normalizeCheckout, postcodeRequired, validateCheckout, type CheckoutFields } from './checkout-fields.ts'

const good: CheckoutFields = {
  email: 'mei.chen@asia.edu.tw',
  phone: '+886 4 2332-3456',
  firstName: 'Mei-Ling',
  lastName: 'Chen',
  company: 'Asia University',
  street: 'No. 500, Liufeng Rd.',
  unit: '3F-2',
  city: 'Taichung',
  country: 'TW',
  region: 'Wufeng District',
  postcode: '41354',
}

const fieldsWithErrors = (patch: Partial<CheckoutFields>) => validateCheckout({ ...good, ...patch }).map((e) => e.field)

test('ordinary international details are accepted', () => {
  assert.deepEqual(validateCheckout(good), [])
  const others: Partial<CheckoutFields>[] = [
    { firstName: 'José', lastName: "O'Brien-Núñez", city: 'São Paulo', country: 'BR', postcode: '01310-100', phone: '' },
    { firstName: '美玲', lastName: '陳', street: '柳豐路500號', city: '台中市', region: '霧峰區', postcode: '413' },
    { firstName: 'Dragan', lastName: 'Peraković', city: 'Zagreb', country: 'HR', postcode: '10000', street: 'Vukelićeva 4' },
    { country: 'GB', postcode: 'SW1A 1AA', city: 'London', street: '10 Downing Street', region: '' },
    { country: 'US', postcode: '94105-1234', city: 'San Francisco', region: 'California', phone: '(415) 555-0123' },
    { country: 'HK', postcode: '', city: 'Hong Kong', street: 'Flat 3/F, 12 Nathan Road' },
    { country: 'TH', postcode: '10330', city: 'Bangkok', firstName: 'สมชาย', lastName: 'ใจดี' },
    { company: '', unit: '', region: '', phone: '' },
  ]
  for (const o of others) assert.deepEqual(validateCheckout({ ...good, ...o }), [], JSON.stringify(o))
})

test('phone numbers: digits, + - ( ) and spaces only, 7–15 digits', () => {
  assert.deepEqual(fieldsWithErrors({ phone: 'call me' }), ['phone'])
  assert.deepEqual(fieldsWithErrors({ phone: '12345' }), ['phone'])
  assert.deepEqual(fieldsWithErrors({ phone: '+1 234 567 890 123 456 78' }), ['phone'])
  assert.deepEqual(fieldsWithErrors({ phone: '0000000000' }), ['phone'])
  assert.deepEqual(fieldsWithErrors({ phone: '0912-345-678 ext 2' }), ['phone'])
  assert.deepEqual(fieldsWithErrors({ phone: '0912345678' }), [])
})

test('names: letters in any script, no digits or symbols', () => {
  assert.deepEqual(fieldsWithErrors({ firstName: 'Mei1' }), ['firstName'])
  assert.deepEqual(fieldsWithErrors({ lastName: '!!!' }), ['lastName'])
  assert.deepEqual(fieldsWithErrors({ firstName: '' }), ['firstName'])
  assert.deepEqual(fieldsWithErrors({ firstName: '<script>' }), ['firstName'])
  assert.deepEqual(fieldsWithErrors({ lastName: 'a@b.com' }), ['lastName'])
})

test('addresses: need a street name, no links, markup or punctuation-only values', () => {
  assert.deepEqual(fieldsWithErrors({ street: '123' }), ['street'])
  assert.deepEqual(fieldsWithErrors({ street: '...' }), ['street'])
  assert.deepEqual(fieldsWithErrors({ street: 'https://spam.example' }), ['street'])
  assert.deepEqual(fieldsWithErrors({ street: 'Main St {x}' }), ['street'])
  assert.deepEqual(fieldsWithErrors({ unit: '---' }), ['unit'])
  assert.deepEqual(fieldsWithErrors({ city: 'Taichung 2' }), ['city'])
  assert.deepEqual(fieldsWithErrors({ city: '' }), ['city'])
  assert.deepEqual(fieldsWithErrors({ region: 'www.example.com' }), ['region'])
  assert.deepEqual(fieldsWithErrors({ company: '###' }), ['company'])
})

test('postcodes follow the country', () => {
  assert.deepEqual(fieldsWithErrors({ postcode: '12' }), ['postcode']) // TW needs 3, 5 or 6 digits
  assert.deepEqual(fieldsWithErrors({ postcode: 'ABCDE' }), ['postcode'])
  assert.deepEqual(fieldsWithErrors({ postcode: '' }), ['postcode'])
  assert.deepEqual(fieldsWithErrors({ country: 'US', postcode: '9410' }), ['postcode'])
  assert.deepEqual(fieldsWithErrors({ country: 'GB', postcode: '12345' }), ['postcode'])
  assert.equal(postcodeRequired('HK'), false)
  assert.equal(postcodeRequired('TW'), true)
})

test('email and country', () => {
  assert.deepEqual(fieldsWithErrors({ email: 'not-an-email' }), ['email'])
  assert.deepEqual(fieldsWithErrors({ email: 'a@b.com>, c@d.com' }), ['email'])
  assert.deepEqual(fieldsWithErrors({ country: '' }), ['country'])
  assert.deepEqual(fieldsWithErrors({ country: 'EU' }), ['country'])
  assert.deepEqual(fieldsWithErrors({ country: 'Taiwan' }), ['country'])
  assert.ok(isCountryCode('TW') && isCountryCode('TH') && !isCountryCode('ZZ'))
  assert.ok(countryList().length > 200)
})

test('length limits and control characters', () => {
  assert.deepEqual(fieldsWithErrors({ firstName: 'A'.repeat(61) }), ['firstName'])
  assert.deepEqual(fieldsWithErrors({ street: 'Main St\u0000' }), ['street'])
})

test('normalizing trims, collapses spaces, upper-cases the country and lower-cases the email', () => {
  const n = normalizeCheckout({ email: '  Mei@Asia.EDU.tw ', firstName: '  Mei   Ling ', country: 'tw', phone: 42 })
  assert.equal(n.email, 'mei@asia.edu.tw')
  assert.equal(n.firstName, 'Mei Ling')
  assert.equal(n.country, 'TW')
  assert.equal(n.phone, '')
  assert.equal(n.street, '')
})
