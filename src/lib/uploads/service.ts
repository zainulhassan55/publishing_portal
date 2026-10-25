import { execute, insert, query } from '../db'
import { copyObject, deleteObject, headObject, presignUpload, readHead, storageConfigured, StorageUnavailableError } from '../storage'
import { ValidationError, type FieldError } from '../validate'
import { checkUpload, MIME, PURPOSES, safeFilename, signatureMatches, typeOf, type UploadPurpose } from './policy'

/**
 * The life of an uploaded file:
 *
 * 1. sign    — a form asks for a URL; a `pending` row is written and the
 *              browser PUTs the file straight to storage under `pending/`.
 * 2. verify  — when the form is submitted, each referenced upload must exist,
 *              have the size that was signed for, and start with the bytes its
 *              type requires.
 * 3. attach  — the object is copied out of `pending/` (which a bucket lifecycle
 *              rule empties after a day) to a key under its owner, and the row
 *              records the owner.
 *
 * A form that is never submitted leaves only a pending row and a pending
 * object, and both expire on their own.
 */

export type UploadRow = {
  id: string
  purpose: UploadPurpose
  bucket: 'submissions' | 'publications'
  storage_key: string
  original_name: string
  content_type: string
  size_bytes: number
  status: 'pending' | 'attached' | 'deleted'
  owner_type: string | null
  owner_id: number | null
  created_at: Date
}

export async function createPendingUpload(
  purpose: UploadPurpose,
  filename: string,
  contentType: string,
  size: number,
  bucket: 'submissions' | 'publications' = 'submissions',
) {
  if (!storageConfigured()) throw new StorageUnavailableError()
  const check = checkUpload(purpose, filename, contentType, size)
  if (!check.ok) throw new ValidationError([{ field: 'file', message: check.message }])

  const id = crypto.randomUUID()
  const name = safeFilename(filename)
  const key = `pending/${id}/${name}`
  // The signed type is the canonical one for the extension, whatever the
  // browser reported, so the PUT and the later download agree. The browser
  // sends back exactly the header returned below.
  const signedType = MIME[check.type]

  await insert(
    `INSERT INTO uploads (id, purpose, bucket, storage_key, original_name, content_type, size_bytes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, purpose, bucket, key, filename.slice(0, 255), signedType, size],
  )

  const url = await presignUpload(bucket, key, signedType)
  return { id, url, headers: { 'Content-Type': signedType } }
}

export type UploadRef = { id: string; purpose: UploadPurpose; field: string }

/**
 * Checks every referenced upload and returns the rows, or throws a
 * ValidationError naming the form field whose file is missing or wrong.
 */
export async function verifyUploads(refs: UploadRef[]): Promise<UploadRow[]> {
  if (refs.length === 0) return []
  const rows = await query<UploadRow>(
    `SELECT * FROM uploads WHERE id IN (${refs.map(() => '?').join(',')})`,
    refs.map((r) => r.id),
  )
  const byId = new Map(rows.map((r) => [r.id, r]))
  const errors: FieldError[] = []

  for (const ref of refs) {
    const row = byId.get(ref.id)
    const label = PURPOSES[ref.purpose].label
    if (!row || row.status !== 'pending' || row.purpose !== ref.purpose) {
      errors.push({ field: ref.field, message: `${label}: upload not found. Please choose the file again.` })
      continue
    }
    const info = await headObject(row.bucket, row.storage_key)
    if (!info) {
      errors.push({ field: ref.field, message: `${label}: the file did not finish uploading. Please choose it again.` })
      continue
    }
    if (info.size !== Number(row.size_bytes)) {
      errors.push({ field: ref.field, message: `${label}: the uploaded file is incomplete. Please choose it again.` })
      continue
    }
    const type = typeOf(row.original_name, row.content_type)
    if (!type || !signatureMatches(type, await readHead(row.bucket, row.storage_key))) {
      await deleteObject(row.bucket, row.storage_key).catch(() => undefined)
      await execute(`UPDATE uploads SET status = 'deleted' WHERE id = ?`, [row.id])
      errors.push({ field: ref.field, message: `${label}: the file is not a valid ${type?.toUpperCase() ?? 'document'}.` })
    }
  }

  if (errors.length) throw new ValidationError(errors)
  return refs.map((r) => byId.get(r.id)!)
}

/** Moves verified uploads under their owner. `prefix` is e.g. `applications/NGIQ-ED-00012`. */
export async function attachUploads(rows: UploadRow[], ownerType: string, ownerId: number, prefix: string) {
  for (const row of rows) {
    const name = row.storage_key.split('/').pop()!
    const finalKey = `${prefix}/${row.purpose}-${row.id.slice(0, 8)}-${name}`
    await copyObject(row.bucket, row.storage_key, finalKey)
    await execute(
      `UPDATE uploads SET status = 'attached', storage_key = ?, owner_type = ?, owner_id = ?, attached_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status = 'pending'`,
      [finalKey, ownerType, ownerId, row.id],
    )
    // The pending copy would expire anyway; deleting now keeps the bucket honest.
    await deleteObject(row.bucket, row.storage_key).catch(() => undefined)
  }
}

export const uploadsFor = (ownerType: string, ownerId: number) =>
  query<UploadRow>(`SELECT * FROM uploads WHERE owner_type = ? AND owner_id = ? AND status = 'attached' ORDER BY created_at`, [
    ownerType,
    ownerId,
  ])

export const getUpload = async (id: string) => (await query<UploadRow>(`SELECT * FROM uploads WHERE id = ?`, [id]))[0]
