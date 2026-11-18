import { test } from 'node:test'
import assert from 'node:assert/strict'
import { VOLUME_PRICES, cartTotal, cartTotalUsd, chapterItemId, chapterPrice, chapterPriceUsd, formatBoth, formatTwd, formatUsd } from './pricing.ts'

/** Chapters per priced volume, from the tables of contents in src/data/series/*.ts. */
const CHAPTERS: Record<string, number> = {
  'sisdt/quantum-safe-cyber-defense': 8,
  'lnmri/agentic-generative-ai-intelligent-automation': 9,
}

test('book prices match the NCL ISBN batch; chapters have fixed US$ and NT$ prices', () => {
  assert.deepEqual(VOLUME_PRICES['sisdt/quantum-safe-cyber-defense'], { bookUsd: 120, bookTwd: 4000, chapterUsd: 25, chapterTwd: 800 })
  assert.deepEqual(VOLUME_PRICES['lnmri/agentic-generative-ai-intelligent-automation'], { bookUsd: 100, bookTwd: 3300, chapterUsd: 20, chapterTwd: 650 })
})

test('a chapter costs more than its share of the book in both currencies, within US$15–25', () => {
  for (const [key, p] of Object.entries(VOLUME_PRICES)) {
    const n = CHAPTERS[key]
    assert.ok(n, `chapter count missing for ${key}`)
    assert.ok(p.chapterUsd > p.bookUsd / n, `${key}: chapter $${p.chapterUsd} is not above the $${(p.bookUsd / n).toFixed(2)} share`)
    assert.ok(p.chapterTwd > p.bookTwd / n, `${key}: chapter NT$${p.chapterTwd} is not above the NT$${Math.round(p.bookTwd / n)} share`)
    assert.ok(p.chapterUsd >= 15 && p.chapterUsd <= 25, `${key}: chapter $${p.chapterUsd} outside $15–25`)
    assert.ok(Number.isInteger(p.chapterTwd) && Number.isInteger(p.bookTwd), `${key}: NT$ prices must be whole dollars`)
  }
})

test('the NT$ price stays close to the book\'s own NT$/US$ ratio', () => {
  for (const [key, p] of Object.entries(VOLUME_PRICES)) {
    const ratio = p.bookTwd / p.bookUsd
    const chapterRatio = p.chapterTwd / p.chapterUsd
    assert.ok(Math.abs(chapterRatio - ratio) / ratio < 0.06, `${key}: NT$${p.chapterTwd} is far from US$${p.chapterUsd} × ${ratio.toFixed(1)}`)
  }
})

test('cart items are priced by their volume', () => {
  assert.deepEqual(chapterPrice(chapterItemId('sisdt', 'quantum-safe-cyber-defense', 3)), { usd: 25, twd: 800 })
  assert.equal(chapterPriceUsd(chapterItemId('lnmri', 'agentic-generative-ai-intelligent-automation', 1)), 20)
  assert.equal(chapterPrice(chapterItemId('sisdt', 'not-for-sale', 1)), null)
  assert.equal(chapterPrice('garbage'), null)
})

test('cart total adds each chapter at its own price in both currencies and ignores unpriced ones', () => {
  const ids = [
    chapterItemId('sisdt', 'quantum-safe-cyber-defense', 1),
    chapterItemId('sisdt', 'quantum-safe-cyber-defense', 2),
    chapterItemId('lnmri', 'agentic-generative-ai-intelligent-automation', 4),
    chapterItemId('sisdt', 'not-for-sale', 1),
  ]
  assert.deepEqual(cartTotal(ids), { usd: 70, twd: 2250 })
  assert.equal(cartTotalUsd(ids), 70)
  assert.deepEqual(cartTotal([]), { usd: 0, twd: 0 })
})

test('formatting', () => {
  assert.equal(formatUsd(25), 'US $25.00')
  assert.equal(formatTwd(4000), 'NT$4,000')
  assert.equal(formatBoth({ usd: 25, twd: 800 }), 'US $25.00 · NT$800')
})
