/**
 * Pure search logic: matching, ranking, faceting and sorting.
 *
 * Split from the index builder because the builder reads the OJS harvest
 * snapshot from disk, which pulls in node:fs. Keeping these functions in a
 * module with no imports is what lets the search UI run them in the browser,
 * so a facet click filters instantly instead of making a server round trip.
 */

export type SearchTab = 'articles' | 'journals' | 'guidance'

export type ArticleHit = {
  kind: 'article'
  id: string
  slug: string
  title: string
  authors: string[]
  journalSlug: string
  journalTitle: string
  journalCode: string
  type: string
  year: number
  publishedIso: string
  doi: string
  access: string
  citations: number
  downloads: number
  abstract: string
  keywords: string[]
  /** Lowercased concatenation of everything matchable. */
  haystack: string
}

export type JournalHit = {
  kind: 'journal'
  slug: string
  title: string
  code: string
  subject: string
  subjectColor: string
  scope: string
  haystack: string
}

export type GuidanceHit = {
  kind: 'guidance'
  journalSlug: string
  journalCode: string
  pageId: string
  title: string
  group: string
  href: string
  /** First matching paragraph, used for the result snippet. */
  text: string
  haystack: string
}

export type SearchIndex = {
  articles: ArticleHit[]
  journals: JournalHit[]
  guidance: GuidanceHit[]
}


export const normalise = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
/* -------------------------------------------------------------------------- */
/* Matching                                                                   */
/* -------------------------------------------------------------------------- */

export const queryTerms = (query: string) =>
  normalise(query)
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1)

/** All terms must appear somewhere in the record (AND), substring-matched. */
export const matchesQuery = (haystack: string, terms: string[]) => terms.every((term) => haystack.includes(term))

/**
 * Relevance: a title hit outranks an abstract hit, and an exact phrase outranks
 * scattered terms. Deliberately simple — with a few hundred records the ranking
 * only needs to be defensible, not tuned.
 */
export function relevanceScore(hit: { title: string; haystack: string }, query: string, terms: string[]): number {
  const title = normalise(hit.title)
  const phrase = normalise(query.trim())
  let score = 0
  if (phrase && title.includes(phrase)) score += 100
  if (phrase && hit.haystack.includes(phrase)) score += 25
  for (const term of terms) {
    if (title.startsWith(term)) score += 20
    else if (title.includes(term)) score += 12
    if (hit.haystack.includes(term)) score += 3
  }
  return score
}

/** Extracts a snippet around the first matching term, for guidance results. */
export function snippet(text: string, terms: string[], length = 180): string {
  if (!text) return ''
  const lower = normalise(text)
  const at = terms.map((t) => lower.indexOf(t)).filter((i) => i >= 0).sort((a, b) => a - b)[0] ?? 0
  const start = Math.max(0, at - 60)
  const slice = text.slice(start, start + length).trim()
  return `${start > 0 ? '…' : ''}${slice}${start + length < text.length ? '…' : ''}`
}

/* -------------------------------------------------------------------------- */
/* Facets                                                                     */
/* -------------------------------------------------------------------------- */

export type FacetGroupId = 'journal' | 'type' | 'year' | 'access'

export type FacetOption = { value: string; label: string; count: number }

export type FacetGroup = { id: FacetGroupId; label: string; options: FacetOption[] }

const facetValue = (hit: ArticleHit, group: FacetGroupId): string =>
  group === 'journal' ? hit.journalSlug : group === 'type' ? hit.type : group === 'year' ? String(hit.year) : hit.access

const facetLabel = (hit: ArticleHit, group: FacetGroupId): string =>
  group === 'journal' ? hit.journalCode : facetValue(hit, group)

export type Selections = Partial<Record<FacetGroupId, string[]>>

const passesFacets = (hit: ArticleHit, selections: Selections, except?: FacetGroupId) => {
  for (const group of ['journal', 'type', 'year', 'access'] as FacetGroupId[]) {
    if (group === except) continue
    const selected = selections[group]
    if (selected?.length && !selected.includes(facetValue(hit, group))) return false
  }
  return true
}

/**
 * Facet counts are computed against the results that pass every *other* facet
 * group, so a count never reads as zero for an option the user can still pick —
 * the behaviour the mockup's live counts imply.
 */
export function buildFacets(hits: ArticleHit[], selections: Selections): FacetGroup[] {
  const groups: { id: FacetGroupId; label: string }[] = [
    { id: 'journal', label: 'Journal' },
    { id: 'type', label: 'Article type' },
    { id: 'year', label: 'Year' },
    { id: 'access', label: 'Access' },
  ]

  return groups.map(({ id, label }) => {
    const counts = new Map<string, { label: string; count: number }>()
    for (const hit of hits) {
      if (!passesFacets(hit, selections, id)) continue
      const value = facetValue(hit, id)
      const existing = counts.get(value)
      if (existing) existing.count += 1
      else counts.set(value, { label: facetLabel(hit, id), count: 1 })
    }

    const options = [...counts.entries()]
      .map(([value, { label: optionLabel, count }]) => ({ value, label: optionLabel, count }))
      .sort((a, b) => (id === 'year' ? b.value.localeCompare(a.value) : a.label.localeCompare(b.label)))

    return { id, label, options }
  })
}

export const applyFacets = (hits: ArticleHit[], selections: Selections) =>
  hits.filter((hit) => passesFacets(hit, selections))

export type SortId = 'relevance' | 'newest' | 'cited' | 'read'

export const sortOptions: { id: SortId; label: string }[] = [
  { id: 'relevance', label: 'Relevance' },
  { id: 'newest', label: 'Newest first' },
  { id: 'cited', label: 'Most cited' },
  { id: 'read', label: 'Most read' },
]

export function sortHits(hits: ArticleHit[], sort: SortId, query: string): ArticleHit[] {
  const terms = queryTerms(query)
  const sorted = [...hits]
  switch (sort) {
    case 'newest':
      return sorted.sort((a, b) => b.publishedIso.localeCompare(a.publishedIso))
    case 'cited':
      return sorted.sort((a, b) => b.citations - a.citations || b.publishedIso.localeCompare(a.publishedIso))
    case 'read':
      return sorted.sort((a, b) => b.downloads - a.downloads || b.publishedIso.localeCompare(a.publishedIso))
    default:
      return sorted.sort(
        (a, b) =>
          relevanceScore(b, query, terms) - relevanceScore(a, query, terms) ||
          b.publishedIso.localeCompare(a.publishedIso),
      )
  }
}

