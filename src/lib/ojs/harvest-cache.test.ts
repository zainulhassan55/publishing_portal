import { strict as assert } from 'node:assert'
import { mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, test } from 'node:test'
import { forgetHarvest, harvestPath, readHarvest, resetHarvestCache } from './harvest-cache.ts'

/**
 * The cache has one job: a new snapshot written by the scheduled harvest must
 * be visible to the next render without a restart, and a broken one must not
 * blank the site. Both are exercised through a real file under HARVEST_PATH,
 * because the mtime/size check is the thing under test.
 */

let dir: string
let file: string

const article = (id: string) => ({ id, slug: id, title: id })

const write = (content: string, mtime: number) => {
  writeFileSync(file, content)
  // Force distinct mtimes: two writes inside one tick would otherwise share one.
  utimesSync(file, mtime, mtime)
}

before(() => {
  dir = mkdtempSync(join(tmpdir(), 'harvest-cache-'))
  file = join(dir, 'harvest.json')
  process.env.HARVEST_PATH = file
  resetHarvestCache()
})

after(() => {
  delete process.env.HARVEST_PATH
  resetHarvestCache()
  rmSync(dir, { recursive: true, force: true })
})

test('HARVEST_PATH overrides the default location', () => {
  assert.equal(harvestPath(), file)
})

test('a missing snapshot is the empty launch state, not an error', () => {
  const snapshot = readHarvest()
  assert.equal(snapshot.harvestedAt, null)
  assert.deepEqual(snapshot.articles, [])
})

test('a rewritten snapshot is picked up without a reset', () => {
  write(JSON.stringify({ harvestedAt: '2026-10-14T00:00:00Z', articles: [article('ojs-1')], issues: [] }), 1_000)
  assert.equal(readHarvest().articles.length, 1)

  write(
    JSON.stringify({ harvestedAt: '2026-10-14T01:00:00Z', articles: [article('ojs-1'), article('ojs-2')], issues: [] }),
    2_000,
  )
  assert.equal(readHarvest().articles.length, 2, 'the second harvest must replace the first')
  assert.equal(readHarvest().harvestedAt, '2026-10-14T01:00:00Z')
})

test('an unparseable snapshot keeps the previous good one', () => {
  write('{"harvestedAt": "2026-10-14T02:00:00Z", "articles": [', 3_000)
  const snapshot = readHarvest()
  assert.equal(snapshot.articles.length, 2, 'a truncated file must not empty the site')
  assert.equal(snapshot.harvestedAt, '2026-10-14T01:00:00Z')
})

test('a reset forces a re-read but keeps the fallback', () => {
  // The purge route resets after every harvest; a corrupt file at that moment
  // must still not empty the site.
  resetHarvestCache()
  assert.equal(readHarvest().articles.length, 2)
})

test('an unparseable snapshot with nothing ever parsed is the empty state', () => {
  forgetHarvest()
  assert.deepEqual(readHarvest().articles, [])
})
