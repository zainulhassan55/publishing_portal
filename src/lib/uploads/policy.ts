/**
 * What may be uploaded through the portal's forms, and how a file is checked
 * once it has arrived.
 *
 * Pure functions only, so the rules are unit-tested without storage or a
 * database. The upload routes and the forms both read this file: the browser
 * uses it to refuse an oversized file before sending a byte, and the server
 * applies it again because the browser is not to be trusted.
 */

export type UploadPurpose =
  | 'cv'
  | 'proposal'
  | 'sample_chapter'
  | 'toc'
  | 'manuscript'
  | 'title_page'
  | 'supporting'
  /** Admin only: the published PDF of a volume or chapter. */
  | 'final_pdf'
  /** Admin only: a volume's cover image. */
  | 'cover'

export type AllowedType = 'pdf' | 'docx' | 'doc' | 'jpg' | 'png'

export const MIME: Record<AllowedType, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc: 'application/msword',
  jpg: 'image/jpeg',
  png: 'image/png',
}

const MB = 1024 * 1024

export const PURPOSES: Record<UploadPurpose, { label: string; types: AllowedType[]; maxBytes: number }> = {
  cv: { label: 'CV', types: ['pdf', 'docx', 'doc'], maxBytes: 10 * MB },
  proposal: { label: 'Proposal document', types: ['pdf', 'docx', 'doc'], maxBytes: 20 * MB },
  sample_chapter: { label: 'Sample chapter', types: ['pdf', 'docx', 'doc'], maxBytes: 50 * MB },
  toc: { label: 'Table of contents', types: ['pdf', 'docx', 'doc'], maxBytes: 10 * MB },
  manuscript: { label: 'Manuscript', types: ['pdf', 'docx', 'doc'], maxBytes: 50 * MB },
  title_page: { label: 'Title page', types: ['pdf', 'docx', 'doc'], maxBytes: 10 * MB },
  supporting: { label: 'Supporting file', types: ['pdf', 'docx', 'doc'], maxBytes: 20 * MB },
  final_pdf: { label: 'Published PDF', types: ['pdf'], maxBytes: 300 * MB },
  cover: { label: 'Cover image', types: ['jpg', 'png'], maxBytes: 5 * MB },
}

/** Purposes the public forms may request; the rest are signed only for administrators. */
export const PUBLIC_PURPOSES: UploadPurpose[] = ['cv', 'proposal', 'sample_chapter', 'toc', 'manuscript', 'title_page', 'supporting']

export const isPurpose = (value: unknown): value is UploadPurpose =>
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(PURPOSES, value)

export const acceptAttribute = (purpose: UploadPurpose) =>
  PURPOSES[purpose].types.flatMap((t) => [`.${t}`, MIME[t]]).join(',')

export function typeOf(filename: string, contentType: string): AllowedType | null {
  const raw = filename.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1]
  const ext = raw === 'jpeg' ? 'jpg' : raw
  const byExt = (Object.keys(MIME) as AllowedType[]).find((t) => t === ext)
  if (!byExt) return null
  // Browsers report an empty type for some Word files; the extension decides
  // then, and the signature check after upload is what actually protects us.
  if (contentType && contentType !== MIME[byExt] && contentType !== 'application/octet-stream') return null
  return byExt
}

export type UploadCheck = { ok: true; type: AllowedType } | { ok: false; message: string }

/** The pre-upload check: type and size against the purpose's rules. */
export function checkUpload(purpose: UploadPurpose, filename: string, contentType: string, size: number): UploadCheck {
  const rule = PURPOSES[purpose]
  const type = typeOf(filename, contentType)
  if (!type || !rule.types.includes(type)) {
    return { ok: false, message: `${rule.label} must be a ${rule.types.map((t) => t.toUpperCase()).join(', ')} file` }
  }
  if (!Number.isInteger(size) || size <= 0) return { ok: false, message: 'The file is empty' }
  if (size > rule.maxBytes) return { ok: false, message: `${rule.label} must be ${rule.maxBytes / MB} MB or smaller` }
  return { ok: true, type }
}

/**
 * Does the start of the file match its claimed type? PDF begins `%PDF-`, DOCX
 * is a ZIP container (`PK\x03\x04`), and legacy DOC is an OLE compound file.
 * A renamed executable fails here even though its name and declared type passed.
 */
export function signatureMatches(type: AllowedType, head: Uint8Array): boolean {
  const starts = (...bytes: number[]) => bytes.every((b, i) => head[i] === b)
  if (type === 'pdf') return starts(0x25, 0x50, 0x44, 0x46, 0x2d)
  if (type === 'docx') return starts(0x50, 0x4b, 0x03, 0x04)
  if (type === 'jpg') return starts(0xff, 0xd8, 0xff)
  if (type === 'png') return starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)
  return starts(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1)
}

/**
 * A filename safe to put in an object key and a Content-Disposition header:
 * ASCII letters, digits, dot, dash and underscore, at most 120 characters,
 * keeping the extension.
 */
export function safeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? 'file'
  const cleaned = base
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+/, '')
  const ext = cleaned.match(/\.[a-z0-9]+$/i)?.[0] ?? ''
  const stem = cleaned
    .slice(0, cleaned.length - ext.length)
    .slice(0, 120 - ext.length)
    .replace(/-+$/, '')
  return `${stem || 'file'}${ext.toLowerCase()}`
}

export const formatBytes = (n: number) => (n >= MB ? `${(n / MB).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)
