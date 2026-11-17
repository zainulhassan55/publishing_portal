/**
 * Prices for e-books and their chapters, in US dollars.
 *
 * Book prices are the list prices submitted to the NCL ISBN Center in the
 * November 2026 batch (bookBatchAdd_NextGenIQ_2books.xls): Quantum-Safe Cyber
 * Defense NT$4,000 (US$120), Agentic and Generative AI NT$3,300 (US$100).
 *
 * A chapter on its own deliberately costs more than its share of the book
 * (book price ÷ chapters), within the publisher's US$15–25 range, so buying the
 * whole book stays the better deal: Quantum-Safe 8 chapters, $15 share → $25;
 * Agentic 9 chapters, $11.11 share → $20.
 *
 * Prices are looked up here whenever they are shown, never stored in the cart,
 * so a change here reprices carts already in progress. The portal's
 * /api/checkout sends these prices to the payment Worker; the browser never does.
 */
export type VolumePrice = {
  /** Whole e-book, US$ (ISBN batch list price). */
  bookUsd: number
  /** Whole e-book, NT$, exactly as submitted to the NCL. */
  bookTwd: number
  /** One chapter, US$. */
  chapterUsd: number
}

/** Keyed by `<series slug>/<volume slug>`. A volume not listed here is not for sale yet. */
export const VOLUME_PRICES: Record<string, VolumePrice> = {
  'sisdt/quantum-safe-cyber-defense': { bookUsd: 120, bookTwd: 4000, chapterUsd: 25 },
  'lnmri/agentic-generative-ai-intelligent-automation': { bookUsd: 100, bookTwd: 3300, chapterUsd: 20 },
}

export const volumePrice = (seriesSlug: string, volumeSlug: string): VolumePrice | null => VOLUME_PRICES[`${seriesSlug}/${volumeSlug}`] ?? null

/** Price of a cart item (see chapterItemId); null when its volume has no price. */
export function chapterPriceUsd(itemId: string): number | null {
  const [series, volume] = itemId.split('/')
  return volumePrice(series ?? '', volume ?? '')?.chapterUsd ?? null
}

/** Sum of the given cart items; an item without a price counts as 0 (checkout refuses it). */
export const cartTotalUsd = (itemIds: string[]) => Math.round(itemIds.reduce((sum, id) => sum + (chapterPriceUsd(id) ?? 0), 0) * 100) / 100

/** "US $25.00": the style chapter prices take next to a chapter. */
export const formatUsd = (amount: number) => `US $${amount.toFixed(2)}`

/** "$25.00": the plain style used in the order summary. */
export const formatUsdShort = (amount: number) => `$${amount.toFixed(2)}`

/** "NT$4,000". */
export const formatTwd = (amount: number) => `NT$${amount.toLocaleString('en-US')}`

/** Stable cart id of a chapter: series, volume and chapter number. */
export const chapterItemId = (seriesSlug: string, volumeSlug: string, chapter: number) => `${seriesSlug}/${volumeSlug}/${chapter}`
