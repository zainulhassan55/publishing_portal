import type { Metadata } from 'next'
import { CheckoutForm } from '@/components/cart/CheckoutForm'
import { ShopShell } from '@/components/cart/ShopShell'
import { requireMemberPage } from '@/lib/auth/require'
import { paymentOptions } from '@/lib/pay/server'

export const metadata: Metadata = { title: 'Checkout', robots: { index: false, follow: false } }

/**
 * Buyers sign in before they pay (publisher, November 2026): a signed-out
 * visitor is sent to sign-in and brought back here. The cart itself is open to
 * everyone; /api/checkout enforces the same rule.
 */
export default async function CheckoutPage() {
  const user = await requireMemberPage('/checkout')
  const options = await paymentOptions()
  return (
    <ShopShell crumb="Checkout" title="Checkout">
      <CheckoutForm account={{ email: user.email, givenName: user.givenName ?? '', familyName: user.familyName ?? '', fullName: user.fullName, affiliation: user.affiliation ?? '' }} options={options} />
    </ShopShell>
  )
}
