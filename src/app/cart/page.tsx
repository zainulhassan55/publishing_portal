import type { Metadata } from 'next'
import { CartView } from '@/components/cart/CartView'
import { ShopShell } from '@/components/cart/ShopShell'

// A reader's own cart: nothing here for search engines.
export const metadata: Metadata = { title: 'Your cart', robots: { index: false, follow: false } }

export default function CartPage() {
  return (
    <ShopShell crumb="Cart" title="Your cart">
      <CartView />
    </ShopShell>
  )
}
