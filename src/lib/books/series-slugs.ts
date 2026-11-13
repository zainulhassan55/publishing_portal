/**
 * The book series' URL slugs followed their codes in November 2026:
 * /series/aiisc became /series/sisdt and /series/lnmr became /series/lnmri.
 * Old URLs redirect permanently (next.config.ts), but database rows written
 * before the rename (book_volumes.series_slug, book_submissions.series_slug,
 * editorial_applications.target_slug) still carry the old slug. Reads map them
 * here instead of a data migration, so the release running during a deploy,
 * and any rollback, keep finding the same rows.
 *
 * No imports: keep this module safe to use from anywhere, server scripts included.
 */
export const legacySeriesSlugs: Readonly<Record<string, string>> = {
  aiisc: 'sisdt',
  lnmr: 'lnmri',
}

/** Today's slug for a series slug, old or new, in any case: `AIISC` or `sisdt` → `sisdt`. */
export const currentSeriesSlug = (slug: string) => {
  const lower = slug.toLowerCase()
  return legacySeriesSlugs[lower] ?? lower
}

/** Every slug a series' rows may be stored under: today's first, then its old ones. */
export const seriesSlugAliases = (slug: string): string[] => {
  const now = currentSeriesSlug(slug)
  return [now, ...Object.keys(legacySeriesSlugs).filter((old) => legacySeriesSlugs[old] === now)]
}
