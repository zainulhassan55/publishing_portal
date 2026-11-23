import type { Metadata } from 'next'
import { CheckoutForm } from '@/components/cart/CheckoutForm'
import { ShopShell } from '@/components/cart/ShopShell'
import { requireBuyerPage } from '@/lib/shop/buyer'
import { paymentOptions } from '@/lib/pay/server'

export const metadata: Metadata = { title: 'Checkout', robots: { index: false, follow: false } }

/**
 * Buyers sign in before they pay (publisher, November 2026): a signed-out
 * visitor is sent to the shop's sign-in page (/checkout/sign-in: Google, or
 * the OJS account) and brought back here. The cart itself is open to
 * everyone; /api/checkout enforces the same rule.
 */
export default async function CheckoutPage() {
  const buyer = await requireBuyerPage('/checkout')
  const options = await paymentOptions()
  return (
    <ShopShell crumb="Checkout" title="Checkout">
      <CheckoutForm
        account={{
          kind: buyer.kind,
          email: buyer.email,
          givenName: buyer.givenName,
          familyName: buyer.familyName,
          fullName: buyer.fullName,
          affiliation: buyer.kind === 'member' ? buyer.affiliation : '',
        }}
        options={options}
      />
    </ShopShell>
  )
}
