import { handler } from '@/lib/api'
import { relayPublishedFile, volumePath } from '@/lib/books/files'
import { publishedVolume } from '@/lib/books/volumes'

export const dynamic = 'force-dynamic'

/** One chapter's PDF on this origin: …/volumes/{volume}/chapters/{seq}/pdf. */
export const GET = handler(async (request) => {
  const { slug, volume, rest } = volumePath(request)
  const v = await publishedVolume(slug, volume)
  const chapter = v?.chapters.find((c) => String(c.seq) === rest[1])
  if (!v || !chapter) return new Response('Not found', { status: 404 })
  return relayPublishedFile(chapter.pdfUploadId, `${slug}-${v.slug}-ch${chapter.seq}.pdf`, new URL(request.url).searchParams.get('download') === '1')
})
