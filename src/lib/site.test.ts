import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { absoluteUrl, siteUrl } from './site.ts'

test('a site path gets the site origin', () => {
  assert.equal(absoluteUrl('/articles/x'), `${siteUrl}/articles/x`)
  assert.equal(absoluteUrl('articles/x'), `${siteUrl}/articles/x`)
})

test('an absolute URL is left alone', () => {
  // The PDF galley OJS reports is already absolute, on the OJS origin.
  const pdf = 'https://www.nextgeniqpress.com/ojs/index.php/ijdh/article/view/21/version/23/2'
  assert.equal(absoluteUrl(pdf), pdf)
})
