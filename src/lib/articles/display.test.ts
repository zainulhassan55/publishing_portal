import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { hiddenArticleIds, withoutHidden } from './display.ts'

test('an empty hidden set returns the same array, untouched', () => {
  const articles = [{ id: 'ojs-1' }, { id: 'ojs-2' }]
  assert.equal(withoutHidden(articles, new Set()), articles)
})

test('hidden ids are removed and the rest keep their order', () => {
  const articles = [{ id: 'ojs-1' }, { id: 'ojs-2' }, { id: 'ojs-3' }]
  assert.deepEqual(withoutHidden(articles, new Set(['ojs-2'])), [{ id: 'ojs-1' }, { id: 'ojs-3' }])
})

test('without a database nothing is hidden, and it does not throw', async () => {
  // The tests run with no PORTAL_DATABASE_URL; the gate must mirror OJS.
  const ids = await hiddenArticleIds()
  assert.equal(ids.size, 0)
})
