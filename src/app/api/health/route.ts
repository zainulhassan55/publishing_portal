import { NextResponse } from 'next/server'
import { pingDatabase } from '@/lib/db'
import { readHarvest } from '@/lib/ojs/harvest-cache'
import { ojsBaseUrl } from '@/lib/ojs/config'

export const dynamic = 'force-dynamic'

/**
 * Health endpoint for the deploy health gate and uptime monitoring.
 *
 * Returns 200 whenever the portal itself can serve pages. The database and OJS
 * are reported but do not fail the probe: public pages are statically generated
 * and render correctly without either, so a database outage must not cause a
 * deploy rollback or page an engineer about a site that is in fact up.
 *
 * Audit finding F-17 was that there was no uptime, error or cron monitoring at
 * all. Point UptimeRobot at this path and alert on `degraded` separately from
 * `down`.
 */
/**
 * Probes OJS liveness over OAI-PMH, always.
 *
 * The question this endpoint asks is "is OJS up", and OAI answers it with no
 * credentials while being served by the same PHP application and database as
 * everything else. Two earlier versions of this probe got it wrong in opposite
 * directions:
 *
 *   - probing `/api/v1/contexts` with no key, which returns 401 forever because
 *     OJS 3.5 requires a token for every API read, pinning a healthy system at
 *     `degraded` and making the monitor alert on day one and never stop;
 *   - probing it *with* the key, which fails just as permanently whenever the
 *     key's account lacks the site-admin scope that endpoint wants — a
 *     narrower grant is normal and is not an outage.
 *
 * Harvest coverage is a different question and belongs in `npm run spike`,
 * which checks every journal individually. An uptime monitor must not page
 * anyone because a journal role is missing.
 */
async function probeOjs(): Promise<{ ok: boolean; via: string; reason?: string }> {
  if (!ojsBaseUrl) return { ok: false, via: 'none', reason: 'not-configured' }

  try {
    const response = await fetch(`${ojsBaseUrl}/index.php/index/oai?verb=Identify`, {
      headers: { Accept: 'application/xml' },
      signal: AbortSignal.timeout(3000),
      cache: 'no-store',
    })
    return response.ok ? { ok: true, via: 'oai' } : { ok: false, via: 'oai', reason: `http-${response.status}` }
  } catch (error) {
    return { ok: false, via: 'oai', reason: error instanceof Error ? error.message : 'unreachable' }
  }
}

export async function GET() {
  const harvest = readHarvest()
  const [database, ojs] = await Promise.all([pingDatabase(), probeOjs()])

  const dependencies = { database, ojs }
  const degraded = !database.ok || !ojs.ok

  return NextResponse.json(
    {
      status: degraded ? 'degraded' : 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      harvest: {
        at: harvest.harvestedAt,
        articles: harvest.articles.length,
        issues: harvest.issues.length,
        // A harvest cron that silently stopped looks identical to a publisher
        // that has not published lately. Age is what distinguishes them.
        ageHours: harvest.harvestedAt
          ? Math.round((Date.now() - new Date(harvest.harvestedAt).getTime()) / 36_000) / 100
          : null,
      },
      dependencies,
    },
    { status: 200, headers: { 'Cache-Control': 'no-store' } },
  )
}
