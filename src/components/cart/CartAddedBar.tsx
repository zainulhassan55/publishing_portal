'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CHAPTER_PRICE_USD, formatUsd } from '@/lib/cart/pricing'
import { ADDED_EVENT, useCart, type CartItem } from '@/lib/cart/store'
import { CartIcon } from './AddToCartButton'

/**
 * The bar that slides down from the top of the screen when a chapter is added
 * to the cart, after IGI Global's (publisher's reference, November 2026): what
 * was added, then "Cart" and "Proceed to checkout". It stays until closed
 * (button or Escape) or the reader moves to another page. Mounted once, in
 * SiteChrome; it listens for ADDED_EVENT from the cart store.
 */
export function CartAddedBar() {
  const [shown, setShown] = useState<{ item: CartItem; path: string } | null>(null)
  const pathname = usePathname()
  const count = useCart().length

  useEffect(() => {
    const onAdded = (e: Event) => setShown({ item: (e as CustomEvent<CartItem>).detail, path: window.location.pathname })
    window.addEventListener(ADDED_EVENT, onAdded)
    return () => window.removeEventListener(ADDED_EVENT, onAdded)
  }, [])

  useEffect(() => {
    if (!shown) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShown(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [shown])

  // Shown only on the page where the chapter was added: moving on closes it.
  const item = shown && shown.path === pathname ? shown.item : null

  return (
    <div role="status" aria-live="polite" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 80, pointerEvents: item ? 'auto' : 'none' }}>
      {item ? (
        <div
          className="cab-bar"
          style={{ background: 'var(--surface,#fff)', borderTop: '6px solid var(--ink-3,#3C4854)', borderBottom: '6px solid var(--ink-3,#3C4854)', boxShadow: '0 12px 32px rgba(16,27,39,.22)', animation: 'cabDrop .25s ease both' }}
        >
          <style>{`@keyframes cabDrop{from{transform:translateY(-100%)}to{transform:none}}@media (prefers-reduced-motion:reduce){.cab-bar{animation:none!important}}@media (max-width:760px){.cab-row{flex-wrap:wrap!important;gap:12px!important}.cab-cover{display:none!important}.cab-side{flex:1 1 100%!important;align-items:stretch!important}.cab-side>button{align-self:flex-end}.cab-actions{flex:1 1 100%!important;justify-content:stretch!important}.cab-actions>a{flex:1 1 0;text-align:center}}`}</style>
          <div className="cab-row" style={{ maxWidth: 1280, margin: '0 auto', padding: '16px var(--shell-pad)', display: 'flex', alignItems: 'center', gap: 22 }}>
            <span aria-hidden="true" style={{ flex: '0 0 auto', width: 30, height: 30, borderRadius: '50%', background: '#2E7D32', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700 }}>
              ✓
            </span>
            {item.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="cab-cover" src={item.cover} alt="" width={52} height={78} style={{ flex: '0 0 auto', width: 52, height: 78, objectFit: 'cover', borderRadius: 2, boxShadow: '0 3px 8px rgba(16,27,39,.25)' }} />
            ) : null}
            <div style={{ flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#2E7D32' }}>Added to your cart</span>
              <span style={{ fontSize: 18, lineHeight: 1.35, color: 'var(--ink,#101B27)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.title}>
                {item.title}
              </span>
              <span style={{ fontSize: 13.5, color: 'var(--ink-3,#3C4854)' }}>
                <strong style={{ fontWeight: 700 }}>Chapter {item.chapter}</strong> · {item.seriesCode} · {formatUsd(CHAPTER_PRICE_USD)}
              </span>
            </div>
            <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }} className="cab-side">
              <div className="cab-actions" style={{ display: 'flex', gap: 10 }}>
                <Link href="/cart" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--ink-3,#3C4854)', color: '#fff', padding: '10px 16px', borderRadius: 3, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
                  Cart ({count}) <CartIcon />
                </Link>
                <Link href="/checkout" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent,#0C8375)', color: '#fff', padding: '10px 18px', borderRadius: 3, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
                  Proceed to checkout
                </Link>
              </div>
              <button
                type="button"
                onClick={() => setShown(null)}
                style={{ border: 0, background: 'none', padding: '2px 0', font: 'inherit', fontSize: 14.5, color: 'var(--accent-dark,#0A685C)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <span aria-hidden="true" style={{ display: 'inline-flex', width: 18, height: 18, borderRadius: '50%', border: '1.5px solid currentColor', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>
                  ✕
                </span>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
