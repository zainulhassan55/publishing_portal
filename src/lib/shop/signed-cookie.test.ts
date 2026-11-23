import { strict as assert } from 'node:assert'
import { createHmac } from 'node:crypto'
import { test } from 'node:test'
import { signValue, verifyValue } from './signed-cookie.ts'
import { buyerFromCookie, orderAccount, shopSignInHref } from './buyer-core.ts'

const SECRET = 'x'.repeat(40)
const NOW = 1_800_000_000

test('a signed value reads back until it expires', () => {
  const v = signValue({ sub: 's', email: 'a@b.c', exp: NOW + 10 }, SECRET)
  assert.deepEqual(verifyValue(v, SECRET, NOW), { sub: 's', email: 'a@b.c', exp: NOW + 10 })
  assert.equal(verifyValue(v, SECRET, NOW + 10), null)
})

test('a tampered payload, signature or secret is refused', () => {
  const v = signValue({ email: 'a@b.c', exp: NOW + 10 }, SECRET)
  const [body, sig] = v.split('.')
  const forged = Buffer.from(JSON.stringify({ email: 'admin@b.c', exp: NOW + 10 })).toString('base64url')
  assert.equal(verifyValue(`${forged}.${sig}`, SECRET, NOW), null)
  assert.equal(verifyValue(`${body}.${sig.slice(0, -2)}AA`, SECRET, NOW), null)
  assert.equal(verifyValue(`${body}.`, SECRET, NOW), null)
  assert.equal(verifyValue(v, 'y'.repeat(40), NOW), null)
  assert.equal(verifyValue(`${v}.extra`, SECRET, NOW), null)
})

test('missing values and secrets are refused', () => {
  assert.equal(verifyValue(undefined, SECRET, NOW), null)
  assert.equal(verifyValue('', SECRET, NOW), null)
  assert.equal(verifyValue(signValue({ exp: NOW + 10 }, SECRET), '', NOW), null)
  assert.throws(() => signValue({ exp: NOW }, ''))
})

test('a payload without a numeric exp is refused even when signed', () => {
  const body = Buffer.from(JSON.stringify({ email: 'a@b.c' })).toString('base64url')
  const v = signValue({ exp: NOW + 10 }, SECRET)
  // Re-sign a body with no exp by hand.
  const sig = createHmac('sha256', SECRET).update(body).digest('base64url')
  assert.ok(verifyValue(v, SECRET, NOW))
  assert.equal(verifyValue(`${body}.${sig}`, SECRET, NOW), null)
})

test('a cookie payload becomes a Google buyer only with sub and email', () => {
  const p = { sub: 's1', email: 'a@b.c', fullName: 'A B', givenName: 'A', familyName: 'B', exp: NOW }
  assert.deepEqual(buyerFromCookie(p), { kind: 'google', sub: 's1', email: 'a@b.c', fullName: 'A B', givenName: 'A', familyName: 'B' })
  assert.equal(buyerFromCookie(null), null)
  assert.equal(buyerFromCookie({ ...p, sub: '' }), null)
  assert.equal(buyerFromCookie({ ...p, email: '' }), null)
})

test('the order account says where the sign-in came from', () => {
  assert.deepEqual(
    orderAccount({ kind: 'member', id: 7, userName: 'ada', email: 'a@b.c', fullName: '', givenName: '', familyName: '', affiliation: '' }),
    { id: 7, userName: 'ada', email: 'a@b.c' },
  )
  assert.deepEqual(orderAccount({ kind: 'google', sub: 's', email: 'a@b.c', fullName: '', givenName: '', familyName: '' }), {
    id: null,
    userName: 'Google: a@b.c',
    email: 'a@b.c',
  })
  const long = `${'x'.repeat(80)}@b.c`
  assert.equal(orderAccount({ kind: 'google', sub: 's', email: long, fullName: '', givenName: '', familyName: '' }).userName.length, 60)
})

test('the shop sign-in link carries the return path', () => {
  assert.equal(shopSignInHref('/checkout'), '/checkout/sign-in?next=%2Fcheckout')
})
