import { AwsClient } from 'aws4fetch'

/**
 * Object storage for files submitted through the portal's forms (CVs,
 * proposals, book manuscripts) and, later, published book PDFs.
 *
 * Speaks the S3 API, so the same code runs against Cloudflare R2 (the chosen
 * provider), AWS S3, Backblaze B2 or Supabase Storage: switching is a change of
 * the S3_* variables, not of this file. Requests are signed with aws4fetch
 * rather than the AWS SDK, which is several megabytes for the five calls made
 * here.
 *
 * Journal articles never come through here: their PDFs are OJS galleys.
 *
 * Both buckets are private. A browser uploads with a presigned PUT and an
 * administrator downloads with a presigned GET, each valid for minutes; the
 * secret key never leaves the server.
 */

export type BucketName = 'submissions' | 'publications'

type Config = {
  endpoint: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  buckets: Record<BucketName, string>
}

function readConfig(): Config | null {
  const endpoint = process.env.S3_ENDPOINT?.replace(/\/$/, '')
  const accessKeyId = process.env.S3_ACCESS_KEY_ID
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY
  const submissions = process.env.S3_BUCKET_SUBMISSIONS
  const publications = process.env.S3_BUCKET_PUBLICATIONS
  if (!endpoint || !accessKeyId || !secretAccessKey || !submissions || !publications) return null
  return {
    endpoint,
    region: process.env.S3_REGION || 'auto',
    accessKeyId,
    secretAccessKey,
    buckets: { submissions, publications },
  }
}

export const storageConfigured = () => readConfig() !== null

/** Thrown when a form needs storage and the S3_* variables are not set; the API wrapper turns it into a 503. */
export class StorageUnavailableError extends Error {
  constructor() {
    super('storage-unavailable')
  }
}

let client: { aws: AwsClient; config: Config } | null = null

function getClient() {
  if (client) return client
  const config = readConfig()
  if (!config) throw new StorageUnavailableError()
  client = {
    config,
    aws: new AwsClient({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      service: 's3',
      region: config.region,
    }),
  }
  return client
}

/** Path-style URL: R2 and most S3-compatible services accept it, and it keeps one hostname for CORS. */
function objectUrl(bucket: BucketName, key: string) {
  const { config } = getClient()
  const path = key.split('/').map(encodeURIComponent).join('/')
  return `${config.endpoint}/${config.buckets[bucket]}/${path}`
}

async function presign(method: 'GET' | 'PUT', url: string, expiresSeconds: number, headers: Record<string, string> = {}) {
  const u = new URL(url)
  u.searchParams.set('X-Amz-Expires', String(expiresSeconds))
  const signed = await getClient().aws.sign(u.toString(), { method, headers, aws: { signQuery: true } })
  return signed.url
}

/**
 * A URL the browser can PUT one file to, for one key, for `expiresSeconds`.
 * Query-signed URLs cover the host only, so the declared Content-Type is not
 * enforced here; the size and file-signature checks in verifyUploads are what
 * decide whether an upload is accepted.
 */
export const presignUpload = (bucket: BucketName, key: string, contentType: string, expiresSeconds = 900) =>
  presign('PUT', objectUrl(bucket, key), expiresSeconds, { 'content-type': contentType })

/** A short-lived download link that saves under `filename`. */
export function presignDownload(bucket: BucketName, key: string, filename: string, expiresSeconds = 300) {
  const url = new URL(objectUrl(bucket, key))
  url.searchParams.set('response-content-disposition', `attachment; filename="${filename.replace(/"/g, '')}"`)
  return presign('GET', url.toString(), expiresSeconds)
}

export type ObjectInfo = { size: number; contentType: string | null }

export async function headObject(bucket: BucketName, key: string): Promise<ObjectInfo | null> {
  const res = await getClient().aws.fetch(objectUrl(bucket, key), { method: 'HEAD' })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`storage HEAD ${res.status}`)
  return { size: Number(res.headers.get('content-length') ?? 0), contentType: res.headers.get('content-type') }
}

/** The first `length` bytes of an object, for the file-signature check. */
export async function readHead(bucket: BucketName, key: string, length = 16): Promise<Uint8Array> {
  const res = await getClient().aws.fetch(objectUrl(bucket, key), { headers: { range: `bytes=0-${length - 1}` } })
  if (!res.ok) throw new Error(`storage GET ${res.status}`)
  return new Uint8Array(await res.arrayBuffer())
}

/** Server-side copy within one bucket. Used to move an attached upload out of `pending/`, which a lifecycle rule empties daily. */
export async function copyObject(bucket: BucketName, fromKey: string, toKey: string) {
  const { config } = getClient()
  const source = `/${config.buckets[bucket]}/${fromKey.split('/').map(encodeURIComponent).join('/')}`
  const res = await getClient().aws.fetch(objectUrl(bucket, toKey), {
    method: 'PUT',
    headers: { 'x-amz-copy-source': source },
  })
  if (!res.ok) throw new Error(`storage COPY ${res.status}`)
}

export async function deleteObject(bucket: BucketName, key: string) {
  const res = await getClient().aws.fetch(objectUrl(bucket, key), { method: 'DELETE' })
  if (!res.ok && res.status !== 404) throw new Error(`storage DELETE ${res.status}`)
}

export async function putObject(bucket: BucketName, key: string, body: string, contentType: string) {
  const res = await getClient().aws.fetch(objectUrl(bucket, key), {
    method: 'PUT',
    headers: { 'content-type': contentType },
    body,
  })
  if (!res.ok) throw new Error(`storage PUT ${res.status}: ${await res.text()}`)
}

/** The object as a streaming response, or null when it does not exist. */
export async function getObject(bucket: BucketName, key: string): Promise<Response | null> {
  const res = await getClient().aws.fetch(objectUrl(bucket, key))
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`storage GET ${res.status}`)
  return res
}
