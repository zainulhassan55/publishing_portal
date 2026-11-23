import { NextResponse } from 'next/server'
import { enforceRateLimit, handler, publicBaseUrl, tokenUrlSafe } from '@/lib/api'
import { safeNext, signInHref } from '@/lib/auth/links'
import { shopGoogleEnabled } from '@/lib/shop/buyer'
import { SHOP_OAUTH_COOKIE, SHOP_OAUTH_COOKIE_PATH, SHOP_OAUTH_TTL_SECONDS } from '@/lib/shop/buyer-core'
import { GOOGLE_CALLBACK_PATH, googleAuthUrl } from '@/lib/shop/google-oauth'
import { signValue } from '@/lib/shop/signed-cookie'

export const dynamic = 'force-dynamic'

/**
 * "Continue with Google" on the shop's sign-in page: remembers state, nonce
 * and the PKCE verifier in a short-lived signed cookie, then sends the reader
 * to Google. Google returns them to ../callback. Shop only; see
 * src/lib/shop/google-oauth.ts.
 */
export const GET = handler(async (request) => {
  const base = publicBaseUrl(request)
  const next = safeNext(new URL(request.url).searchParams.get('next'), '/checkout')

  // Not configured: the OJS sign-in still works for buying.
  if (!shopGoogleEnabled()) return NextResponse.redirect(new URL(signInHref(next), base), { status: 302 })

  enforceRateLimit(request, 'shop-google-start', 20)

  const flow = { state: tokenUrlSafe(), nonce: tokenUrlSafe(), verifier: tokenUrlSafe(), next }
  const response = NextResponse.redirect(
    googleAuthUrl({
      clientId: process.env.GOOGLE_CLIENT_ID!.trim(),
      redirectUri: new URL(GOOGLE_CALLBACK_PATH, base).toString(),
      state: flow.state,
      nonce: flow.nonce,
      codeVerifier: flow.verifier,
    }),
    { status: 302 },
  )
  response.headers.set('Cache-Control', 'no-store')
  response.cookies.set({
    name: SHOP_OAUTH_COOKIE,
    value: signValue({ ...flow, exp: Math.floor(Date.now() / 1000) + SHOP_OAUTH_TTL_SECONDS }, process.env.SHOP_SESSION_SECRET!.trim()),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    // Lax, not Strict: Google's redirect back is a cross-site top-level GET,
    // which Lax still sends the cookie on.
    sameSite: 'lax',
    path: SHOP_OAUTH_COOKIE_PATH,
    maxAge: SHOP_OAUTH_TTL_SECONDS,
  })
  return response
})
