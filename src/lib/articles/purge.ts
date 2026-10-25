import { revalidatePath } from 'next/cache'
import { resetHarvestCache } from '../ojs/harvest-cache.ts'
import { resetBooksCache } from '../books/volumes.ts'
import { resetDisplayCache } from './display.ts'

/**
 * Makes the public site re-read its content on the next request.
 *
 * Three caches sit between a change and a reader: the parsed harvest snapshot,
 * the hidden-article set, and Next's page cache (ISR). Dropping the first two
 * without the third would leave stale HTML being served; dropping the third
 * without the first two would re-render the stale data. So they go together,
 * and this is the only function that drops them.
 *
 * `revalidatePath('/', 'layout')` invalidates every cached page and route in
 * one call. That is deliberately coarse: a hidden paper affects its own page,
 * its journal's four pages, the home page, the search index and the sitemap,
 * and enumerating those is a list that rots the first time a page is added.
 * The cost is that every page renders once more on its next visit, which at
 * this site's size is not a cost worth a smarter list.
 *
 * Callers: the admin show/hide toggle, the book volume screen, the scheduled harvest (through
 * /api/revalidate) and the deploy script after a release goes live.
 */
export function purgePublicContent(): void {
  resetHarvestCache()
  resetDisplayCache()
  resetBooksCache()
  revalidatePath('/', 'layout')
}
