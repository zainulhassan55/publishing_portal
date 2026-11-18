'use client'

import { useSyncExternalStore } from 'react'

/**
 * The book-chapter cart, kept in the reader's own browser (localStorage).
 *
 * There is no order system yet (November 2026): the cart collects chapters and
 * checkout hands over to a payment page still to come. Keeping it client-side
 * means no account is needed and nothing personal reaches the server. Only
 * what is needed to list an item is stored; prices come from pricing.ts at
 * display time.
 *
 * Tabs stay in step through the `storage` event; this tab's own components
 * through a custom event.
 */
export type CartItem = {
  /** chapterItemId(): `<series>/<volume>/<chapter>`. */
  id: string
  seriesCode: string
  volumeTitle: string
  /** The volume page, where the chapter is listed. */
  volumeHref: string
  chapter: number
  title: string
  /** The volume's cover, shown in the "added to cart" bar. */
  cover?: string
}

const KEY = 'ngiq_cart_v1'
const EVENT = 'ngiq-cart-change'
/** Fired with the item as `detail` when a chapter is added, for the "added to cart" bar (CartAddedBar). */
export const ADDED_EVENT = 'ngiq-cart-added'
const EMPTY: CartItem[] = []

let cachedRaw: string | null = null
let cachedItems: CartItem[] = EMPTY

const isItem = (x: unknown): x is CartItem =>
  !!x && typeof x === 'object' && typeof (x as CartItem).id === 'string' && typeof (x as CartItem).title === 'string' && typeof (x as CartItem).chapter === 'number'

function read(): CartItem[] {
  let raw: string | null = null
  try {
    raw = window.localStorage.getItem(KEY)
  } catch {
    return EMPTY // storage blocked (private mode, site data off): an empty cart, not a crash
  }
  if (raw === cachedRaw) return cachedItems
  cachedRaw = raw
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : []
    cachedItems = Array.isArray(parsed) ? parsed.filter(isItem) : EMPTY
  } catch {
    cachedItems = EMPTY
  }
  return cachedItems
}

function write(items: CartItem[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items))
  } catch {
    // Storage full or blocked: the change is lost on reload, but the page keeps working.
  }
  window.dispatchEvent(new Event(EVENT))
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) onChange()
  }
  window.addEventListener(EVENT, onChange)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(EVENT, onChange)
    window.removeEventListener('storage', onStorage)
  }
}

/** The cart's items. Empty during server rendering and the first client render, so hydration matches. */
export const useCart = (): CartItem[] => useSyncExternalStore(subscribe, read, () => EMPTY)

export function addToCart(item: CartItem) {
  const items = read()
  if (items.some((i) => i.id === item.id)) return
  write([...items, item])
  window.dispatchEvent(new CustomEvent<CartItem>(ADDED_EVENT, { detail: item }))
}

export function removeFromCart(id: string) {
  write(read().filter((i) => i.id !== id))
}

export function clearCart() {
  write([])
}
