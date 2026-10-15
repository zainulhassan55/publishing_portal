import { handler } from '@/lib/api'
import { getArticle } from '@/data/content'

export const dynamic = 'force-dynamic'

/**
 * The article's PDF, served from this origin so the article page can display
 * it inline.
 *
 * OJS sends the galley with `Content-Disposition: attachment`, which makes a
 * browser save the file rather than show it, and an iframe of it downloads
 * instead of rendering. This route fetches the same file from OJS and relays it
 * with an `inline` disposition (`?download=1` for the save button). Streamed,
 * not buffered, so a large PDF costs memory proportional to nothing.
 *
 * It is not an open proxy: the only URL it will fetch is the `pdfHref` the
 * harvest recorded for the slug, and the lookup goes through the gated reader,
 * so a paper hidden in the admin panel is a 404 here as everywhere else.
 * `next.config.ts` relaxes `frame-ancestors` to `'self'` for exactly this path.
 */
export const GET = handler(async (request) => {
  const url = new URL(request.url)
  const segments = url.pathname.split('/').filter(Boolean)
  // …/articles/{slug}/pdf
  const slug = decodeURIComponent(segments[segments.length - 2] ?? '')

  const article = await getArticle(slug)
  if (!article?.pdfHref) return new Response('Not found', { status: 404 })

  const upstream = await fetch(article.pdfHref, { cache: 'no-store', headers: { Accept: 'application/pdf' } })
  if (!upstream.ok || !upstream.body) {
    console.error(`[pdf] ${article.pdfHref} → HTTP ${upstream.status}`)
    return new Response('The PDF is not available right now. Try again in a few minutes.', { status: 502 })
  }

  const type = upstream.headers.get('content-type') ?? ''
  if (!/application\/pdf/i.test(type)) {
    // OJS answered with a page — a sign-in form, an error — rather than the
    // file. Relaying that as a PDF would show the reader a broken viewer.
    console.error(`[pdf] ${article.pdfHref} answered ${type || 'no content type'}, not a PDF`)
    return new Response('The PDF is not available right now. Try again in a few minutes.', { status: 502 })
  }

  const download = url.searchParams.get('download') === '1'
  const headers: Record<string, string> = {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${slug}.pdf"`,
    // Public content; an hour of caching at the proxy keeps repeat views off
    // OJS, and the next harvest cannot change a published galley's bytes.
    'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    'X-Content-Type-Options': 'nosniff',
  }
  const length = upstream.headers.get('content-length')
  if (length) headers['Content-Length'] = length

  return new Response(upstream.body, { status: 200, headers })
})
