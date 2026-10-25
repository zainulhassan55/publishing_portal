import { handler } from '@/lib/api'
import { relayPublishedFile, volumePath } from '@/lib/books/files'
import { publishedVolume } from '@/lib/books/volumes'

export const dynamic = 'force-dynamic'

/** The volume's cover image on this origin. */
export const GET = handler(async (request) => {
  const { slug, volume } = volumePath(request)
  const v = await publishedVolume(slug, volume)
  if (!v) return new Response('Not found', { status: 404 })
  return relayPublishedFile(v.coverUploadId, `${slug}-${v.slug}-cover`, false)
})
