/**
 * Prices for buying book chapters one at a time.
 *
 * A placeholder while the publisher settles real prices (November 2026): every
 * chapter costs US $1.00. Prices are looked up here when shown, never stored
 * in the cart, so changing this constant reprices carts already in progress.
 */
export const CHAPTER_PRICE_USD = 1

/** "US $1.00" — the style chapter prices take next to a chapter. */
export const formatUsd = (amount: number) => `US $${amount.toFixed(2)}`

/** "$1.00" — the plain style used in the order summary. */
export const formatUsdShort = (amount: number) => `$${amount.toFixed(2)}`

/** Stable cart id of a chapter: series, volume and chapter number. */
export const chapterItemId = (seriesSlug: string, volumeSlug: string, chapter: number) => `${seriesSlug}/${volumeSlug}/${chapter}`
