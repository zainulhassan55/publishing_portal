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
export async function GET() {
  const harvest = readHarvest()
  const database = await pingDatabase()

  let ojs: { ok: boolean; reason?: string } = { ok: false, reason: 'not-configured' }
  if (ojsBaseUrl) {
    try {
      const response = await fetch(`${ojsBaseUrl}/index.php/index/api/v1/contexts?count=1`, {
        signal: AbortSignal.timeout(3000),
        cache: 'no-store',
      })
      ojs = response.ok ? { ok: true } : { ok: false, reason: `http-${response.status}` }
    } catch (error) {
      ojs = { ok: false, reason: error instanceof Error ? error.message : 'unreachable' }
    }
  }

  const dependencies = { database, ojs }
  const degraded = !database.ok || !ojs.ok

  return NextResponse.json(
    {
      status: degraded ? 'degraded' : 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      harvest: { at: harvest.harvestedAt, articles: harvest.articles.length, issues: harvest.issues.length },
      dependencies,
    },
    { status: 200, headers: { 'Cache-Control': 'no-store' } },
  )
}
