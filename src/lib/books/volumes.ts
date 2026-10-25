import { databaseConfigured, execute, insert, query } from '../db/index.ts'

/**
 * Book series volumes and chapters (migration 006).
 *
 * The public readers never throw, for the reason src/lib/articles/display.ts
 * gives: a series page must still render during a database outage and during
 * `next build`, which runs without a database. They return the last good
 * result, or nothing, and log. The admin functions do throw; an administrator
 * must see a failed save.
 */

export type Contributor = { name: string; affiliation: string; role: 'author' | 'editor' }
export type ChapterAuthor = { name: string; affiliation: string }
export type VolumeFormat = 'monograph' | 'edited' | 'proceedings'

export type BookChapter = {
  id: number
  volumeId: number
  seq: number
  title: string
  authors: ChapterAuthor[]
  abstract: string | null
  pageRange: string | null
  doi: string | null
  pdfUploadId: string | null
  hidden: boolean
}

export type BookVolume = {
  id: number
  seriesSlug: string
  slug: string
  volumeNumber: number | null
  title: string
  subtitle: string | null
  format: VolumeFormat
  contributors: Contributor[]
  abstract: string | null
  keywords: string[]
  isbnPrint: string | null
  isbnOnline: string | null
  doi: string | null
  licence: string
  pages: number | null
  /** ISO date, or null while unpublished. */
  publishedAt: string | null
  hidden: boolean
  cfpOpen: boolean
  cfpDeadline: string | null
  cfpText: string | null
  pdfUploadId: string | null
  coverUploadId: string | null
  chapters: BookChapter[]
}

type VolumeRow = Record<string, unknown> & { id: number }

const json = <T>(value: unknown, fallback: T): T => {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      return fallback
    }
  }
  return value as T
}

const isoDate = (value: unknown): string | null => {
  if (!value) return null
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).slice(0, 10)
}

const toChapter = (r: Record<string, unknown>): BookChapter => ({
  id: Number(r.id),
  volumeId: Number(r.volume_id),
  seq: Number(r.seq),
  title: String(r.title),
  authors: json<ChapterAuthor[]>(r.authors, []),
  abstract: (r.abstract as string) ?? null,
  pageRange: (r.page_range as string) ?? null,
  doi: (r.doi as string) ?? null,
  pdfUploadId: (r.pdf_upload_id as string) ?? null,
  hidden: Boolean(Number(r.hidden)),
})

const toVolume = (r: VolumeRow, chapters: BookChapter[]): BookVolume => ({
  id: Number(r.id),
  seriesSlug: String(r.series_slug),
  slug: String(r.slug),
  volumeNumber: r.volume_number === null || r.volume_number === undefined ? null : Number(r.volume_number),
  title: String(r.title),
  subtitle: (r.subtitle as string) ?? null,
  format: r.format as VolumeFormat,
  contributors: json<Contributor[]>(r.contributors, []),
  abstract: (r.abstract as string) ?? null,
  keywords: json<string[]>(r.keywords, []),
  isbnPrint: (r.isbn_print as string) ?? null,
  isbnOnline: (r.isbn_online as string) ?? null,
  doi: (r.doi as string) ?? null,
  licence: String(r.licence ?? 'CC BY 4.0'),
  pages: r.pages === null || r.pages === undefined ? null : Number(r.pages),
  publishedAt: isoDate(r.published_at),
  hidden: Boolean(Number(r.hidden)),
  cfpOpen: Boolean(Number(r.cfp_open)),
  cfpDeadline: isoDate(r.cfp_deadline),
  cfpText: (r.cfp_text as string) ?? null,
  pdfUploadId: (r.pdf_upload_id as string) ?? null,
  coverUploadId: (r.cover_upload_id as string) ?? null,
  chapters: chapters.filter((c) => c.volumeId === Number(r.id)).sort((a, b) => a.seq - b.seq),
})

async function loadVolumes(where: string, params: (string | number)[]): Promise<BookVolume[]> {
  const rows = await query<VolumeRow>(`SELECT * FROM book_volumes ${where}`, params)
  if (rows.length === 0) return []
  const chapters = (
    await query<Record<string, unknown>>(
      `SELECT * FROM book_chapters WHERE volume_id IN (${rows.map(() => '?').join(',')})`,
      rows.map((r) => r.id),
    )
  ).map(toChapter)
  return rows.map((r) => toVolume(r, chapters))
}

/* ------------------------------ public reads ------------------------------ */

const inBuild = () => process.env.NEXT_PHASE === 'phase-production-build'
const lastGood = new Map<string, BookVolume[]>()

async function safeRead(cacheKey: string, where: string, params: (string | number)[]): Promise<BookVolume[]> {
  if (inBuild() || !databaseConfigured) return []
  try {
    const volumes = await loadVolumes(where, params)
    lastGood.set(cacheKey, volumes)
    return volumes
  } catch (error) {
    console.error('[books] could not read book_volumes; using the last known result:', error)
    return lastGood.get(cacheKey) ?? []
  }
}

const today = () => new Date().toISOString().slice(0, 10)

const isPublic = (v: BookVolume) => !v.hidden && v.publishedAt !== null && v.publishedAt <= today()

/** Published, visible volumes of a series, newest first, with visible chapters only. */
export async function publishedVolumes(seriesSlug: string): Promise<BookVolume[]> {
  const all = await safeRead(`series:${seriesSlug}`, 'WHERE series_slug = ? ORDER BY published_at DESC, id DESC', [seriesSlug])
  return all.filter(isPublic).map((v) => ({ ...v, chapters: v.chapters.filter((c) => !c.hidden) }))
}

export async function publishedVolume(seriesSlug: string, slug: string): Promise<BookVolume | undefined> {
  return (await publishedVolumes(seriesSlug)).find((v) => v.slug === slug)
}

export const callIsOpen = (v: BookVolume) => v.cfpOpen && (!v.cfpDeadline || v.cfpDeadline >= today())

/** Volumes accepting chapter submissions, published or not. */
export async function openCalls(seriesSlug: string): Promise<BookVolume[]> {
  const all = await safeRead(`series:${seriesSlug}`, 'WHERE series_slug = ? ORDER BY published_at DESC, id DESC', [seriesSlug])
  return all.filter((v) => !v.hidden && callIsOpen(v))
}

export async function volumeWithOpenCall(seriesSlug: string, slug: string): Promise<BookVolume | undefined> {
  return (await openCalls(seriesSlug)).find((v) => v.slug === slug)
}

/* ------------------------------ admin access ------------------------------ */

export const allVolumes = () => loadVolumes('ORDER BY series_slug, created_at DESC', [])

export const volumeById = async (id: number) => (await loadVolumes('WHERE id = ?', [id]))[0]

export type VolumeInput = Omit<BookVolume, 'id' | 'chapters'>

const volumeParams = (v: VolumeInput) => [
  v.seriesSlug,
  v.slug,
  v.volumeNumber,
  v.title,
  v.subtitle,
  v.format,
  JSON.stringify(v.contributors),
  v.abstract,
  JSON.stringify(v.keywords),
  v.isbnPrint,
  v.isbnOnline,
  v.doi,
  v.licence,
  v.pages,
  v.publishedAt,
  v.hidden ? 1 : 0,
  v.cfpOpen ? 1 : 0,
  v.cfpDeadline,
  v.cfpText,
  v.pdfUploadId,
  v.coverUploadId,
]

const VOLUME_COLUMNS =
  'series_slug, slug, volume_number, title, subtitle, format, contributors, abstract, keywords, isbn_print, isbn_online, doi, licence, pages, published_at, hidden, cfp_open, cfp_deadline, cfp_text, pdf_upload_id, cover_upload_id'

export const createVolume = (v: VolumeInput) =>
  insert(`INSERT INTO book_volumes (${VOLUME_COLUMNS}) VALUES (${VOLUME_COLUMNS.split(',').map(() => '?').join(', ')})`, volumeParams(v))

export const updateVolume = (id: number, v: VolumeInput) =>
  execute(`UPDATE book_volumes SET ${VOLUME_COLUMNS.split(', ').map((c) => `${c} = ?`).join(', ')} WHERE id = ?`, [...volumeParams(v), id])

export const deleteVolume = (id: number) => execute('DELETE FROM book_volumes WHERE id = ?', [id])

export type ChapterInput = Omit<BookChapter, 'id'>

const chapterParams = (c: ChapterInput) => [
  c.volumeId,
  c.seq,
  c.title,
  JSON.stringify(c.authors),
  c.abstract,
  c.pageRange,
  c.doi,
  c.pdfUploadId,
  c.hidden ? 1 : 0,
]

export const createChapter = (c: ChapterInput) =>
  insert(
    'INSERT INTO book_chapters (volume_id, seq, title, authors, abstract, page_range, doi, pdf_upload_id, hidden) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    chapterParams(c),
  )

export const updateChapter = (id: number, c: ChapterInput) =>
  execute(
    'UPDATE book_chapters SET volume_id = ?, seq = ?, title = ?, authors = ?, abstract = ?, page_range = ?, doi = ?, pdf_upload_id = ?, hidden = ? WHERE id = ?',
    [...chapterParams(c), id],
  )

export const chapterById = async (id: number) =>
  (await query<Record<string, unknown>>('SELECT * FROM book_chapters WHERE id = ?', [id])).map(toChapter)[0]

export const deleteChapter = (id: number) => execute('DELETE FROM book_chapters WHERE id = ?', [id])

/** Clears the last-good cache after an admin change, so the next render reads fresh rows. */
export const resetBooksCache = () => lastGood.clear()
