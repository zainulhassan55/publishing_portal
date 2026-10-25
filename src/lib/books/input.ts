import { readList } from '../forms/server'
import { getUpload, verifyUploads, attachUploads } from '../uploads/service'
import type { UploadPurpose } from '../uploads/policy'
import { isDoi, Validator } from '../validate'
import type { ChapterInput, VolumeInput } from './volumes'
import { seriesSlugs } from '../../data/registry'

/** URL segment from a title: lowercase ASCII words joined by hyphens, at most 80 characters. */
export const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '')

const isIsbn = (value: string) => {
  const digits = value.replace(/[-\s]/g, '')
  return /^(97[89]\d{10}|\d{9}[\dX])$/i.test(digits)
}

const optional = (v: Validator, field: string, value: unknown, label: string, max: number) =>
  v.string({ field, value, label, max }) || null

const date = (v: Validator, field: string, value: unknown, label: string) => {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw) || Number.isNaN(Date.parse(raw))) {
    v.add({ field, message: `${label} must be a date` })
    return null
  }
  return raw
}

const uploadId = (value: unknown) => (typeof value === 'string' && /^[0-9a-f-]{36}$/.test(value) ? value : null)

export function parseVolume(body: Record<string, unknown>): VolumeInput {
  const v = new Validator()
  const seriesSlug = v.oneOf('seriesSlug', body.seriesSlug, seriesSlugs, 'Series')
  const title = v.string({ field: 'title', value: body.title, label: 'Title', required: true, max: 400 })
  const slugRaw = typeof body.slug === 'string' && body.slug.trim() ? body.slug : title
  const slug = slugify(slugRaw)
  if (!slug) v.add({ field: 'slug', message: 'URL segment is required' })
  const format = v.oneOf('format', body.format, ['monograph', 'edited', 'proceedings'] as const, 'Format')

  const contributors = readList(body.contributors, 30)
    .map((c, i) => ({
      name: v.string({ field: `contributors.${i}.name`, value: c.name, label: 'Contributor name', required: true, max: 200 }),
      affiliation: v.string({ field: `contributors.${i}.affiliation`, value: c.affiliation, label: 'Affiliation', max: 300 }),
      role: c.role === 'editor' ? ('editor' as const) : ('author' as const),
    }))
  if (contributors.length === 0) v.add({ field: 'contributors', message: 'Add at least one author or editor' })

  const isbnPrint = optional(v, 'isbnPrint', body.isbnPrint, 'Print ISBN', 20)
  const isbnOnline = optional(v, 'isbnOnline', body.isbnOnline, 'Online ISBN', 20)
  if (isbnPrint && !isIsbn(isbnPrint)) v.add({ field: 'isbnPrint', message: 'Print ISBN is not a valid ISBN-10 or ISBN-13' })
  if (isbnOnline && !isIsbn(isbnOnline)) v.add({ field: 'isbnOnline', message: 'Online ISBN is not a valid ISBN-10 or ISBN-13' })
  const doi = optional(v, 'doi', body.doi, 'DOI', 190)
  if (doi && !isDoi(doi)) v.add({ field: 'doi', message: 'DOI must look like 10.63521/…' })

  const volumeNumber = body.volumeNumber === '' || body.volumeNumber === null || body.volumeNumber === undefined ? null : Number(body.volumeNumber)
  if (volumeNumber !== null && (!Number.isInteger(volumeNumber) || volumeNumber < 1)) v.add({ field: 'volumeNumber', message: 'Volume number must be a whole number' })
  const pages = body.pages === '' || body.pages === null || body.pages === undefined ? null : Number(body.pages)
  if (pages !== null && (!Number.isInteger(pages) || pages < 1)) v.add({ field: 'pages', message: 'Pages must be a whole number' })

  const keywords = (typeof body.keywords === 'string' ? body.keywords.split(/[,;\n]/) : Array.isArray(body.keywords) ? body.keywords : [])
    .map((k) => String(k).trim())
    .filter(Boolean)
    .slice(0, 20)

  const parsed: VolumeInput = {
    seriesSlug,
    slug,
    volumeNumber,
    title,
    subtitle: optional(v, 'subtitle', body.subtitle, 'Subtitle', 400),
    format: (format || 'edited') as VolumeInput['format'],
    contributors,
    abstract: optional(v, 'abstract', body.abstract, 'Abstract', 10000),
    keywords,
    isbnPrint,
    isbnOnline,
    doi,
    licence: v.string({ field: 'licence', value: body.licence ?? 'CC BY 4.0', label: 'Licence', required: true, max: 60 }),
    pages,
    publishedAt: date(v, 'publishedAt', body.publishedAt, 'Publication date'),
    hidden: body.hidden === true,
    cfpOpen: body.cfpOpen === true,
    cfpDeadline: date(v, 'cfpDeadline', body.cfpDeadline, 'Chapter deadline'),
    cfpText: optional(v, 'cfpText', body.cfpText, 'Call for chapters text', 10000),
    pdfUploadId: uploadId(body.pdfUploadId),
    coverUploadId: uploadId(body.coverUploadId),
  }
  // Publishing without the PDF would give readers an empty volume page.
  if (parsed.publishedAt && !parsed.pdfUploadId && !parsed.hidden) {
    v.add({ field: 'pdfUploadId', message: 'Upload the published PDF before setting a publication date' })
  }
  v.throwIfInvalid()
  return parsed
}

export function parseChapter(body: Record<string, unknown>, volumeId: number): ChapterInput {
  const v = new Validator()
  const seq = Number(body.seq)
  if (!Number.isInteger(seq) || seq < 1) v.add({ field: 'seq', message: 'Chapter number must be a whole number' })
  const title = v.string({ field: 'title', value: body.title, label: 'Chapter title', required: true, max: 400 })
  const authors = readList(body.authors, 30).map((a, i) => ({
    name: v.string({ field: `authors.${i}.name`, value: a.name, label: 'Author name', required: true, max: 200 }),
    affiliation: v.string({ field: `authors.${i}.affiliation`, value: a.affiliation, label: 'Affiliation', max: 300 }),
  }))
  if (authors.length === 0) v.add({ field: 'authors', message: 'Add at least one author' })
  const doi = optional(v, 'doi', body.doi, 'DOI', 190)
  if (doi && !isDoi(doi)) v.add({ field: 'doi', message: 'DOI must look like 10.63521/…' })
  const parsed: ChapterInput = {
    volumeId,
    seq,
    title,
    authors,
    abstract: optional(v, 'abstract', body.abstract, 'Abstract', 10000),
    pageRange: optional(v, 'pageRange', body.pageRange, 'Pages', 40),
    doi,
    pdfUploadId: uploadId(body.pdfUploadId),
    hidden: body.hidden === true,
  }
  v.throwIfInvalid()
  return parsed
}

/**
 * Makes sure an upload referenced by a volume or chapter is verified and moved
 * out of `pending/`. An upload that is already attached is left as it is.
 */
export async function ensureAttached(id: string | null, purpose: UploadPurpose, field: string, ownerType: string, ownerId: number, prefix: string) {
  if (!id) return
  const row = await getUpload(id)
  if (row?.status === 'attached') return
  const rows = await verifyUploads([{ id, purpose, field }])
  await attachUploads(rows, ownerType, ownerId, prefix)
}
