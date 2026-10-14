import { readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { Article, Issue } from '@/types/publishing'

export type HarvestSnapshot = {
  /** ISO timestamp of the harvest run that produced this file. */
  harvestedAt: string | null
  articles: Article[]
  issues: Issue[]
}

const EMPTY: HarvestSnapshot = { harvestedAt: null, articles: [], issues: [] }

/**
 * Where the snapshot lives.
 *
 * `content/harvest.json` under the working directory by default, which is what
 * the build reads and what a release ships with. On the server, `HARVEST_PATH`
 * points it at a file *outside* the release directory, so the scheduled
 * harvest writes to one place and every release reads it — otherwise each
 * deploy would reset the site to whatever the developer's machine harvested at
 * build time, and the cron would have to catch up.
 */
export function harvestPath(): string {
  const configured = process.env.HARVEST_PATH
  if (configured) return resolve(/*turbopackIgnore: true*/ configured)
  return join(process.cwd(), 'content', 'harvest.json')
}

// The reads below carry `turbopackIgnore`: the path is decided at runtime by
// HARVEST_PATH, and without the marker the bundler traces "any file" into the
// standalone output, which ships the whole repository with every release.
type Cached = { path: string; mtimeMs: number; size: number; snapshot: HarvestSnapshot }

let cached: Cached | null = null

/**
 * The last snapshot that parsed, kept separately from the mtime-keyed cache so
 * a reset (which must force a re-read) does not also throw away the fallback
 * for a file that then fails to parse.
 */
let lastGood: { path: string; snapshot: HarvestSnapshot } | null = null

/**
 * Reads the OJS harvest snapshot written by `npm run harvest`.
 *
 * The snapshot is a plain JSON file on disk rather than a database table: it is
 * fully derivable from OJS, it is read at build time by every static page, and
 * keeping it as a file means a page render never depends on the database being
 * up. A missing file is the normal state before the first harvest and must not
 * throw — pages render their launch-state empty copy instead.
 *
 * The parse is cached against the file's mtime and size, so the scheduled
 * harvest on the server is picked up by the next render without a restart,
 * while a page that calls this several times in one render pays for one
 * `stat` each rather than one parse each. This used to be a read-once cache,
 * which meant a paper published in OJS reached the site only at the next
 * deploy (docs/ADMIN-PANEL-PLAN.md, P3a).
 *
 * A snapshot that fails to parse keeps the previous good one. The harvest
 * writes atomically, so this should never happen — but a truncated file
 * turning the whole site empty for the length of a cron interval is the
 * failure mode worth a line of code to rule out.
 */
export function readHarvest(): HarvestSnapshot {
  const path = harvestPath()

  let mtimeMs: number
  let size: number
  try {
    const stat = statSync(/*turbopackIgnore: true*/ path)
    mtimeMs = stat.mtimeMs
    size = stat.size
  } catch {
    cached = null
    return EMPTY
  }

  if (cached && cached.path === path && cached.mtimeMs === mtimeMs && cached.size === size) {
    return cached.snapshot
  }

  try {
    const parsed = JSON.parse(readFileSync(/*turbopackIgnore: true*/ path, 'utf8')) as Partial<HarvestSnapshot>
    const snapshot: HarvestSnapshot = {
      harvestedAt: parsed.harvestedAt ?? null,
      articles: Array.isArray(parsed.articles) ? parsed.articles : [],
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
    }
    cached = { path, mtimeMs, size, snapshot }
    lastGood = { path, snapshot }
    return snapshot
  } catch (error) {
    console.error(`[harvest] ${path} could not be parsed; keeping the previous snapshot:`, error)
    return lastGood?.path === path ? lastGood.snapshot : EMPTY
  }
}

/**
 * Forces the next read to re-stat and re-parse. The mtime check makes this
 * unnecessary for a new snapshot, so it exists for the purge route (belt and
 * braces) and for tests. It keeps the last good snapshot as the fallback.
 */
export const resetHarvestCache = () => {
  cached = null
}

/** Test seam: forgets everything, including the fallback. */
export const forgetHarvest = () => {
  cached = null
  lastGood = null
}
