import { test } from 'node:test'
import assert from 'node:assert/strict'
import { decisionDraft, emailsOnDecision, hasPlaceholder } from './decision-email.ts'

const base = { name: 'Dr Rao', reference: 'NGIQ-ED-00003', title: 'Reviewer application', targetTitle: 'IJIC' }

test('only accepted, declined and revisions come with a letter', () => {
  assert.equal(emailsOnDecision('accepted'), true)
  assert.equal(emailsOnDecision('declined'), true)
  assert.equal(emailsOnDecision('revisions'), true)
  assert.equal(emailsOnDecision('under_review'), false)
  assert.equal(decisionDraft({ ...base, kind: 'application', status: 'under_review' }), null)
})

test('a reviewer acceptance names the role, the journal and the reference', () => {
  const d = decisionDraft({ ...base, kind: 'application', role: 'reviewer', status: 'accepted' })!
  assert.match(d.subject, /accepted \(NGIQ-ED-00003\)/)
  assert.match(d.body, /^Dear Dr Rao,/)
  assert.match(d.body, /reviewer for IJIC/)
  assert.match(d.body, /NGIQ-ED-00003/)
})

test('the decision note is folded into a decline, and replaces the placeholder', () => {
  const withNote = decisionDraft({ ...base, kind: 'application', status: 'declined', note: 'Expertise outside scope.' })!
  assert.match(withNote.body, /Expertise outside scope\./)
  assert.equal(hasPlaceholder(withNote.body), false)

  const without = decisionDraft({ ...base, kind: 'application', status: 'declined' })!
  assert.equal(hasPlaceholder(without.body), true)
})

test('every kind has wording for every emailed status', () => {
  for (const kind of ['journal_proposal', 'application', 'special_issue', 'book_volume', 'book_submission'] as const) {
    for (const status of ['accepted', 'declined', 'revisions']) {
      const d = decisionDraft({ ...base, kind, status, note: 'x' })
      assert.ok(d && d.subject && d.body.length > 50, `${kind}/${status}`)
      assert.doesNotMatch(d.body, /undefined/, `${kind}/${status}`)
    }
  }
})
