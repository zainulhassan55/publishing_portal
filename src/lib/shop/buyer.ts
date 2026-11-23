import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { jsonError } from '@/lib/api'
import { getSession } from '@/lib/auth/session'
import { SHOP_BUYER_COOKIE, buyerFromCookie, shopSignInHref, type Buyer, type BuyerCookie } from './buyer-core'
import { verifyValue } from './signed-cookie'

export { orderAccount, shopSignInHref } from './buyer-core'
export type { Buyer } from './buyer-core'

/**
 * The shop's two gates, like requireMemberPage / requireMember in
 * src/lib/auth/require.ts, but satisfied by either an OJS member or a reader
 * who signed in with Google on the shop's sign-in page. Only the shop uses
 * these. Every other members-only page keeps requiring an OJS account.
 */

const shopSecret = () => process.env.SHOP_SESSION_SECRET?.trim() || ''

/** True when "Continue with Google" can be offered: client id, client secret and cookie secret all set. */
export const shopGoogleEnabled = () =>
  !!process.env.GOOGLE_CLIENT_ID?.trim() && !!process.env.GOOGLE_CLIENT_SECRET?.trim() && shopSecret().length >= 32

/** The OJS member if there is one, otherwise the Google buyer, otherwise null. */
export async function getBuyer(): Promise<Buyer | null> {
  const { user } = await getSession()
  if (user) {
    return {
      kind: 'member',
      id: user.id,
      userName: user.userName,
      email: user.email,
      fullName: user.fullName,
      givenName: user.givenName ?? '',
      familyName: user.familyName ?? '',
      affiliation: user.affiliation ?? '',
    }
  }
  const secret = shopSecret()
  if (!secret) return null
  const store = await cookies()
  return buyerFromCookie(verifyValue<BuyerCookie>(store.get(SHOP_BUYER_COOKIE)?.value, secret))
}

/** For shop pages: the buyer, or a redirect to the shop's sign-in page and back to `path`. */
export async function requireBuyerPage(path: string): Promise<Buyer> {
  const buyer = await getBuyer()
  if (!buyer) redirect(shopSignInHref(path))
  return buyer
}

/** For shop API routes: the buyer, or a 401 to return as-is. */
export async function requireBuyer(): Promise<Buyer | Response> {
  const buyer = await getBuyer()
  if (buyer) return buyer
  return jsonError('sign-in-required', 401, {
    message: 'Please sign in to place the order. Your sign-in may have ended; sign in again, then place the order again.',
  })
}
