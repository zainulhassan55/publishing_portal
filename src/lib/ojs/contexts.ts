/**
 * OJS context path of each title, where it differs from the portal slug.
 *
 * In October 2026 five titles were renamed and their OJS paths changed to the
 * new codes (ijic → TICR, …). The portal kept its own URLs — /journals/ijic —
 * so links already shared and indexed keep resolving, and next.config.ts
 * redirects the new codes to them (/journals/ticr → /journals/ijic).
 *
 * The values are the paths exactly as OJS stores them, capitals included (its
 * OAI ListSets reports TICR, JDMIE, …). OJS resolves a path in any case, but
 * writes its own links with the stored one, so using it here keeps the
 * portal's links identical to OJS's.
 *
 * The rule: anything that builds an OJS URL or calls the OJS API goes through
 * `ojsContext`; anything that reads a context back out of OJS — an OAI
 * setSpec, a /go resolver path — goes through `portalSlug`. A title missing
 * from this map has the same path in both.
 */
export const ojsContextBySlug: Readonly<Record<string, string>> = {
  ijic: 'TICR',
  ijdm: 'JDMIE',
  jqcs: 'TQCIS',
  jaise: 'JAAISE',
  sst: 'DTCR',
  reta: 'RETA',
}

const slugByContext = new Map(Object.entries(ojsContextBySlug).map(([slug, context]) => [context.toLowerCase(), slug]))

/** The OJS path for a portal slug: `ijic` → `TICR`. */
export const ojsContext = (slug: string) => ojsContextBySlug[slug.toLowerCase()] ?? slug.toLowerCase()

/** The portal slug for an OJS path, in any case: `TICR` or `ticr` → `ijic`. A pre-rename path (`ijic`) maps to itself. */
export const portalSlug = (context: string) => slugByContext.get(context.toLowerCase()) ?? context.toLowerCase()
