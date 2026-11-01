/**
 * OJS context path of each title, and the codes titles used to have.
 *
 * In October 2026 five titles were renamed and their OJS paths changed to the
 * new codes (TICR, JDMIE, …). On 2026-11-01 the portal's own URLs followed —
 * /journals/ijic became /journals/ticr — so a portal slug is now the OJS path
 * in lowercase. next.config.ts redirects the old URLs permanently.
 *
 * The map values are the paths exactly as OJS stores them, capitals included
 * (its OAI ListSets reports TICR, JDMIE, …). OJS resolves a path in any case,
 * but writes its own links with the stored one, so using it here keeps the
 * portal's links identical to OJS's.
 *
 * The rule: anything that builds an OJS URL or calls the OJS API goes through
 * `ojsContext`; anything that reads a context back out of OJS — an OAI
 * setSpec, a /go resolver path — goes through `portalSlug`.
 *
 * This file is shipped to the server on its own (scripts/deploy.sh), because
 * scripts/harvest.ts imports it. Keep it free of imports.
 */
export const ojsContextBySlug: Readonly<Record<string, string>> = {
  ticr: 'TICR',
  jdmie: 'JDMIE',
  tqcis: 'TQCIS',
  jaaise: 'JAAISE',
  dtcr: 'DTCR',
  reta: 'RETA',
}

/**
 * Codes the renamed titles had before, mapped to today's slug. Old links,
 * bookmarked /go URLs and database rows written before the rename can still
 * carry them.
 */
export const legacySlugs: Readonly<Record<string, string>> = {
  ijic: 'ticr',
  ijdm: 'jdmie',
  jqcs: 'tqcis',
  jaise: 'jaaise',
  sst: 'dtcr',
}

/** Today's slug for any slug, old or new, in any case: `IJIC` or `ticr` → `ticr`. */
export const currentSlug = (slug: string) => {
  const lower = slug.toLowerCase()
  return legacySlugs[lower] ?? lower
}

/** The OJS path for a portal slug: `ticr` → `TICR`. An old slug (`ijic`) maps too. */
export const ojsContext = (slug: string) => {
  const current = currentSlug(slug)
  return ojsContextBySlug[current] ?? current
}

/** The portal slug for an OJS path, in any case, old or new: `TICR`, `ticr` or `ijic` → `ticr`. */
export const portalSlug = (context: string) => currentSlug(context)
