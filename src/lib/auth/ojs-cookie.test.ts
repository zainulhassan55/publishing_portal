import assert from 'node:assert/strict'
import { test } from 'node:test'
import { clearOjsSessionCookies, setOjsSessionCookie } from './ojs-cookie.ts'

/**
 * These tests exist because the bug they cover was invisible in review: the
 * code read as four cookie clears and emitted one. Next's `ResponseCookies`
 * keys its map on the cookie name alone, so same-name forms collapsed to the
 * last writer and the host-only OJSSID survived every sign-out — shadowing the
 * next good session and dropping a signed-in reader on the OJS login form.
 *
 * So every assertion here counts headers rather than trusting one.
 */

const requestFrom = (host: string) => new Request('https://example.test/api/auth/sign-in', { headers: { host } })

const responseWith = () => ({ headers: new Headers() })

const cookiesOf = (response: { headers: Headers }) =>
  response.headers.getSetCookie().filter((c) => c.startsWith('OJSSID='))

/** Set-Cookie attribute lookup, case-insensitive as the header is. */
const attr = (cookie: string, name: string) =>
  cookie
    .split(';')
    .map((p) => p.trim())
    .find((p) => p.toLowerCase().startsWith(`${name.toLowerCase()}=`))
    ?.split('=')[1]

test('setOjsSessionCookie emits one live cookie and evicts the other three forms', () => {
  const response = responseWith()
  setOjsSessionCookie(response, requestFrom('www.nextgeniqpress.com'), 'live-sid')

  const cookies = cookiesOf(response)
  assert.equal(cookies.length, 4, 'all four (domain, path) forms must be addressed')

  const live = cookies.filter((c) => c.includes('live-sid'))
  assert.equal(live.length, 1, 'exactly one form carries the session')
  assert.equal(attr(live[0], 'Path'), '/ojs/')
  assert.equal(attr(live[0], 'Domain'), 'www.nextgeniqpress.com')

  const cleared = cookies.filter((c) => !c.includes('live-sid'))
  assert.equal(cleared.length, 3)
  for (const cookie of cleared) {
    assert.equal(attr(cookie, 'Max-Age'), '0', `stale form not expired: ${cookie}`)
  }

  // The host-only copy at the OJS path is the one that caused the bug: it is
  // sent on the very request this response redirects into.
  const hostOnlyAtOjsPath = cleared.find((c) => attr(c, 'Path') === '/ojs/' && !attr(c, 'Domain'))
  assert.ok(hostOnlyAtOjsPath, 'the host-only copy at the OJS path must be cleared')
})

test('setOjsSessionCookie never clears the form it is installing', () => {
  const response = responseWith()
  setOjsSessionCookie(response, requestFrom('www.nextgeniqpress.com'), 'live-sid')

  const sameTuple = cookiesOf(response).filter(
    (c) => attr(c, 'Path') === '/ojs/' && attr(c, 'Domain') === 'www.nextgeniqpress.com',
  )
  assert.equal(sameTuple.length, 1, 'the live tuple must not also receive a Max-Age=0')
  assert.ok(sameTuple[0].includes('live-sid'))
})

test('localhost gets no Domain attribute, and still evicts the path=/ copy', () => {
  const response = responseWith()
  setOjsSessionCookie(response, requestFrom('localhost:3000'), 'live-sid')

  const cookies = cookiesOf(response)
  assert.ok(
    cookies.every((c) => !attr(c, 'Domain')),
    'a Domain attribute on localhost is rejected by some browsers',
  )
  assert.equal(cookies.length, 2, 'host-only at /ojs/ (live) and at / (cleared)')

  const live = cookies.filter((c) => c.includes('live-sid'))
  assert.equal(live.length, 1)
  assert.equal(attr(live[0], 'Path'), '/ojs/')
})

test('clearOjsSessionCookies expires every form', () => {
  const response = responseWith()
  clearOjsSessionCookies(response, requestFrom('www.nextgeniqpress.com'))

  const cookies = cookiesOf(response)
  assert.equal(cookies.length, 4, 'sign-out must reach all four forms, not just the last written')
  for (const cookie of cookies) {
    assert.equal(attr(cookie, 'Max-Age'), '0')
  }

  const tuples = cookies.map((c) => `${attr(c, 'Domain') ?? '(host-only)'}|${attr(c, 'Path')}`)
  assert.equal(new Set(tuples).size, 4, 'the four clears must address four distinct tuples')
})

/**
 * The ordering contract the helpers depend on, asserted directly against Next's
 * cookie jar. If this test fails after a Next upgrade, read the ORDERING note
 * in ojs-cookie.ts: a `response.cookies.set` placed after these helpers wipes
 * every cookie they wrote, and the symptom is the login-form bounce returning
 * with no visible cause.
 */
test('Next cookies.set after an append discards appended cookies', async () => {
  const { ResponseCookies } = await import('next/dist/compiled/@edge-runtime/cookies/index.js')

  const safe = new Headers()
  const safeJar = new ResponseCookies(safe)
  safeJar.set({ name: 'ngiq_session', value: 'tok', path: '/' })
  setOjsSessionCookie({ headers: safe }, requestFrom('www.nextgeniqpress.com'), 'live-sid')
  assert.equal(safe.getSetCookie().filter((c) => c.startsWith('OJSSID=')).length, 4)
  assert.equal(safe.getSetCookie().filter((c) => c.startsWith('ngiq_session=')).length, 1)

  const unsafe = new Headers()
  const unsafeJar = new ResponseCookies(unsafe)
  setOjsSessionCookie({ headers: unsafe }, requestFrom('www.nextgeniqpress.com'), 'live-sid')
  unsafeJar.set({ name: 'ngiq_session', value: 'tok', path: '/' })
  assert.equal(
    unsafe.getSetCookie().filter((c) => c.startsWith('OJSSID=')).length,
    0,
    'documents the hazard: cookies.set last destroys the OJS cookies',
  )
})

test('every cookie is HttpOnly and SameSite=Lax, matching what OJS sets', () => {
  const response = responseWith()
  setOjsSessionCookie(response, requestFrom('www.nextgeniqpress.com'), 'live-sid')

  for (const cookie of cookiesOf(response)) {
    assert.match(cookie, /HttpOnly/)
    assert.match(cookie, /SameSite=Lax/)
  }
})
