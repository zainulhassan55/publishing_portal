import { test } from 'node:test'
import assert from 'node:assert/strict'
import { currentSeriesSlug, legacySeriesSlugs, seriesSlugAliases } from './series-slugs.ts'

/** The live series slugs (src/data/series/*.ts); the registry itself needs the Next.js path aliases. */
const seriesSlugs = ['sisdt', 'lnmri']

test('old series slugs map to today’s, in any case', () => {
  assert.equal(currentSeriesSlug('aiisc'), 'sisdt')
  assert.equal(currentSeriesSlug('LNMR'), 'lnmri')
  assert.equal(currentSeriesSlug('sisdt'), 'sisdt')
  assert.equal(currentSeriesSlug('lnmri'), 'lnmri')
})

test('aliases list today’s slug first, then the old one', () => {
  assert.deepEqual(seriesSlugAliases('sisdt'), ['sisdt', 'aiisc'])
  assert.deepEqual(seriesSlugAliases('aiisc'), ['sisdt', 'aiisc'])
  assert.deepEqual(seriesSlugAliases('lnmri'), ['lnmri', 'lnmr'])
})

test('every old slug points at a series that exists, and no old slug is still in use', () => {
  for (const [old, now] of Object.entries(legacySeriesSlugs)) {
    assert.ok(seriesSlugs.includes(now), `${old} → ${now}: no such series`)
    assert.ok(!seriesSlugs.includes(old), `${old} is a live series slug again`)
  }
})
