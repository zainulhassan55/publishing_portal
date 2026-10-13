import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { csrfTokenFor, csrfTokenMatches, originAllowed } from './csrf.ts'

test('the token is derived from the session token and is stable', () => {
  assert.equal(csrfTokenFor('session-abc'), csrfTokenFor('session-abc'))
  assert.notEqual(csrfTokenFor('session-abc'), csrfTokenFor('session-abd'))
  // Hex sha256.
  assert.match(csrfTokenFor('session-abc'), /^[0-9a-f]{64}$/)
})

test('the token is not the session token, nor a bare hash of it', () => {
  // If these were ever equal, rendering the CSRF token into the page would leak
  // a session credential into readable HTML.
  const session = 'session-abc'
  assert.notEqual(csrfTokenFor(session), session)
  assert.ok(!csrfTokenFor(session).includes(session))
})

test('csrfTokenMatches accepts the right token and rejects everything else', () => {
  const expected = csrfTokenFor('session-abc')
  assert.equal(csrfTokenMatches(expected, expected), true)
  assert.equal(csrfTokenMatches(expected, csrfTokenFor('other-session')), false)
})

test('a missing, empty or truncated token is rejected rather than throwing', () => {
  // timingSafeEqual throws on a length mismatch, so a short token must be
  // length-checked first or a forged request becomes a 500 instead of a 403.
  const expected = csrfTokenFor('session-abc')
  assert.equal(csrfTokenMatches(expected, null), false)
  assert.equal(csrfTokenMatches(expected, undefined), false)
  assert.equal(csrfTokenMatches(expected, ''), false)
  assert.equal(csrfTokenMatches(expected, expected.slice(0, 32)), false)
  assert.equal(csrfTokenMatches(expected, `${expected}extra`), false)
})

const requestWith = (origin: string | null, url = 'https://portal.example/api/admin/x') =>
  new Request(url, { headers: origin ? { origin } : {} })

test('originAllowed accepts the configured origin and refuses another', () => {
  const site = 'https://portal.example'
  assert.equal(originAllowed(requestWith('https://portal.example'), site), true)
  assert.equal(originAllowed(requestWith('https://evil.example'), site), false)
  // A port or scheme difference is a different origin.
  assert.equal(originAllowed(requestWith('http://portal.example'), site), false)
  assert.equal(originAllowed(requestWith('https://portal.example:8443'), site), false)
})

test('an absent Origin is allowed — it is a same-origin navigation or a server caller', () => {
  assert.equal(originAllowed(requestWith(null), 'https://portal.example'), true)
})

test('with no configured site URL, the request host is the comparison', () => {
  assert.equal(originAllowed(requestWith('https://portal.example'), undefined), true)
  assert.equal(originAllowed(requestWith('https://evil.example'), undefined), false)
})

test('a malformed Origin is refused rather than accepted by accident', () => {
  assert.equal(originAllowed(requestWith('not a url'), 'https://portal.example'), false)
  assert.equal(originAllowed(requestWith('not a url'), undefined), false)
})
