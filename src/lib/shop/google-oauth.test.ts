import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { checkIdTokenClaims, decodeJwtPayload, googleAuthUrl, pkceChallenge } from './google-oauth.ts'

const CLIENT = 'client-123.apps.googleusercontent.com'
const NOW = 1_800_000_000

const claims = (over: Record<string, unknown> = {}) => ({
  iss: 'https://accounts.google.com',
  aud: CLIENT,
  exp: NOW + 3600,
  nonce: 'n-1',
  sub: '10769150350006150715113082367',
  email: 'Reader@Example.com',
  email_verified: true,
  name: 'Ada Reader',
  given_name: 'Ada',
  family_name: 'Reader',
  ...over,
})
const check = (c: Record<string, unknown> | null) => checkIdTokenClaims(c, { clientId: CLIENT, nonce: 'n-1', now: NOW })

test('PKCE challenge is the RFC 7636 S256 value', () => {
  // Appendix B of RFC 7636.
  assert.equal(pkceChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'), 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM')
})

test('the auth URL carries the PKCE challenge, state, nonce and the account chooser', () => {
  const url = new URL(googleAuthUrl({ clientId: CLIENT, redirectUri: 'https://x.test/api/shop/google/callback', state: 's', nonce: 'n', codeVerifier: 'v' }))
  assert.equal(url.origin + url.pathname, 'https://accounts.google.com/o/oauth2/v2/auth')
  const p = url.searchParams
  assert.equal(p.get('response_type'), 'code')
  assert.equal(p.get('scope'), 'openid email profile')
  assert.equal(p.get('code_challenge'), pkceChallenge('v'))
  assert.equal(p.get('code_challenge_method'), 'S256')
  assert.equal(p.get('state'), 's')
  assert.equal(p.get('nonce'), 'n')
  assert.equal(p.get('prompt'), 'select_account')
  // The verifier itself never goes to the browser.
  assert.ok(!url.toString().includes('code_verifier'))
})

test('a JWT payload is decoded; anything else is null', () => {
  const body = Buffer.from(JSON.stringify({ a: 1 })).toString('base64url')
  assert.deepEqual(decodeJwtPayload(`h.${body}.sig`), { a: 1 })
  assert.equal(decodeJwtPayload('not-a-jwt'), null)
  assert.equal(decodeJwtPayload('a.!!!.c'), null)
  assert.equal(decodeJwtPayload(`h.${Buffer.from('[1]').toString('base64url')}.s`), null)
})

test('good claims become a profile with a lower-cased email', () => {
  const r = check(claims())
  assert.ok(r.ok)
  assert.deepEqual(r.profile, { sub: '10769150350006150715113082367', email: 'reader@example.com', fullName: 'Ada Reader', givenName: 'Ada', familyName: 'Reader' })
  assert.ok(check(claims({ iss: 'accounts.google.com' })).ok)
  assert.ok(check(claims({ aud: ['other', CLIENT] })).ok)
  assert.ok(check(claims({ email_verified: 'true' })).ok)
})

test('the full name falls back to given + family', () => {
  const r = check(claims({ name: undefined }))
  assert.ok(r.ok && r.profile.fullName === 'Ada Reader')
})

test('each bad claim is refused with its reason', () => {
  const reasons: [Record<string, unknown> | null, string][] = [
    [null, 'not-a-token'],
    [claims({ iss: 'https://evil.example' }), 'issuer'],
    [claims({ aud: 'someone-else' }), 'audience'],
    [claims({ exp: NOW - 61 }), 'expired'],
    [claims({ exp: undefined }), 'expired'],
    [claims({ nonce: 'other' }), 'nonce'],
    [claims({ nonce: undefined }), 'nonce'],
    [claims({ sub: '' }), 'subject'],
    [claims({ email_verified: false }), 'email-unverified'],
    [claims({ email: undefined }), 'email-unverified'],
  ]
  for (const [c, reason] of reasons) assert.deepEqual(check(c), { ok: false, reason })
})

test('a token within a minute of expiry still passes (clock drift)', () => {
  assert.ok(check(claims({ exp: NOW - 30 })).ok)
})

test('an empty expected nonce never matches', () => {
  assert.deepEqual(checkIdTokenClaims(claims({ nonce: '' }), { clientId: CLIENT, nonce: '', now: NOW }), { ok: false, reason: 'nonce' })
})
