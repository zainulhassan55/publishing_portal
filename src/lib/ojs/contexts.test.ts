import { test } from 'node:test'
import assert from 'node:assert/strict'
import { currentSlug, legacySlugs, ojsContext, ojsContextBySlug, portalSlug } from './contexts.ts'

test('titles use their OJS path exactly as OJS stores it', () => {
  assert.equal(ojsContext('ticr'), 'TICR')
  assert.equal(ojsContext('jdmie'), 'JDMIE')
  assert.equal(ojsContext('tqcis'), 'TQCIS')
  assert.equal(ojsContext('jaaise'), 'JAAISE')
  assert.equal(ojsContext('dtcr'), 'DTCR')
  assert.equal(ojsContext('reta'), 'RETA')
  assert.equal(ojsContext('TICR'), 'TICR')
})

test('a pre-rename slug still reaches the renamed journal in OJS', () => {
  assert.equal(ojsContext('ijic'), 'TICR')
  assert.equal(ojsContext('IJDM'), 'JDMIE')
  assert.equal(ojsContext('sst'), 'DTCR')
})

test('a title outside the map, and the site context, pass through in lowercase', () => {
  assert.equal(ojsContext('index'), 'index')
  assert.equal(portalSlug('index'), 'index')
  assert.equal(ojsContext('ijdh'), 'ijdh')
})

test('an OJS path maps back to the portal slug in any case, old or new', () => {
  assert.equal(portalSlug('TICR'), 'ticr')
  assert.equal(portalSlug('ticr'), 'ticr')
  assert.equal(portalSlug('Ticr'), 'ticr')
  assert.equal(portalSlug('ijic'), 'ticr')
  assert.equal(portalSlug('RETA'), 'reta')
  for (const slug of Object.keys(ojsContextBySlug)) assert.equal(portalSlug(ojsContext(slug)), slug)
})

test('every old slug points at a title that exists, and today’s slug is the OJS path in lowercase', () => {
  for (const [old, now] of Object.entries(legacySlugs)) {
    assert.ok(ojsContextBySlug[now], `${old} → ${now} has no OJS path`)
    assert.equal(currentSlug(old), now)
  }
  for (const [slug, context] of Object.entries(ojsContextBySlug)) assert.equal(context.toLowerCase(), slug)
})
