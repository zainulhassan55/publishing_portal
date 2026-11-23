/**
 * "Continue with Google" for the book shop: the OAuth 2.0 authorization-code
 * flow with PKCE against Google's OpenID Connect endpoints.
 *
 * Shop only, and on purpose (publisher, November 2026): a Google sign-in lets a
 * reader buy chapters and books. It is NOT an OJS account and grants nothing in
 * the journals. Authors, reviewers and editors keep signing in with their OJS
 * account through /sign-in. See src/lib/shop/buyer.ts for how the two meet at
 * checkout.
 *
 * The ID token is taken straight from Google's token endpoint over TLS, in
 * exchange for the code and the client secret. OpenID Connect Core §3.1.3.7
 * allows TLS server validation in place of checking the token's signature in
 * that case, so no JWKS fetch is needed. The claims are still checked:
 * issuer, audience, expiry, nonce and a verified email.
 *
 * Pure apart from `exchangeCode`, so the checks are unit-tested
 * (google-oauth.test.ts). Explicit `.ts` extensions are there for the same
 * reason as in src/lib/auth/ojs-login.ts: `node --test` loads this file.
 */

import { createHash } from 'node:crypto'

export const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_ISSUERS = new Set(['https://accounts.google.com', 'accounts.google.com'])

/** The path Google sends the reader back to. Register it exactly in Google Cloud Console. */
export const GOOGLE_CALLBACK_PATH = '/api/shop/google/callback'

export type GoogleProfile = {
  /** Google's stable account id. */
  sub: string
  email: string
  fullName: string
  givenName: string
  familyName: string
}

/** RFC 7636 S256 code challenge for a verifier. */
export const pkceChallenge = (verifier: string): string => createHash('sha256').update(verifier).digest('base64url')

export function googleAuthUrl(args: { clientId: string; redirectUri: string; state: string; nonce: string; codeVerifier: string }): string {
  const url = new URL(GOOGLE_AUTH_URL)
  url.search = new URLSearchParams({
    client_id: args.clientId,
    redirect_uri: args.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: args.state,
    nonce: args.nonce,
    code_challenge: pkceChallenge(args.codeVerifier),
    code_challenge_method: 'S256',
    // Always show the account chooser: a shared computer must not silently
    // buy as whoever used Google on it last.
    prompt: 'select_account',
  }).toString()
  return url.toString()
}

/** The payload of a JWT, or null when it is not one. The signature is not checked; see the header. */
export function decodeJwtPayload(jwt: string): Record<string, unknown> | null {
  const parts = jwt.split('.')
  if (parts.length !== 3) return null
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
    return payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : null
  } catch {
    return null
  }
}

export type ClaimsCheck = { ok: true; profile: GoogleProfile } | { ok: false; reason: string }

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

/** Checks an ID token's claims and turns them into the buyer's profile. `now` is in seconds. */
export function checkIdTokenClaims(claims: Record<string, unknown> | null, expected: { clientId: string; nonce: string; now: number }): ClaimsCheck {
  if (!claims) return { ok: false, reason: 'not-a-token' }
  if (!GOOGLE_ISSUERS.has(str(claims.iss))) return { ok: false, reason: 'issuer' }
  const aud = claims.aud
  if (!(aud === expected.clientId || (Array.isArray(aud) && aud.includes(expected.clientId)))) return { ok: false, reason: 'audience' }
  // A minute's grace for clock drift between this server and Google.
  if (typeof claims.exp !== 'number' || claims.exp + 60 < expected.now) return { ok: false, reason: 'expired' }
  if (!expected.nonce || claims.nonce !== expected.nonce) return { ok: false, reason: 'nonce' }
  const sub = str(claims.sub)
  if (!sub) return { ok: false, reason: 'subject' }
  const email = str(claims.email).toLowerCase()
  // Google sends a string "true" on some older tokens.
  if (!email || !(claims.email_verified === true || claims.email_verified === 'true')) return { ok: false, reason: 'email-unverified' }

  const givenName = str(claims.given_name)
  const familyName = str(claims.family_name)
  return {
    ok: true,
    profile: {
      sub,
      email,
      givenName,
      familyName,
      fullName: str(claims.name) || [givenName, familyName].filter(Boolean).join(' '),
    },
  }
}

/** Trades the authorization code for tokens at Google; returns the ID token, or null. */
export async function exchangeCode(args: { code: string; clientId: string; clientSecret: string; redirectUri: string; codeVerifier: string }): Promise<string | null> {
  try {
    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: args.code,
        client_id: args.clientId,
        client_secret: args.clientSecret,
        redirect_uri: args.redirectUri,
        grant_type: 'authorization_code',
        code_verifier: args.codeVerifier,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    })
    const data = (await res.json().catch(() => ({}))) as { id_token?: string; error?: string }
    if (!res.ok || !data.id_token) {
      console.error(`[shop-google] token exchange answered ${res.status}${data.error ? ` (${data.error})` : ''}`)
      return null
    }
    return data.id_token
  } catch (error) {
    console.error('[shop-google] token exchange failed:', error)
    return null
  }
}
