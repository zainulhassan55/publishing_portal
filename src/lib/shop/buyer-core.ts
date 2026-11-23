/**
 * Who is buying: the pure half of src/lib/shop/buyer.ts, kept apart so it can
 * be unit-tested without next/headers.
 *
 * A buyer is one of two things, and they stay separate:
 *
 *   - `member`: signed in with an OJS account through /sign-in. Same account
 *     as the journals; nothing about it changes here.
 *   - `google`: signed in with Google on the shop's own sign-in page. Good for
 *     buying only. It is not an OJS account, opens nothing in the journals,
 *     and is not seen by `getSession()`, so every journal and form page still
 *     treats this reader as signed out.
 */

import type { GoogleProfile } from './google-oauth.ts'

/** The shop's Google sign-in cookie. Nothing to do with `ngiq_session` or OJSSID. */
export const SHOP_BUYER_COOKIE = 'ngiq_shop'
/** Holds state, nonce and PKCE verifier between /start and /callback. */
export const SHOP_OAUTH_COOKIE = 'ngiq_shop_oauth'
/** Path of the OAuth cookie: only the two Google routes ever receive it. */
export const SHOP_OAUTH_COOKIE_PATH = '/api/shop/google'

/** Same as the portal session, so neither way of signing in outlasts the other. */
export const SHOP_BUYER_TTL_SECONDS = 7 * 24 * 60 * 60
/** Long enough to pick an account at Google, short enough to be useless if copied. */
export const SHOP_OAUTH_TTL_SECONDS = 10 * 60

export type MemberBuyer = {
  kind: 'member'
  id: number
  userName: string
  email: string
  fullName: string
  givenName: string
  familyName: string
  affiliation: string
}

export type GoogleBuyer = { kind: 'google' } & GoogleProfile

export type Buyer = MemberBuyer | GoogleBuyer

export type BuyerCookie = GoogleProfile & { exp: number }

export type OAuthCookie = { state: string; nonce: string; verifier: string; next: string; exp: number }

/** The Google buyer a verified cookie payload describes, or null if it is missing a field. */
export function buyerFromCookie(payload: BuyerCookie | null): GoogleBuyer | null {
  if (!payload || typeof payload.sub !== 'string' || !payload.sub || typeof payload.email !== 'string' || !payload.email) return null
  return {
    kind: 'google',
    sub: payload.sub,
    email: payload.email,
    fullName: typeof payload.fullName === 'string' ? payload.fullName : '',
    givenName: typeof payload.givenName === 'string' ? payload.givenName : '',
    familyName: typeof payload.familyName === 'string' ? payload.familyName : '',
  }
}

/**
 * The `account` the payment Worker records with an order.
 *
 * The Worker keeps `{ id, userName, email }` and shows `userName` on the
 * orders dashboard. A Google buyer has no OJS id, so `id` is null and the name
 * says where the sign-in came from. The Worker cuts `userName` at 60 characters.
 */
export function orderAccount(buyer: Buyer): { id: number | null; userName: string; email: string } {
  if (buyer.kind === 'member') return { id: buyer.id, userName: buyer.userName, email: buyer.email }
  return { id: null, userName: `Google: ${buyer.email}`.slice(0, 60), email: buyer.email }
}

/** Where the shop sends a signed-out buyer, coming back to `next` afterwards. */
export const shopSignInHref = (next: string) => `/checkout/sign-in?next=${encodeURIComponent(next)}`
