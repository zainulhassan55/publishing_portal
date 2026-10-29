import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  anchorIds,
  authorsShort,
  citationAuthor,
  daysUntil,
  deadlineLabel,
  deadlineState,
  formatDate,
  formatFileSize,
  initials,
  pluralise,
  wordCount,
} from './format.ts'

test('formatDate renders en-GB long form regardless of server locale', () => {
  assert.equal(formatDate('2026-06-12'), '12 June 2026')
  assert.equal(formatDate('2026-01-01'), '1 January 2026')
  assert.equal(formatDate(undefined), '')
})

test('formatDate is not shifted by a timezone', () => {
  // Parsed at UTC midnight, so a date never lands on the previous day for a
  // server running west of Greenwich.
  assert.equal(formatDate('2026-03-01'), '1 March 2026')
  assert.equal(formatDate('2026-03-01T23:59:59Z'), '1 March 2026')
})

test('daysUntil counts whole days in both directions', () => {
  assert.equal(daysUntil('2026-10-31', '2026-10-01'), 30)
  assert.equal(daysUntil('2026-10-01', '2026-10-01'), 0)
  assert.equal(daysUntil('2026-09-15', '2026-10-01'), -16)
})

test('deadlineState treats the final 30 days as closing soon', () => {
  assert.equal(deadlineState('2026-12-01', '2026-10-01'), 'open')
  assert.equal(deadlineState('2026-10-31', '2026-10-01'), 'closing-soon')
  assert.equal(deadlineState('2026-10-01', '2026-10-01'), 'closing-soon')
  assert.equal(deadlineState('2026-09-30', '2026-10-01'), 'closed')
})

test('deadlineLabel reads naturally at the boundaries', () => {
  assert.equal(deadlineLabel('2026-10-01', '2026-10-01'), 'Closes today')
  assert.equal(deadlineLabel('2026-10-02', '2026-10-01'), '1 day left')
  assert.equal(deadlineLabel('2026-10-11', '2026-10-01'), '10 days left')
  assert.equal(deadlineLabel('2026-09-30', '2026-10-01'), 'Closed')
})

test('authorsShort truncates only past the limit', () => {
  assert.equal(authorsShort(['A One', 'B Two']), 'A One, B Two')
  assert.equal(authorsShort(['A', 'B', 'C', 'D']), 'A, B, C, D')
  assert.equal(authorsShort(['A', 'B', 'C', 'D', 'E', 'F']), 'A, B, C + 3 more')
  assert.equal(authorsShort([]), '')
})

test('citationAuthor uses the family name and et al.', () => {
  assert.equal(citationAuthor(['Amara N. Okafor']), 'Okafor')
  assert.equal(citationAuthor(['Amara N. Okafor', 'Lena Hoffmann']), 'Okafor et al.')
  assert.equal(citationAuthor([]), '')
})

test('initials takes at most two', () => {
  assert.equal(initials('Amara Okafor'), 'AO')
  assert.equal(initials('Daniel Reyes-Morales Junior'), 'DR')
  assert.equal(initials('Prince'), 'P')
})

test('wordCount ignores surrounding and repeated whitespace', () => {
  assert.equal(wordCount('  one   two  three '), 3)
  assert.equal(wordCount(''), 0)
  assert.equal(wordCount('   '), 0)
})

test('pluralise switches on exactly one', () => {
  assert.equal(pluralise(1, 'article'), '1 article')
  assert.equal(pluralise(0, 'article'), '0 articles')
  assert.equal(pluralise(2400, 'article'), '2,400 articles')
})

test('formatFileSize crosses units at 1024', () => {
  assert.equal(formatFileSize(512), '512 B')
  assert.equal(formatFileSize(2048), '2 KB')
  assert.equal(formatFileSize(14_900_000), '14.2 MB')
})

test('anchorIds slugs headings and keeps them unique', () => {
  assert.deepEqual(anchorIds(['Article processing charges', 'Licence']), ['article-processing-charges', 'licence'])
  assert.deepEqual(anchorIds(['Contact', '', 'Contact', 'Peer review & ethics']), ['contact', 'section-2', 'contact-2', 'peer-review-ethics'])
})
