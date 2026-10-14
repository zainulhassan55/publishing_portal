import assert from 'node:assert/strict'
import { test } from 'node:test'
import { wizardPageOffersForm } from './ojs-login.ts'

/** Shape of the live start page (OJS 3.5.0.5): the form config is inlined as JSON. */
const open = `<h1>Make a Submission</h1><script>pkp.registry.init('app', "StartSubmissionPage", {"menu":{},"form":{"id":"startSubmission","method":"POST","action":"https:\\/\\/www.nextgeniqpress.com\\/ojs\\/index.php\\/ijdh\\/api\\/v1\\/submissions","fields":[]}});</script>`

const closed = `<h1>You are not able to make a submission to this journal</h1><p>You are not assigned a role that permits it. Contact the editor.</p><script>pkp.registry.init('app', "Page", {"menu":{}});</script>`

test('the start page with the form is open', () => {
  assert.equal(wizardPageOffersForm(open), true)
})

test('the not-allowed error page is closed', () => {
  assert.equal(wizardPageOffersForm(closed), false)
  assert.equal(wizardPageOffersForm(''), false)
})
