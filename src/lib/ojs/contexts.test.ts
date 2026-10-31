import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ojsContext, ojsContextBySlug, portalSlug } from './contexts.ts'

test('renamed titles use their OJS path exactly as OJS stores it', () => {
  assert.equal(ojsContext('ijic'), 'TICR')
  assert.equal(ojsContext('ijdm'), 'JDMIE')
  assert.equal(ojsContext('jqcs'), 'TQCIS')
  assert.equal(ojsContext('jaise'), 'JAAISE')
  assert.equal(ojsContext('sst'), 'DTCR')
  assert.equal(ojsContext('reta'), 'RETA')
  assert.equal(ojsContext('IJIC'), 'TICR')
})

test('a title outside the map, and the site context, pass through in lowercase', () => {
  assert.equal(ojsContext('index'), 'index')
  assert.equal(portalSlug('index'), 'index')
  assert.equal(ojsContext('ijdh'), 'ijdh')
})

test('an OJS path maps back to the portal slug in any case, old or new', () => {
  assert.equal(portalSlug('TICR'), 'ijic')
  assert.equal(portalSlug('ticr'), 'ijic')
  assert.equal(portalSlug('Ticr'), 'ijic')
  assert.equal(portalSlug('ijic'), 'ijic')
  assert.equal(portalSlug('RETA'), 'reta')
  for (const slug of Object.keys(ojsContextBySlug)) assert.equal(portalSlug(ojsContext(slug)), slug)
})
