import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { safeNext } from './links.ts'

const BASE = 'https://www.nextgeniqpress.com'

test('same-origin paths are kept', () => {
  assert.equal(safeNext('/checkout'), '/checkout')
  assert.equal(safeNext('/api/auth/ojs-handoff?to=%2Fojs%2F'), '/api/auth/ojs-handoff?to=%2Fojs%2F')
})

test('anything that could leave the site falls back', () => {
  for (const bad of [null, undefined, '', 'https://evil.com', '//evil.com', '/\\evil.com', '/\\/evil.com', '/\t/evil.com', '/\n/evil.com', 'checkout']) {
    assert.equal(safeNext(bad, '/x'), '/x', JSON.stringify(bad))
  }
})

test('whatever is kept resolves to this site', () => {
  for (const v of ['/checkout', '/a/b?c=d#e', '/%5Cevil.com', '/%2F%2Fevil.com']) {
    assert.equal(new URL(safeNext(v), BASE).host, 'www.nextgeniqpress.com', v)
  }
})
