import { test } from 'node:test'
import assert from 'node:assert/strict'
import { VOLUME_PRICES, cartTotalUsd, chapterItemId, chapterPriceUsd, formatTwd, formatUsd } from './pricing.ts'

/** Chapters per priced volume, from the tables of contents in src/data/series/*.ts. */
const CHAPTERS: Record<string, number> = {
  'sisdt/quantum-safe-cyber-defense': 8,
  'lnmri/agentic-generative-ai-intelligent-automation': 9,
}

test('book prices match the NCL ISBN batch', () => {
  assert.deepEqual(VOLUME_PRICES['sisdt/quantum-safe-cyber-defense'], { bookUsd: 120, bookTwd: 4000, chapterUsd: 25 })
  assert.deepEqual(VOLUME_PRICES['lnmri/agentic-generative-ai-intelligent-automation'], { bookUsd: 100, bookTwd: 3300, chapterUsd: 20 })
})

test('a chapter costs more than its share of the book, within US$15–25', () => {
  for (const [key, p] of Object.entries(VOLUME_PRICES)) {
    const n = CHAPTERS[key]
    assert.ok(n, `chapter count missing for ${key}`)
    assert.ok(p.chapterUsd > p.bookUsd / n, `${key}: chapter $${p.chapterUsd} is not above the $${(p.bookUsd / n).toFixed(2)} share`)
    assert.ok(p.chapterUsd >= 15 && p.chapterUsd <= 25, `${key}: chapter $${p.chapterUsd} outside $15–25`)
  }
})

test('cart items are priced by their volume', () => {
  assert.equal(chapterPriceUsd(chapterItemId('sisdt', 'quantum-safe-cyber-defense', 3)), 25)
  assert.equal(chapterPriceUsd(chapterItemId('lnmri', 'agentic-generative-ai-intelligent-automation', 1)), 20)
  assert.equal(chapterPriceUsd(chapterItemId('sisdt', 'not-for-sale', 1)), null)
  assert.equal(chapterPriceUsd('garbage'), null)
})

test('cart total adds each chapter at its own price and ignores unpriced ones', () => {
  const ids = [
    chapterItemId('sisdt', 'quantum-safe-cyber-defense', 1),
    chapterItemId('sisdt', 'quantum-safe-cyber-defense', 2),
    chapterItemId('lnmri', 'agentic-generative-ai-intelligent-automation', 4),
    chapterItemId('sisdt', 'not-for-sale', 1),
  ]
  assert.equal(cartTotalUsd(ids), 70)
  assert.equal(cartTotalUsd([]), 0)
})

test('formatting', () => {
  assert.equal(formatUsd(25), 'US $25.00')
  assert.equal(formatTwd(4000), 'NT$4,000')
})
