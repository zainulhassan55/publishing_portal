import { handler } from '@/lib/api'
import { currentIssue, getIssues } from '@/data/content'
import { ojsUrl } from '@/lib/ojs/config'

export const dynamic = 'force-dynamic'

/**
 * Resolves an OJS issue link (`/issue/view/<id>`) to the portal.
 *
 * The portal has a current-issue page and an archive per journal, not a page
 * per issue, so the current issue goes to the former and anything else to the
 * latter. An issue the harvest has not seen goes back to OJS with `?portal=0`
 * (see the article resolver for why).
 */
export const GET = handler(async (request) => {
  const segments = new URL(request.url).pathname.split('/').filter(Boolean)
  const journal = segments[segments.length - 2] ?? ''
  const id = Number(segments[segments.length - 1])

  const issue = getIssues().find((i) => i.journalSlug === journal && i.ojsId === id)
  // "Current" by the same rule the journal pages use — OJS's own flag when it
  // is set, else the latest issue — so this lands where the reader expects.
  const isCurrent = issue !== undefined && currentIssue(journal)?.ojsId === issue.ojsId
  const to = issue
    ? `/journals/${journal}/${isCurrent ? 'current-issue' : 'issues'}`
    : `${ojsUrl(journal, `/issue/view/${segments[segments.length - 1]}`)}?portal=0`

  return new Response(null, { status: 302, headers: { Location: to, 'Cache-Control': 'no-store' } })
})
