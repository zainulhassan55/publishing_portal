import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { canReadAllSubmissions, isSiteAdmin, resolveScope, widestScope } from './access.ts'

/**
 * The role names are OJS's, lowercased by ROLE_NAMES in ./roles.ts. The
 * boundary that matters is manager/site-admin on one side and everyone else —
 * including `editor`, which is OJS's sub-editor — on the other, because that is
 * the line OJS itself draws when deciding whether a caller may read unassigned
 * submissions.
 */

test('only administrators and journal managers may read every submission', () => {
  assert.equal(canReadAllSubmissions(['site-admin']), true)
  assert.equal(canReadAllSubmissions(['manager']), true)
  assert.equal(canReadAllSubmissions(['author', 'reviewer', 'reader']), false)
})

test('an editor is assigned-only, which is both OJS behaviour and the policy', () => {
  // The one most likely to be "fixed" by someone reading `editor` as senior.
  // OJS restricts a sub-editor to assigned submissions, and the editorial
  // policy wants exactly that, so widening this would break both.
  assert.equal(canReadAllSubmissions(['editor']), false)
  assert.equal(canReadAllSubmissions(['assistant']), false)
  assert.equal(widestScope(['editor']), 'mine')
})

test('a missing or empty role list is not a privilege', () => {
  assert.equal(canReadAllSubmissions(undefined), false)
  assert.equal(canReadAllSubmissions([]), false)
  assert.equal(widestScope(undefined), 'mine')
})

test('scope defaults to mine when nothing is requested', () => {
  // The default has to be the narrow one: this is what the dashboard sends, and
  // it must mean the same thing whoever signs in.
  for (const requested of [null, undefined, '', 'mine']) {
    assert.deepEqual(resolveScope(requested, ['site-admin']), { ok: true, scope: 'mine' })
  }
})

test('scope=all is granted to an administrator and refused to an author', () => {
  assert.deepEqual(resolveScope('all', ['manager']), { ok: true, scope: 'all' })
  assert.deepEqual(resolveScope('all', ['author']), { ok: false, reason: 'forbidden' })
  assert.deepEqual(resolveScope('all', ['editor', 'reviewer']), { ok: false, reason: 'forbidden' })
})

test('the admin panel is site-admin only — a journal manager is not an administrator', () => {
  // The distinction the whole panel rests on. A manager runs one journal; the
  // panel decides which journals the press shows at all. Widening this hands
  // portfolio control to every journal manager on the site.
  assert.equal(isSiteAdmin(['site-admin']), true)
  assert.equal(isSiteAdmin(['manager']), false)
  assert.equal(isSiteAdmin(['manager', 'editor', 'author', 'reviewer']), false)
  assert.equal(isSiteAdmin([]), false)
  assert.equal(isSiteAdmin(undefined), false)
})

test('an unrecognised scope is refused rather than quietly narrowed', () => {
  // Downgrading it to `mine` would make a client bug look like it worked.
  assert.deepEqual(resolveScope('everything', ['site-admin']), { ok: false, reason: 'unknown-scope' })
})
