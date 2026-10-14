import { createHash, timingSafeEqual } from 'node:crypto'
import { handler, jsonError, jsonOk } from '@/lib/api'
import { purgePublicContent } from '@/lib/articles/purge'
import { readHarvest } from '@/lib/ojs/harvest-cache'

export const dynamic = 'force-dynamic'

/**
 * Tells the running site that its content changed underneath it.
 *
 * Called by the scheduled harvest after it writes a new snapshot, and by the
 * deploy script once a release is live. Without it a paper published in OJS
 * waits for the ISR timer (an hour) rather than the harvest interval, and a
 * fresh release serves build-time HTML until the same timer expires.
 *
 * Authentication is a shared secret rather than the admin session, because
 * the callers are cron and a shell script, not a browser. Compared by digest
 * so the comparison is constant-time whatever the lengths.
 */

const digest = (value: string) => createHash('sha256').update(value).digest()

const secretMatches = (expected: string, presented: string) => timingSafeEqual(digest(expected), digest(presented))

export const POST = handler(async (request) => {
  const secret = process.env.PORTAL_REVALIDATE_SECRET
  if (!secret) {
    return jsonError('unavailable', 503, { message: 'PORTAL_REVALIDATE_SECRET is not set on this server.' })
  }

  const presented = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
  if (!presented || !secretMatches(secret, presented)) {
    console.warn('[revalidate] refused: bad or missing secret')
    return jsonError('forbidden', 403)
  }

  purgePublicContent()

  const harvest = readHarvest()
  return jsonOk({ harvestedAt: harvest.harvestedAt, articles: harvest.articles.length, issues: harvest.issues.length })
})
