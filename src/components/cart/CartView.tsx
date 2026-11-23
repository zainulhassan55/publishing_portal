'use client'

import Link from 'next/link'
import { useSession } from '@/components/auth/SessionProvider'
import { cartTotal, formatTwd, formatUsd, isBookItemId, itemPrice } from '@/lib/cart/pricing'
import { itemLabel, removeFromCart, useCart } from '@/lib/cart/store'
import { OrderSummary } from './OrderSummary'

const primary = { display: 'block', textAlign: 'center', background: 'var(--accent,#0C8375)', color: '#fff', padding: '12px 16px', borderRadius: 3, fontSize: 16, fontWeight: 600, textDecoration: 'none' } as const

/** The cart: each chapter with its price and a remove button, then the order summary. */
export function CartView() {
  const items = useCart()
  const { user, loading } = useSession()

  if (items.length === 0) {
    return (
      <div style={{ padding: '28px 0', borderTop: '1px solid var(--line,#DCE1E6)', fontSize: 16, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)' }}>
        <p style={{ margin: '0 0 14px' }}>Your cart is empty. Chapters can be added from each book’s table of contents.</p>
        <Link href="/series" style={{ fontWeight: 600 }}>
          Browse the book series →
        </Link>
      </div>
    )
  }

  const subtotal = cartTotal(items.map((i) => i.id))

  return (
    <div className="co-wrap" style={{ display: 'flex', gap: 40, alignItems: 'flex-start' }}>
      <section aria-label="Items in your cart" style={{ flex: '1 1 auto', minWidth: 0 }}>
        <p style={{ margin: '0 0 10px', fontSize: 14, color: 'var(--muted,#505C68)' }}>
          {items.length} item{items.length === 1 ? '' : 's'} · e-book (PDF)
        </p>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, borderTop: '2px solid var(--ink,#101B27)' }}>
          {items.map((it) => (
            <li key={it.id} style={{ display: 'flex', gap: 20, alignItems: 'flex-start', justifyContent: 'space-between', padding: '18px 0', borderBottom: '1px solid var(--line,#DCE1E6)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
                <span style={{ fontSize: 12, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-3,#3C4854)' }}>
                  {it.seriesCode} · <strong style={{ fontWeight: 700, color: 'var(--ink,#101B27)' }}>{itemLabel(it)}</strong>
                </span>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: 18, lineHeight: 1.35, fontWeight: 600, color: 'var(--ink,#101B27)' }}>{it.title}</span>
                <Link href={it.volumeHref} style={{ fontSize: 14 }}>
                  {isBookItemId(it.id) ? 'View the book page' : `From: ${it.volumeTitle}`}
                </Link>
              </div>
              <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink,#101B27)', textAlign: 'right' }}>
                  {formatUsd(itemPrice(it.id)?.usd ?? 0)}
                  <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: 'var(--ink-3,#3C4854)' }}>{formatTwd(itemPrice(it.id)?.twd ?? 0)}</span>
                </span>
                <button
                  type="button"
                  onClick={() => removeFromCart(it.id)}
                  aria-label={`Remove ${itemLabel(it).toLowerCase()}, ${it.title}, from cart`}
                  style={{ border: 0, background: 'none', padding: 0, font: 'inherit', fontSize: 14, color: '#A52A2A', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
        <p style={{ margin: '16px 0 0' }}>
          <Link href="/series" style={{ fontSize: 15 }}>
            ← Continue browsing
          </Link>
        </p>
      </section>
      <OrderSummary subtotal={subtotal}>
        {user || loading ? (
          <Link href="/checkout" style={primary}>
            Proceed to checkout
          </Link>
        ) : (
          <>
            {/* /checkout itself decides: a reader signed in with Google for the
                shop (invisible to useSession) goes straight through; anyone
                else is sent to the shop's sign-in page. */}
            <Link href="/checkout" style={primary}>
              Sign in to check out
            </Link>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--muted,#505C68)', textAlign: 'center' }}>
              Purchases are saved to the account you sign in with.
            </p>
          </>
        )}
      </OrderSummary>
    </div>
  )
}
