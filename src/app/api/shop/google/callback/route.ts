import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { enforceRateLimit, handler, publicBaseUrl } from '@/lib/api'
import { safeNext } from '@/lib/auth/links'
import { shopGoogleEnabled } from '@/lib/shop/buyer'
import {
  SHOP_BUYER_COOKIE,
  SHOP_BUYER_TTL_SECONDS,
  SHOP_OAUTH_COOKIE,
  SHOP_OAUTH_COOKIE_PATH,
  shopSignInHref,
  type OAuthCookie,
} from '@/lib/shop/buyer-core'
import { GOOGLE_CALLBACK_PATH, checkIdTokenClaims, decodeJwtPayload, exchangeCode } from '@/lib/shop/google-oauth'
import { signValue, verifyValue } from '@/lib/shop/signed-cookie'

export const dynamic = 'force-dynamic'

const sameString = (a: string, b: string) => {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

/**
 * Google sends the reader back here. Checks the state against the cookie set
 * by ../start, trades the code for an ID token, checks its claims, and issues
 * the shop buyer cookie (`ngiq_shop`). Touches nothing in OJS and stores
 * nothing: the cookie is the whole record. Any failure goes back to the shop's
 * sign-in page with `?error=google`.
 */
export const GET = handler(async (request) => {
  enforceRateLimit(request, 'shop-google-callback', 20)

  const base = publicBaseUrl(request)
  const params = new URL(request.url).searchParams
  const secret = process.env.SHOP_SESSION_SECRET?.trim() || ''
  const flow = verifyValue<OAuthCookie>((await cookies()).get(SHOP_OAUTH_COOKIE)?.value, secret)
  const next = safeNext(flow?.next, '/checkout')

  const finish = (location: URL) => {
    const response = NextResponse.redirect(location, { status: 302 })
    response.headers.set('Cache-Control', 'no-store')
    // Single use: the flow cookie goes whatever the outcome.
    response.cookies.set({ name: SHOP_OAUTH_COOKIE, value: '', path: SHOP_OAUTH_COOKIE_PATH, maxAge: 0 })
    return response
  }
  const fail = (reason: string) => {
    console.warn(`[shop-google] sign-in not completed: ${reason}`)
    const back = new URL(shopSignInHref(next), base)
    // The reader pressing Cancel at Google is not an error worth a red message.
    if (reason !== 'access_denied') back.searchParams.set('error', 'google')
    return finish(back)
  }

  if (!shopGoogleEnabled()) return fail('not-configured')
  const googleError = params.get('error')
  if (googleError) return fail(googleError.slice(0, 40))
  if (!flow) return fail('no-or-expired-flow-cookie')

  const code = params.get('code') ?? ''
  const state = params.get('state') ?? ''
  if (!code || !state || !sameString(state, flow.state)) return fail('state-mismatch')

  const clientId = process.env.GOOGLE_CLIENT_ID!.trim()
  const idToken = await exchangeCode({
    code,
    clientId,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
    redirectUri: new URL(GOOGLE_CALLBACK_PATH, base).toString(),
    codeVerifier: flow.verifier,
  })
  if (!idToken) return fail('token-exchange')

  const checked = checkIdTokenClaims(decodeJwtPayload(idToken), { clientId, nonce: flow.nonce, now: Math.floor(Date.now() / 1000) })
  if (!checked.ok) return fail(`claims:${checked.reason}`)

  const response = finish(new URL(next, base))
  response.cookies.set({
    name: SHOP_BUYER_COOKIE,
    value: signValue({ ...checked.profile, exp: Math.floor(Date.now() / 1000) + SHOP_BUYER_TTL_SECONDS }, secret),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SHOP_BUYER_TTL_SECONDS,
  })
  return response
})
