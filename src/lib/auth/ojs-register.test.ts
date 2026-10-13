import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { parseCsrfToken, parseRegisterContexts, parseRegisterError } from './ojs-register.ts'

/**
 * Markup copied from the live OJS 3.5.0.5 registration form, trimmed to the
 * parts the parsers read. These tests are what turn an OJS upgrade that
 * changes the form into a failing build rather than a visitor who cannot
 * register — the same reasoning as the login parser tests next door.
 */
const FORM = `
<form class="cmp_form register" method="post">
  <input type="hidden" name="csrfToken" value="abc123token">
  <fieldset name="contexts">
    <legend> Which journals on this site would you like to register with? </legend>
    <div class="fields">
      <div id="contextOptinGroup" class="context_optin">
        <ul class="contexts">
          <li class="context">
            <div class="name"> International Journal of Digital Health </div class="name">
            <fieldset class="roles">
              <legend> Request the following roles. </legend>
              <label> <input type="checkbox" name="readerGroup[17]"> Reader </label>
              <label> <input type="checkbox" name="reviewerGroup[16]"> Reviewer </label>
            </fieldset>
            <div class="context_privacy ">
              <label> <input type="checkbox" name="privacyConsent[1]" value="1"> Yes, I agree </label>
            </div>
          </li>
          <li class="context">
            <div class="name"> International Journal of Quantum Technologies </div class="name">
            <fieldset class="roles">
              <label> <input type="checkbox" name="readerGroup[179]"> Reader </label>
              <label> <input type="checkbox" name="reviewerGroup[178]"> Reviewer </label>
            </fieldset>
            <div class="context_privacy ">
              <label> <input type="checkbox" name="privacyConsent[10]" value="1"> Yes, I agree </label>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </fieldset>
</form>`

test('parseCsrfToken finds the hidden token', () => {
  assert.equal(parseCsrfToken(FORM), 'abc123token')
})

test('parseCsrfToken returns empty rather than throwing when absent', () => {
  assert.equal(parseCsrfToken('<form></form>'), '')
})

test('parseRegisterContexts keeps each journal with its own group ids', () => {
  const contexts = parseRegisterContexts(FORM)

  assert.equal(contexts.length, 2)

  // The whole point of parsing per list item: a flat scan of the document
  // would pair the first journal's name with every id on the page.
  assert.deepEqual(contexts[0], {
    name: 'International Journal of Digital Health',
    readerGroup: 'readerGroup[17]',
    reviewerGroup: 'reviewerGroup[16]',
    privacyConsent: 'privacyConsent[1]',
  })
  assert.deepEqual(contexts[1], {
    name: 'International Journal of Quantum Technologies',
    readerGroup: 'readerGroup[179]',
    reviewerGroup: 'reviewerGroup[178]',
    privacyConsent: 'privacyConsent[10]',
  })
})

test('parseRegisterContexts returns nothing when the form has no journals', () => {
  assert.deepEqual(parseRegisterContexts('<form><input name="email"></form>'), [])
})

/**
 * A rejected registration, as OJS 3.5.0.5 actually renders it: a generic
 * banner above a list of the real reasons. Confirmed against the live
 * install's stylesheet, which carries selectors for both
 * (`.page_register #formErrors .pkp_form_error_list`).
 *
 * This is the shape that broke the first version of the parser — it read the
 * banner and discarded the list, so every rejection reached the person as
 * "there were errors processing this form" and none of them said what to fix.
 */
const REJECTED = `
<div id="formErrors">
  <div class="pkp_form_error">There were errors processing this form. Please check below for problems.</div>
  <ul class="pkp_form_error_list">
    <li><a href="#username">This username is already in use.</a></li>
    <li><a href="#email">This email address is already registered.</a></li>
  </ul>
</div>`

test('parseRegisterError reports the reasons, not the banner above them', () => {
  assert.equal(
    parseRegisterError(REJECTED),
    'This username is already in use. This email address is already registered.',
  )
})

test('parseRegisterError surfaces OJS wording so the fix is actionable', () => {
  const html = '<div class="pkp_form_error">This username is already in use.</div>'
  assert.equal(parseRegisterError(html), 'This username is already in use.')
})

test('parseRegisterError falls back to a field-level error when there is no list', () => {
  const html = '<div class="fields"><div><span class="error">A password is required.</span></div></div>'
  assert.equal(parseRegisterError(html), 'A password is required.')
})

test('parseRegisterError strips nested markup rather than truncating at it', () => {
  const html = '<span class="pkp_form_error">The password must be at least <strong>6</strong> characters.</span>'
  assert.equal(parseRegisterError(html), 'The password must be at least 6 characters.')
})

test('parseRegisterError returns null for a page with no error', () => {
  assert.equal(parseRegisterError(FORM), null)
})
