import assert from 'node:assert/strict'
import { test } from 'node:test'
import { checkUpload, MIME, safeFilename, signatureMatches, typeOf } from './policy.ts'

const MB = 1024 * 1024

test('accepts a PDF CV within the size limit', () => {
  assert.deepEqual(checkUpload('cv', 'Jane Doe CV.pdf', MIME.pdf, 2 * MB), { ok: true, type: 'pdf' })
})

test('refuses a file over the purpose limit', () => {
  const result = checkUpload('cv', 'cv.pdf', MIME.pdf, 11 * MB)
  assert.equal(result.ok, false)
})

test('refuses a disallowed extension', () => {
  assert.equal(checkUpload('manuscript', 'paper.exe', 'application/octet-stream', 1000).ok, false)
  assert.equal(checkUpload('manuscript', 'paper.zip', 'application/zip', 1000).ok, false)
})

test('refuses a declared type that contradicts the extension', () => {
  assert.equal(typeOf('paper.pdf', 'text/html'), null)
})

test('lets the extension decide when the browser reports no type', () => {
  assert.equal(typeOf('paper.docx', ''), 'docx')
})

test('refuses an empty file', () => {
  assert.equal(checkUpload('cv', 'cv.pdf', MIME.pdf, 0).ok, false)
})

test('checks file signatures', () => {
  assert.equal(signatureMatches('pdf', new TextEncoder().encode('%PDF-1.7')), true)
  assert.equal(signatureMatches('pdf', new TextEncoder().encode('<html>')), false)
  assert.equal(signatureMatches('docx', new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14])), true)
  assert.equal(signatureMatches('doc', new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])), true)
  assert.equal(signatureMatches('docx', new Uint8Array([0x4d, 0x5a])), false)
})

test('makes filenames safe for keys and headers', () => {
  assert.equal(safeFilename('../../etc/passwd'), 'passwd')
  assert.equal(safeFilename('Résumé final (v2).PDF'), 'Resume-final-v2.pdf')
  assert.equal(safeFilename('"quoted";name.docx'), 'quoted-name.docx')
  assert.equal(safeFilename('a'.repeat(300) + '.pdf').length, 120)
})

test('accepts covers as JPEG or PNG only', () => {
  assert.equal(checkUpload('cover', 'cover.jpeg', 'image/jpeg', 1000).ok, true)
  assert.equal(checkUpload('cover', 'cover.png', 'image/png', 1000).ok, true)
  assert.equal(checkUpload('cover', 'cover.pdf', MIME.pdf, 1000).ok, false)
  assert.equal(signatureMatches('png', new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), true)
  assert.equal(signatureMatches('jpg', new Uint8Array([0xff, 0xd8, 0xff, 0xe0])), true)
})

test('final PDFs allow large files but only PDF', () => {
  assert.equal(checkUpload('final_pdf', 'volume.pdf', MIME.pdf, 250 * MB).ok, true)
  assert.equal(checkUpload('final_pdf', 'volume.docx', MIME.docx, 1000).ok, false)
})
