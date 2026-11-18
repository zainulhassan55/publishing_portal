import type { Metadata } from 'next'
import Link from 'next/link'
import { ShopShell } from '@/components/cart/ShopShell'

export const metadata: Metadata = { title: 'Payment', robots: { index: false, follow: false } }

/**
 * Where "Place order" lands (PAYMENT_PAGE in CheckoutForm.tsx). A placeholder
 * until the payment step is built (publisher, November 2026): the cart is kept,
 * nothing is charged.
 */
export default function PaymentPage() {
  return (
    <ShopShell crumb="Payment" title="Payment">
      <div style={{ maxWidth: '62ch', padding: '24px 0', borderTop: '1px solid var(--line,#DCE1E6)', fontSize: 16, lineHeight: 1.65, color: 'var(--ink-2,#1F2A36)' }}>
        <p style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Online payment is coming soon.</p>
        <p style={{ margin: '0 0 12px' }}>
          Thank you for your interest. Chapter purchases cannot be completed online yet, so nothing has been charged. Your cart is saved in this browser, ready for when payment opens.
        </p>
        <p style={{ margin: '0 0 22px' }}>
          To buy now, <Link href="/contact">contact us</Link> with the chapters you would like.
        </p>
        <Link href="/cart" style={{ display: 'inline-block', border: '1px solid var(--accent,#0C8375)', color: 'var(--accent-dark,#0A685C)', padding: '10px 18px', borderRadius: 3, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
          Back to cart
        </Link>
      </div>
    </ShopShell>
  )
}
