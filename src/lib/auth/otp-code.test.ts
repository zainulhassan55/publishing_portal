import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cleanCode, generateCode, hashCode, normaliseEmail } from './otp-code.ts'

test('codes are always six digits, leading zeros included', () => {
  for (let i = 0; i < 500; i++) assert.match(generateCode(), /^\d{6}$/)
})

test('the hash depends on salt, address and code, and ignores address case', () => {
  const h = hashCode('123456', 'salt', 'A@Example.com')
  assert.equal(h, hashCode('123456', 'salt', 'a@example.com '))
  assert.notEqual(h, hashCode('123457', 'salt', 'a@example.com'))
  assert.notEqual(h, hashCode('123456', 'pepper', 'a@example.com'))
  assert.notEqual(h, hashCode('123456', 'salt', 'b@example.com'))
  assert.match(h, /^[0-9a-f]{64}$/)
})

test('typed or pasted codes are tidied before checking', () => {
  assert.equal(cleanCode(' 123 456 '), '123456')
  assert.equal(cleanCode('123-456'), '123456')
  assert.equal(cleanCode(123456), '')
  assert.equal(normaliseEmail('  Me@Site.ORG '), 'me@site.org')
})
