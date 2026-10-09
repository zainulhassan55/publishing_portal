import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  applyFacets,
  buildFacets,
  matchesQuery,
  normalise,
  queryTerms,
  relevanceScore,
  snippet,
  sortHits,
  type ArticleHit,
} from './search-core.ts'

const hit = (over: Partial<ArticleHit>): ArticleHit => ({
  kind: 'article',
  id: 'a',
  slug: 'a',
  title: 'Title',
  authors: ['A Author'],
  journalSlug: 'ijdh',
  journalTitle: 'International Journal of Digital Health',
  journalCode: 'IJDH',
  type: 'Research Article',
  year: 2026,
  publishedIso: '2026-06-01',
  doi: '10.63521/x',
  access: 'Open access',
  citations: 0,
  downloads: 0,
  abstract: '',
  keywords: [],
  haystack: '',
  ...over,
})

const withHaystack = (over: Partial<ArticleHit>) => {
  const base = hit(over)
  return { ...base, haystack: normalise([base.title, base.abstract, base.journalCode, base.type].join(' ')) }
}

test('queryTerms drops single characters and empty tokens', () => {
  assert.deepEqual(queryTerms('quantum  error a mitigation'), ['quantum', 'error', 'mitigation'])
  assert.deepEqual(queryTerms('   '), [])
})

test('normalise strips diacritics so an accented query still matches', () => {
  assert.equal(normalise('Zürich'), 'zurich')
  assert.equal(normalise('CRÈCHE'), 'creche')
})

test('matchesQuery requires every term, not any', () => {
  const haystack = normalise('Conformal prediction for medical image segmentation')
  assert.equal(matchesQuery(haystack, ['conformal', 'segmentation']), true)
  assert.equal(matchesQuery(haystack, ['conformal', 'quantum']), false)
  // No terms means no constraint, which is how an empty query shows everything.
  assert.equal(matchesQuery(haystack, []), true)
})

test('relevanceScore ranks a title hit above an abstract-only hit', () => {
  const inTitle = withHaystack({ title: 'Quantum error mitigation on NISQ hardware' })
  const inAbstract = withHaystack({ title: 'Unrelated work', abstract: 'A study of quantum error mitigation' })
  const terms = queryTerms('quantum error')
  assert.ok(relevanceScore(inTitle, 'quantum error', terms) > relevanceScore(inAbstract, 'quantum error', terms))
})

test('relevanceScore ranks an exact phrase above scattered terms', () => {
  const phrase = withHaystack({ title: 'Conformal prediction in practice' })
  const scattered = withHaystack({ title: 'Prediction intervals and conformal bounds' })
  const terms = queryTerms('conformal prediction')
  assert.ok(relevanceScore(phrase, 'conformal prediction', terms) > relevanceScore(scattered, 'conformal prediction', terms))
})

test('snippet centres on the first matching term and marks truncation', () => {
  const text = `${'padding '.repeat(20)}needle ${'tail '.repeat(20)}`
  const result = snippet(text, ['needle'], 80)
  assert.ok(result.includes('needle'))
  assert.ok(result.startsWith('…'), 'should mark the elided start')
  assert.ok(result.endsWith('…'), 'should mark the elided end')
})

test('snippet on a short string neither pads nor truncates', () => {
  assert.equal(snippet('Short text', ['short']), 'Short text')
  assert.equal(snippet('', ['x']), '')
})

/* -------------------------------------------------------------------------- */
/* Facets                                                                     */
/* -------------------------------------------------------------------------- */

const corpus: ArticleHit[] = [
  withHaystack({ id: '1', journalSlug: 'ijdh', journalCode: 'IJDH', type: 'Research Article', year: 2026 }),
  withHaystack({ id: '2', journalSlug: 'ijdh', journalCode: 'IJDH', type: 'Review', year: 2026 }),
  withHaystack({ id: '3', journalSlug: 'ijic', journalCode: 'IJIC', type: 'Research Article', year: 2025 }),
  withHaystack({ id: '4', journalSlug: 'ijqt', journalCode: 'IJQT', type: 'Review', year: 2025 }),
]

const optionsFor = (groups: ReturnType<typeof buildFacets>, id: string) =>
  Object.fromEntries(groups.find((g) => g.id === id)!.options.map((o) => [o.value, o.count]))

test('facet counts reflect the whole corpus when nothing is selected', () => {
  const facets = buildFacets(corpus, {})
  assert.deepEqual(optionsFor(facets, 'journal'), { ijdh: 2, ijic: 1, ijqt: 1 })
  assert.deepEqual(optionsFor(facets, 'type'), { 'Research Article': 2, Review: 2 })
  assert.deepEqual(optionsFor(facets, 'year'), { '2026': 2, '2025': 2 })
})

test('a facet group ignores its own selection when counting', () => {
  // Selecting IJDH must not collapse the journal group to a single option, or
  // the reader could never widen the selection again.
  const facets = buildFacets(corpus, { journal: ['ijdh'] })
  assert.deepEqual(optionsFor(facets, 'journal'), { ijdh: 2, ijic: 1, ijqt: 1 })
  // Other groups do narrow: only IJDH's two articles are in scope.
  assert.deepEqual(optionsFor(facets, 'type'), { 'Research Article': 1, Review: 1 })
})

test('facet groups intersect across groups', () => {
  const facets = buildFacets(corpus, { journal: ['ijdh'], type: ['Review'] })
  assert.deepEqual(optionsFor(facets, 'year'), { '2026': 1 })
})

test('applyFacets intersects selections and treats an empty group as no filter', () => {
  assert.equal(applyFacets(corpus, {}).length, 4)
  assert.equal(applyFacets(corpus, { journal: [] }).length, 4)
  assert.equal(applyFacets(corpus, { journal: ['ijdh'] }).length, 2)
  assert.equal(applyFacets(corpus, { journal: ['ijdh'], type: ['Review'] }).length, 1)
  assert.equal(applyFacets(corpus, { journal: ['ijdh'], type: ['Perspective'] }).length, 0)
})

test('multiple values within a group are a union', () => {
  assert.equal(applyFacets(corpus, { journal: ['ijdh', 'ijqt'] }).length, 3)
})

/* -------------------------------------------------------------------------- */
/* Sorting                                                                    */
/* -------------------------------------------------------------------------- */

const sortable: ArticleHit[] = [
  withHaystack({ id: 'old', publishedIso: '2025-01-01', citations: 10, downloads: 5 }),
  withHaystack({ id: 'new', publishedIso: '2026-06-01', citations: 1, downloads: 50 }),
  withHaystack({ id: 'mid', publishedIso: '2025-09-01', citations: 5, downloads: 20 }),
]

const ids = (hits: ArticleHit[]) => hits.map((h) => h.id)

test('sortHits orders by each criterion', () => {
  assert.deepEqual(ids(sortHits(sortable, 'newest', '')), ['new', 'mid', 'old'])
  assert.deepEqual(ids(sortHits(sortable, 'cited', '')), ['old', 'mid', 'new'])
  assert.deepEqual(ids(sortHits(sortable, 'read', '')), ['new', 'mid', 'old'])
})

test('sortHits does not mutate its input', () => {
  const before = ids(sortable)
  sortHits(sortable, 'newest', '')
  assert.deepEqual(ids(sortable), before)
})

test('relevance sorting falls back to newest on a tie', () => {
  // No query means every score is zero, so the date decides.
  assert.deepEqual(ids(sortHits(sortable, 'relevance', '')), ['new', 'mid', 'old'])
})
