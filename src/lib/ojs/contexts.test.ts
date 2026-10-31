import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ojsContext, ojsContextBySlug, portalSlug } from './contexts.ts'

test('renamed titles use their new OJS path', () => {
  assert.equal(ojsContext('ijic'), 'ticr')
  assert.equal(ojsContext('ijdm'), 'jdmie')
  assert.equal(ojsContext('jqcs'), 'tqcis')
  assert.equal(ojsContext('jaise'), 'jaaise')
  assert.equal(ojsContext('sst'), 'dtcr')
})

test('titles that were not renamed, and the site context, pass through', () => {
  assert.equal(ojsContext('reta'), 'reta')
  assert.equal(ojsContext('index'), 'index')
  assert.equal(portalSlug('reta'), 'reta')
  assert.equal(portalSlug('index'), 'index')
})

test('an OJS path maps back to the portal slug, old or new', () => {
  assert.equal(portalSlug('ticr'), 'ijic')
  assert.equal(portalSlug('TICR'), 'ijic')
  assert.equal(portalSlug('ijic'), 'ijic')
  for (const slug of Object.keys(ojsContextBySlug)) assert.equal(portalSlug(ojsContext(slug)), slug)
})
