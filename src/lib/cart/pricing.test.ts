import { test } from 'node:test'
import assert from 'node:assert/strict'
import { VOLUME_PRICES, bookItemId, cartTotal, cartTotalUsd, chapterItemId, formatBoth, formatTwd, formatUsd, isBookItemId, itemPrice, itemPriceUsd, volumeKeyOf } from './pricing.ts'

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
  assert.deepEqual(itemPrice(chapterItemId('sisdt', 'quantum-safe-cyber-defense', 3)), { usd: 25, twd: 800 })
  assert.equal(itemPriceUsd(chapterItemId('lnmri', 'agentic-generative-ai-intelligent-automation', 1)), 20)
  assert.equal(itemPrice(chapterItemId('sisdt', 'not-for-sale', 1)), null)
  assert.equal(itemPrice('garbage'), null)
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

test('a whole e-book is one item at the book price', () => {
  const id = bookItemId('sisdt', 'quantum-safe-cyber-defense')
  assert.equal(id, 'sisdt/quantum-safe-cyber-defense/book')
  assert.ok(isBookItemId(id))
  assert.ok(!isBookItemId(chapterItemId('sisdt', 'quantum-safe-cyber-defense', 2)))
  assert.deepEqual(itemPrice(id), { usd: 120, twd: 4000 })
  assert.deepEqual(itemPrice(bookItemId('lnmri', 'agentic-generative-ai-intelligent-automation')), { usd: 100, twd: 3300 })
  assert.equal(itemPrice(bookItemId('sisdt', 'not-for-sale')), null)
  assert.equal(itemPrice('sisdt/quantum-safe-cyber-defense/chapter-two'), null)
})

test('a book and its chapters share a volume key', () => {
  assert.equal(volumeKeyOf(bookItemId('sisdt', 'quantum-safe-cyber-defense')), volumeKeyOf(chapterItemId('sisdt', 'quantum-safe-cyber-defense', 7)))
  assert.notEqual(volumeKeyOf(bookItemId('sisdt', 'quantum-safe-cyber-defense')), volumeKeyOf(bookItemId('lnmri', 'agentic-generative-ai-intelligent-automation')))
})

test('buying the book costs less than buying every chapter', () => {
  for (const [key, p] of Object.entries(VOLUME_PRICES)) {
    const n = CHAPTERS[key]
    assert.ok(p.bookUsd < p.chapterUsd * n, `${key}: book US$${p.bookUsd} not below ${n} × US$${p.chapterUsd}`)
    assert.ok(p.bookTwd < p.chapterTwd * n, `${key}: book NT$${p.bookTwd} not below ${n} × NT$${p.chapterTwd}`)
  }
})

test('cart total with a book and a chapter of another book', () => {
  assert.deepEqual(cartTotal([bookItemId('sisdt', 'quantum-safe-cyber-defense'), chapterItemId('lnmri', 'agentic-generative-ai-intelligent-automation', 2)]), { usd: 140, twd: 4650 })
})
