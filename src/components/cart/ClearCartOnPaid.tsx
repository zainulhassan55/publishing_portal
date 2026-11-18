'use client'

import { useEffect } from 'react'
import { removeFromCart } from '@/lib/cart/store'

/** On the payment-complete page: removes the chapters that were just paid for from this browser's cart. */
export function ClearCartOnPaid({ itemIds }: { itemIds: string[] }) {
  useEffect(() => {
    for (const id of itemIds) removeFromCart(id)
  }, [itemIds])
  return null
}
