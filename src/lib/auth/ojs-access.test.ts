import assert from 'node:assert/strict'
import { test } from 'node:test'
import { canOpenOjsPage, ojsPageRequirement } from './ojs-access.ts'

/**
 * The "old interface keeps coming back" bug, as a test: a Reader-only account
 * handed off to the submission wizard or the author dashboard met OJS's
 * "The current role does not have access to this operation" page. The gate
 * must catch those targets, and must not catch the pages a reader can open.
 */

const req = (path: string) => ojsPageRequirement(path, '/ojs')

test('workspace pages are gated on the role OJS checks', () => {
  assert.deepEqual(req('/ojs/index.php/ijdh/submission/wizard'), { journal: 'ijdh', needs: 'author', selfEnrolable: true })
  assert.deepEqual(req('/ojs/index.php/ijdh/submission'), { journal: 'ijdh', needs: 'author', selfEnrolable: true })
  assert.deepEqual(req('/ojs/index.php/ijdh/submissions'), { journal: 'ijdh', needs: 'author' })
  assert.deepEqual(req('/ojs/index.php/ijdh/dashboard'), { journal: 'ijdh', needs: 'author' })
  assert.deepEqual(req('/ojs/index.php/ijdh/dashboard/mySubmissions'), { journal: 'ijdh', needs: 'author' })
  assert.deepEqual(req('/ojs/index.php/ijdh/dashboard/reviewAssignments'), { journal: 'ijdh', needs: 'reviewer' })
  assert.deepEqual(req('/ojs/index.php/ijdh/dashboard/editorial'), { journal: 'ijdh', needs: 'editorial' })
  assert.deepEqual(req('/ojs/index.php/ijdh/management/settings/context'), { journal: 'ijdh', needs: 'editorial' })
  assert.deepEqual(req('/ojs/index.php/ijdh/workflow/access/20'), { journal: 'ijdh', needs: 'author' })
  assert.deepEqual(req('/ojs/index.php/ijdh/workflow/index/20/1'), { journal: 'ijdh', needs: 'editorial' })
})

test('pages every signed-in account may open are not gated', () => {
  assert.equal(req('/ojs/index.php/index/user/profile'), null)
  assert.equal(req('/ojs/index.php/ijdh/user/profile'), null)
  assert.equal(req('/ojs/index.php/ijdh/article/view/12'), null)
  assert.equal(req('/ojs/index.php/ijdh'), null)
  assert.equal(req('/ojs/'), null)
  assert.equal(req('/somewhere/else'), null)
})

test('honours whatever prefix OJS is mounted at', () => {
  assert.deepEqual(ojsPageRequirement('/index.php/ijdh/submission/wizard', '/'), { journal: 'ijdh', needs: 'author', selfEnrolable: true })
  assert.deepEqual(ojsPageRequirement('/ojs/index.php/ijdh/submission', '/ojs/'), { journal: 'ijdh', needs: 'author', selfEnrolable: true })
})

test('a reader-only account is kept off every workspace page', () => {
  const reader = ['reader']
  assert.equal(canOpenOjsPage(reader, req('/ojs/index.php/ijdh/submission/wizard')), false)
  assert.equal(canOpenOjsPage(reader, req('/ojs/index.php/ijdh/dashboard/mySubmissions')), false)
  assert.equal(canOpenOjsPage(reader, req('/ojs/index.php/ijdh/dashboard/reviewAssignments')), false)
  assert.equal(canOpenOjsPage(reader, req('/ojs/index.php/ijdh/dashboard/editorial')), false)
  assert.equal(canOpenOjsPage(reader, req('/ojs/index.php/index/user/profile')), true)
})

test('authors, reviewers and editors open what OJS lets them open', () => {
  assert.equal(canOpenOjsPage(['reader', 'author'], req('/ojs/index.php/ijdh/submission/wizard')), true)
  assert.equal(canOpenOjsPage(['reader', 'author'], req('/ojs/index.php/ijdh/dashboard/mySubmissions')), true)
  assert.equal(canOpenOjsPage(['reader', 'author'], req('/ojs/index.php/ijdh/dashboard/reviewAssignments')), false)
  assert.equal(canOpenOjsPage(['reviewer'], req('/ojs/index.php/ijdh/dashboard/reviewAssignments')), true)
  assert.equal(canOpenOjsPage(['reviewer'], req('/ojs/index.php/ijdh/submission/wizard')), false)
  assert.equal(canOpenOjsPage(['editor'], req('/ojs/index.php/ijdh/dashboard/editorial')), true)
  assert.equal(canOpenOjsPage(['manager'], req('/ojs/index.php/ijdh/submission/wizard')), true)
})

test('the site level has no dashboard for anyone', () => {
  assert.equal(canOpenOjsPage(['site-admin'], req('/ojs/index.php/index/dashboard/mySubmissions')), false)
  assert.equal(canOpenOjsPage(['author'], req('/ojs/index.php/index/submission/wizard')), false)
})

test('an empty role list is treated as a reader', () => {
  assert.equal(canOpenOjsPage([], req('/ojs/index.php/ijdh/submission/wizard')), false)
})

test('only the submission wizard is self-enrolable; the dashboard never is', () => {
  assert.equal(req('/ojs/index.php/ijdh/submission/wizard')?.selfEnrolable, true)
  assert.equal(req('/ojs/index.php/ijdh/dashboard/mySubmissions')?.selfEnrolable, undefined)
  assert.equal(req('/ojs/index.php/ijdh/submissions')?.selfEnrolable, undefined)
})
