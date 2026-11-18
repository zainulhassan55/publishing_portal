import type { Metadata } from 'next'
import { CheckoutForm } from '@/components/cart/CheckoutForm'
import { ShopShell } from '@/components/cart/ShopShell'

export const metadata: Metadata = { title: 'Checkout', robots: { index: false, follow: false } }

export default function CheckoutPage() {
  return (
    <ShopShell crumb="Checkout" title="Checkout as guest">
      <CheckoutForm />
    </ShopShell>
  )
}
