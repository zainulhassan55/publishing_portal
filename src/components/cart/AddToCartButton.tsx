'use client'

import Link from 'next/link'
import { addToCart, useCart, type CartItem } from '@/lib/cart/store'

export function CartIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2.5 3.5h2.6l2.4 11.2a1.6 1.6 0 0 0 1.6 1.3h8.6a1.6 1.6 0 0 0 1.6-1.2L21 8H6" />
    </svg>
  )
}

const btn = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 14px',
  borderRadius: 3,
  font: 'inherit',
  fontSize: 15,
  fontWeight: 600,
  textDecoration: 'none',
  cursor: 'pointer',
} as const

/** "Add to cart" for one chapter; once added, a link to the cart instead. */
export function AddToCartButton({ item }: { item: CartItem }) {
  const inCart = useCart().some((i) => i.id === item.id)
  if (inCart) {
    return (
      <Link href="/cart" style={{ ...btn, background: 'var(--surface,#fff)', color: 'var(--accent-dark,#0A685C)', border: '1px solid var(--accent,#0C8375)' }}>
        ✓ In cart · View cart
      </Link>
    )
  }
  return (
    <button
      type="button"
      onClick={() => addToCart(item)}
      aria-label={`Add chapter ${item.chapter}, ${item.title}, to cart`}
      style={{ ...btn, background: 'var(--accent,#0C8375)', color: '#fff', border: '1px solid var(--accent,#0C8375)' }}
    >
      Add to cart <CartIcon />
    </button>
  )
}
