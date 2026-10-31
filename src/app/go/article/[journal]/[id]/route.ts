import { handler } from '@/lib/api'
import { getArticleById } from '@/data/content'
import { ojsUrl } from '@/lib/ojs/config'
import { ojsContext, portalSlug } from '@/lib/ojs/contexts'

export const dynamic = 'force-dynamic'

/**
 * Resolves an OJS article link to the portal's article page.
 *
 * OJS writes `/ojs/index.php/<journal>/article/view/<submissionId>` into its
 * "just published" emails, its OAI records and every indexer that reads them.
 * nginx sends those here (deploy/cloudpanel-vhost.conf) because it cannot map
 * a submission id to a slug; the harvest can, as `ojs-<id>`.
 *
 * A paper the harvest does not know — published a minute ago, or held back in
 * the admin panel — goes back to OJS with `?portal=0`, which nginx lets
 * through. That keeps a fresh paper readable during the harvest interval
 * instead of 404ing the reader who was just emailed about it.
 *
 * 302 rather than 301: a slug follows the title and a paper can be hidden
 * later, and a browser caches a 301 for good.
 *
 * `journal` is whatever OJS path the link carried, which for a renamed title
 * may be the old one (ijic) that OJS no longer answers on; the fallback is
 * rebuilt from the current path (TICR).
 */
export const GET = handler(async (request) => {
  const segments = new URL(request.url).pathname.split('/').filter(Boolean)
  // …/go/article/{journal}/{id}
  const journal = segments[segments.length - 2] ?? ''
  const id = segments[segments.length - 1] ?? ''

  const article = /^\d+$/.test(id) ? await getArticleById(`ojs-${id}`) : undefined
  const to = article ? `/articles/${article.slug}` : `${ojsUrl(ojsContext(portalSlug(journal)), `/article/view/${id}`)}?portal=0`

  return new Response(null, { status: 302, headers: { Location: to, 'Cache-Control': 'no-store' } })
})
