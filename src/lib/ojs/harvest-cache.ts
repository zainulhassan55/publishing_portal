import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Article, Issue } from '@/types/publishing'

export type HarvestSnapshot = {
  /** ISO timestamp of the harvest run that produced this file. */
  harvestedAt: string | null
  articles: Article[]
  issues: Issue[]
}

const EMPTY: HarvestSnapshot = { harvestedAt: null, articles: [], issues: [] }

export const harvestPath = join(process.cwd(), 'content', 'harvest.json')

let cached: HarvestSnapshot | null = null

/**
 * Reads the OJS harvest snapshot written by `npm run harvest`.
 *
 * The snapshot is a plain JSON file on disk rather than a database table: it is
 * fully derivable from OJS, it is read at build time by every static page, and
 * keeping it as a file means a page render never depends on the database being
 * up. A missing file is the normal state before the first harvest and must not
 * throw — pages render their launch-state empty copy instead.
 */
export function readHarvest(): HarvestSnapshot {
  if (cached) return cached

  try {
    const raw = readFileSync(harvestPath, 'utf8')
    const parsed = JSON.parse(raw) as Partial<HarvestSnapshot>
    cached = {
      harvestedAt: parsed.harvestedAt ?? null,
      articles: Array.isArray(parsed.articles) ? parsed.articles : [],
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
    }
  } catch {
    cached = EMPTY
  }

  return cached
}

/** Test seam; also used by the harvest script after it writes a new snapshot. */
export const resetHarvestCache = () => {
  cached = null
}
