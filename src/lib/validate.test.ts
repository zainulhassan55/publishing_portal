import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Validator, isDoi, isEmail, isOrcid, isRor } from './validate.ts'

test('isOrcid verifies the MOD 11-2 check digit, not just the shape', () => {
  // Real, published ORCID iDs.
  assert.equal(isOrcid('0000-0002-1825-0097'), true)
  assert.equal(isOrcid('0000-0001-5109-3700'), true)
  assert.equal(isOrcid('0000-0002-1694-233X'), true)
  // Correct shape, wrong check digit — the case a regex alone would accept.
  assert.equal(isOrcid('0000-0002-1825-0098'), false)
  assert.equal(isOrcid('0000-0003-4321-1234'), false)
  // 0000-0000-0000-0001 is checksum-valid: all-zero body gives check digit 1.
  // Kept as a reminder that the checksum bounds typos, not plausibility.
  assert.equal(isOrcid('0000-0000-0000-0001'), true)
})

test('isOrcid accepts the full URL form and rejects malformed input', () => {
  assert.equal(isOrcid('https://orcid.org/0000-0002-1825-0097'), true)
  assert.equal(isOrcid('0000-0002-1825'), false)
  assert.equal(isOrcid('not-an-orcid'), false)
  assert.equal(isOrcid(''), false)
})

test('isEmail accepts ordinary addresses and rejects obvious breakage', () => {
  assert.equal(isEmail('a.okafor@example.ac.uk'), true)
  assert.equal(isEmail('name+tag@sub.domain.org'), true)
  assert.equal(isEmail('no-at-sign.example.com'), false)
  assert.equal(isEmail('spaces in@example.com'), false)
  assert.equal(isEmail('trailing@dot.'), false)
})

test('isRor matches the 9-character identifier', () => {
  assert.equal(isRor('024mrxd33'), true)
  assert.equal(isRor('https://ror.org/024mrxd33'), true)
  assert.equal(isRor('124mrxd33'), false)
  assert.equal(isRor('024mrxd3'), false)
})

test('isDoi requires a registrant prefix and a suffix', () => {
  assert.equal(isDoi('10.63521/ijdh.2026.0014'), true)
  assert.equal(isDoi('10.1016/j.jacc.2015.10.044'), true)
  assert.equal(isDoi('11.63521/x'), false)
  assert.equal(isDoi('10.63521/'), false)
})

test('Validator collects every problem rather than stopping at the first', () => {
  const v = new Validator()
  v.string({ field: 'title', value: '', label: 'Title', required: true })
  v.email('email', 'bad')
  v.accepted('agree', false, 'You must agree')

  assert.equal(v.ok, false)
  assert.deepEqual(
    v.problems.map((p) => p.field),
    ['title', 'email', 'agree'],
  )
})

test('Validator trims values and enforces length bounds', () => {
  const v = new Validator()
  assert.equal(v.string({ field: 'a', value: '  padded  ', label: 'A' }), 'padded')
  v.string({ field: 'short', value: 'ab', label: 'Short', min: 5 })
  v.string({ field: 'long', value: 'x'.repeat(20), label: 'Long', max: 10 })
  assert.deepEqual(
    v.problems.map((p) => p.field),
    ['short', 'long'],
  )
})

test('Validator optional empty field is not an error', () => {
  const v = new Validator()
  v.string({ field: 'note', value: '', label: 'Note' })
  v.orcid('orcid', '')
  assert.equal(v.ok, true)
})

test('oneOf rejects a value outside the allowed set', () => {
  const v = new Validator()
  assert.equal(v.oneOf('t', 'Review', ['Review', 'Editorial'] as const, 'Type'), 'Review')
  assert.equal(v.oneOf('u', 'Pamphlet', ['Review', 'Editorial'] as const, 'Type'), '')
  assert.equal(v.problems.length, 1)
})

test('throwIfInvalid raises a ValidationError carrying the field errors', () => {
  const v = new Validator()
  v.email('email', '')
  assert.throws(
    () => v.throwIfInvalid(),
    (error: unknown) => error instanceof Error && error.name === 'ValidationError',
  )
})
