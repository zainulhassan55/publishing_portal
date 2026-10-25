import { getObject } from '../storage'
import { getUpload } from '../uploads/service'

/**
 * Relays a published book file (volume or chapter PDF, or a cover) from the
 * publications bucket on the portal's own origin. Readers never see a storage
 * URL: Google Scholar expects `citation_pdf_url` on the site's own domain, and
 * the bucket stays private. Streamed, not buffered; nginx and the browser cache
 * it, because a published file's bytes do not change under the same upload id.
 */
export async function relayPublishedFile(uploadId: string | null, filename: string, download: boolean): Promise<Response> {
  const upload = uploadId ? await getUpload(uploadId) : undefined
  if (!upload || upload.status !== 'attached' || upload.bucket !== 'publications') {
    return new Response('Not found', { status: 404 })
  }

  const object = await getObject('publications', upload.storage_key)
  if (!object?.body) return new Response('Not found', { status: 404 })

  const headers: Record<string, string> = {
    'Content-Type': upload.content_type,
    'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${filename.replace(/"/g, '')}"`,
    'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    'X-Content-Type-Options': 'nosniff',
  }
  const length = object.headers.get('content-length')
  if (length) headers['Content-Length'] = length
  return new Response(object.body, { status: 200, headers })
}

/** `…/series/{slug}/volumes/{volume}/…` → { slug, volume } */
export function volumePath(request: Request) {
  const segments = new URL(request.url).pathname.split('/').filter(Boolean).map(decodeURIComponent)
  const i = segments.indexOf('volumes')
  return { slug: segments[i - 1] ?? '', volume: segments[i + 1] ?? '', rest: segments.slice(i + 2) }
}
