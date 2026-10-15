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

/* ------------------------------ styled forms ------------------------------ */

import {
  apaCitation,
  chicagoCitation,
  harvardCitation,
  ieeeCitation,
  mlaCitation,
  vancouverCitation,
  buildAllCitations,
  citationFormats,
} from './citation.ts'

test('APA 7 inverts every author, uses an ampersand, and italicises nothing', () => {
  assert.equal(
    apaCitation(article, journal),
    'Okafor, A. N., & Reyes-Morales, D. (2026). Remote photoplethysmography for continuous heart-rate monitoring. International Journal of Digital Health, 1(2), 45–67. https://doi.org/10.63521/ijdh.2026.0014',
  )
})

test('MLA 9 leads with the inverted first author and spells the second out', () => {
  assert.equal(
    mlaCitation(article, journal),
    'Okafor, Amara N., and Daniel Reyes-Morales. "Remote photoplethysmography for continuous heart-rate monitoring." International Journal of Digital Health, vol. 1, no. 2, 2026, pp. 45–67, https://doi.org/10.63521/ijdh.2026.0014.',
  )
})

test('MLA 9 cuts to "et al." at three authors', () => {
  const three = { ...article, authors: [...article.authors, { name: 'Wei Zhang', affiliationIds: [] }] } as Article
  assert.ok(mlaCitation(three, journal).startsWith('Okafor, Amara N., et al. "'))
})

test('Chicago author-date puts the year after the authors and the pages after a colon', () => {
  assert.equal(
    chicagoCitation(article, journal),
    'Okafor, Amara N., and Daniel Reyes-Morales. 2026. "Remote photoplethysmography for continuous heart-rate monitoring." International Journal of Digital Health 1 (2): 45–67. https://doi.org/10.63521/ijdh.2026.0014.',
  )
})

test('Harvard uses tight initials, single quotes and a bare doi', () => {
  assert.equal(
    harvardCitation(article, journal),
    "Okafor, A.N. and Reyes-Morales, D. (2026) 'Remote photoplethysmography for continuous heart-rate monitoring', International Journal of Digital Health, 1(2), pp. 45–67. doi: 10.63521/ijdh.2026.0014.",
  )
})

test('Vancouver uses bare initials and the year;volume(issue):pages run', () => {
  assert.equal(
    vancouverCitation(article, journal),
    'Okafor AN, Reyes-Morales D. Remote photoplethysmography for continuous heart-rate monitoring. International Journal of Digital Health. 2026;1(2):45–67. doi:10.63521/ijdh.2026.0014',
  )
})

test('IEEE puts initials first and the title in quotes with the comma inside', () => {
  assert.equal(
    ieeeCitation(article, journal),
    'A. N. Okafor and D. Reyes-Morales, "Remote photoplethysmography for continuous heart-rate monitoring," International Journal of Digital Health, vol. 1, no. 2, pp. 45–67, 2026, doi: 10.63521/ijdh.2026.0014.',
  )
})

test('a paper without a DOI cites its article page rather than a bare doi.org', () => {
  const noDoi = { ...article, doi: '' } as Article
  for (const f of citationFormats) {
    const out = buildCitation(f.id, noDoi, journal)
    assert.ok(!out.includes('doi.org/'), `${f.id} must not emit a DOI link with no DOI`)
    assert.ok(out.includes('/articles/rppg-study'), `${f.id} must fall back to the article page`)
  }
  assert.ok(!bibtexCitation(noDoi, journal).includes('doi     ='), 'BibTeX omits an empty doi field')
})

test('buildAllCitations returns every listed format', () => {
  const all = buildAllCitations(article, journal)
  assert.deepEqual(Object.keys(all).sort(), citationFormats.map((f) => f.id).sort())
  assert.equal(all.apa, apaCitation(article, journal))
})

test('styles that end the author block with a stop never double it after an initial', () => {
  const single = { ...article, authors: [{ name: 'Amara N. Okafor', affiliationIds: [] }] } as Article
  assert.ok(mlaCitation(single, journal).startsWith('Okafor, Amara N. "'))
  assert.ok(chicagoCitation(single, journal).startsWith('Okafor, Amara N. 2026. "'))
  assert.ok(!vancouverCitation(single, journal).includes('..'))
})
