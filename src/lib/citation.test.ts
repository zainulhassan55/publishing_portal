import assert from 'node:assert/strict'
import { test } from 'node:test'
import { bibtexCitation, buildCitation, endnoteCitation, plainTextCitation, risCitation } from './citation.ts'
import type { Article } from '../types/publishing.ts'
import type { JournalDetail } from '../types/content.ts'

/**
 * These exports are downloaded and imported into Zotero, EndNote and BibTeX.
 * A malformed field is not a cosmetic problem — it silently corrupts a
 * reference in someone else's bibliography, so the field syntax is pinned here.
 */

const article = {
  id: 'a1',
  slug: 'rppg-study',
  journalSlug: 'ijdh',
  type: 'Research Article',
  status: 'published',
  title: 'Remote photoplethysmography for continuous heart-rate monitoring',
  authors: [
    { name: 'Amara N. Okafor', affiliationIds: ['af1'], corresponding: true },
    { name: 'Daniel Reyes-Morales', affiliationIds: ['af1'] },
  ],
  affiliations: [{ id: 'af1', name: 'University of Leeds' }],
  abstract: 'Home-based cardiac rehabilitation depends on reliable monitoring.',
  keywords: ['rPPG', 'cardiac rehabilitation'],
  doi: '10.63521/ijdh.2026.0014',
  volume: 1,
  issue: 2,
  pages: '45–67',
  publishedIso: '2026-06-12',
  access: 'Open access',
  licence: 'CC BY 4.0',
} as Article

const journal = { slug: 'ijdh', title: 'International Journal of Digital Health' } as JournalDetail

const singleAuthor = {
  ...article,
  authors: [{ name: 'Rachel Adeyemi', affiliationIds: [] }],
  pages: undefined,
} as Article

test('plain text inverts author names and carries volume, issue and pages', () => {
  const out = plainTextCitation(article, journal)
  assert.ok(out.includes('Okafor, A. N.'), 'family name first with given initials')
  assert.ok(out.includes('Reyes-Morales, D.'))
  assert.ok(out.includes('(2026)'))
  assert.ok(out.includes('International Journal of Digital Health, 1(2), 45–67'))
  assert.ok(out.includes('https://doi.org/10.63521/ijdh.2026.0014'))
})

test('plain text omits the pages segment rather than leaving a dangling comma', () => {
  const out = plainTextCitation(singleAuthor, journal)
  assert.ok(!out.includes(', .'), `dangling separator in: ${out}`)
  assert.ok(out.includes('1(2). https://doi.org/'))
})

test('BibTeX joins authors with "and" and uses an en-dash-free page range', () => {
  const out = bibtexCitation(article, journal)
  assert.ok(out.includes('author  = {Okafor, A. N. and Reyes-Morales, D.}'))
  // BibTeX page ranges use a double hyphen; an en dash would render wrongly.
  assert.ok(out.includes('pages   = {45--67}'), `expected -- range in: ${out}`)
  assert.ok(!out.includes('–'), 'no en dash should survive into BibTeX')
})

test('BibTeX entry is syntactically closed and has a usable key', () => {
  const out = bibtexCitation(article, journal)
  assert.match(out, /^@article\{okafor2026remote,/)
  assert.ok(out.trimEnd().endsWith('}'))
  // One opening brace per field plus the entry itself, all balanced.
  const opens = (out.match(/\{/g) ?? []).length
  const closes = (out.match(/\}/g) ?? []).length
  assert.equal(opens, closes, 'braces must balance')
})

test('BibTeX omits the pages field entirely when there is no page range', () => {
  const out = bibtexCitation(singleAuthor, journal)
  assert.ok(!out.includes('pages'), `pages should be absent: ${out}`)
  // The field before the omitted one must not be left with a trailing comma
  // directly before the closing brace.
  assert.ok(!/,\s*\n\}/.test(out), 'no trailing comma before the closing brace')
})

test('RIS emits one AU tag per author and a terminating ER tag', () => {
  const out = risCitation(article, journal)
  const lines = out.split('\n')
  assert.equal(lines.filter((l) => l.startsWith('AU  - ')).length, 2)
  assert.ok(lines[0].startsWith('TY  - JOUR'))
  assert.ok(lines[lines.length - 1].startsWith('ER  -'))
  assert.ok(out.includes('SP  - 45'))
  assert.ok(out.includes('EP  - 67'))
  assert.ok(out.includes('DO  - 10.63521/ijdh.2026.0014'))
})

test('RIS omits page tags when there is no range', () => {
  const out = risCitation(singleAuthor, journal)
  assert.ok(!out.includes('SP  -'))
  assert.ok(!out.includes('EP  -'))
})

test('RIS carries one KW tag per keyword', () => {
  const out = risCitation(article, journal)
  assert.equal(out.split('\n').filter((l) => l.startsWith('KW  - ')).length, 2)
})

test('EndNote uses percent tags and declares the record type first', () => {
  const out = endnoteCitation(article, journal)
  const lines = out.split('\n')
  assert.equal(lines[0], '%0 Journal Article')
  assert.equal(lines.filter((l) => l.startsWith('%A ')).length, 2)
  assert.ok(out.includes('%J International Journal of Digital Health'))
  assert.ok(out.includes('%R 10.63521/ijdh.2026.0014'))
})

test('buildCitation dispatches to each format and defaults to plain text', () => {
  assert.equal(buildCitation('bibtex', article, journal), bibtexCitation(article, journal))
  assert.equal(buildCitation('ris', article, journal), risCitation(article, journal))
  assert.equal(buildCitation('endnote', article, journal), endnoteCitation(article, journal))
  assert.equal(buildCitation('plain', article, journal), plainTextCitation(article, journal))
})

test('a single-word author name is not mangled into an initial', () => {
  const mononym = { ...article, authors: [{ name: 'Aristotle', affiliationIds: [] }] } as Article
  assert.ok(plainTextCitation(mononym, journal).startsWith('Aristotle (2026)'))
  assert.ok(bibtexCitation(mononym, journal).includes('author  = {Aristotle}'))
})
