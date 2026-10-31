/**
 * OJS context path of each title, where it differs from the portal slug.
 *
 * In October 2026 five titles were renamed and their OJS paths changed to the
 * new codes (ijic → ticr, …). The portal kept its own URLs — /journals/ijic —
 * so links already shared and indexed keep resolving, and next.config.ts
 * redirects the new codes to them (/journals/ticr → /journals/ijic).
 *
 * The rule: anything that builds an OJS URL or calls the OJS API goes through
 * `ojsContext`; anything that reads a context back out of OJS — an OAI
 * setSpec, a /go resolver path — goes through `portalSlug`. A title missing
 * from this map has the same path in both.
 */
export const ojsContextBySlug: Readonly<Record<string, string>> = {
  ijic: 'ticr',
  ijdm: 'jdmie',
  jqcs: 'tqcis',
  jaise: 'jaaise',
  sst: 'dtcr',
}

const slugByContext = new Map(Object.entries(ojsContextBySlug).map(([slug, context]) => [context, slug]))

/** The OJS path for a portal slug: `ijic` → `ticr`. */
export const ojsContext = (slug: string) => ojsContextBySlug[slug.toLowerCase()] ?? slug.toLowerCase()

/** The portal slug for an OJS path: `ticr` → `ijic`. A pre-rename path (`ijic`) maps to itself. */
export const portalSlug = (context: string) => slugByContext.get(context.toLowerCase()) ?? context.toLowerCase()
