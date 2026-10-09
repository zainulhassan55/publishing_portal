import { clientIp, handler, jsonError, jsonOk, rateLimit } from '@/lib/api'

export const dynamic = 'force-dynamic'

/**
 * Thin proxy for the ROR public registry.
 *
 * The browser cannot call api.ror.org directly: the CSP in next.config.ts pins
 * `connect-src` to 'self', and relaxing it to allow one third-party host would
 * widen the policy for every page on the site. So the lookup goes server-side,
 * where it also gets a timeout and a rate limit.
 *
 * Affiliation matching is an aid, never a gate — an author at an institution ROR
 * has not registered must still be able to submit. Every failure therefore
 * degrades to an empty list rather than an error, and the affiliation the author
 * typed is what gets saved.
 */

const ROR_ENDPOINT = 'https://api.ror.org/organizations'
const TIMEOUT_MS = 5_000
const MAX_RESULTS = 6

/**
 * The /organizations endpoint currently answers with the v2 record schema
 * (`names`, `locations`) where it used to answer with v1 (`name`, `country`).
 * Both are read, because a schema flip on ROR's side must not silently turn
 * every lookup into "no match".
 */
type RorOrganization = {
  id?: string
  status?: string
  name?: string
  names?: { value?: string; types?: string[] }[]
  country?: { country_name?: string }
  locations?: { geonames_details?: { country_name?: string } }[]
}

const displayName = (organization: RorOrganization): string => {
  if (organization.name) return organization.name
  const names = organization.names ?? []
  const preferred =
    names.find((entry) => entry.types?.includes('ror_display')) ?? names.find((entry) => entry.types?.includes('label'))
  return (preferred ?? names[0])?.value ?? ''
}

const country = (organization: RorOrganization): string =>
  organization.country?.country_name ?? organization.locations?.[0]?.geonames_details?.country_name ?? ''

export const GET = handler(async (request) => {
  const limit = rateLimit(`ror:${clientIp(request)}`, 60, 60_000)
  if (!limit.ok) return jsonError('rate-limited', 429, { retryAfter: limit.retryAfter })

  const query = (new URL(request.url).searchParams.get('q') ?? '').trim()

  // Two characters match thousands of organisations; the list is noise below three.
  if (query.length < 3) return jsonOk({ items: [] })

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(`${ROR_ENDPOINT}?query=${encodeURIComponent(query)}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
      cache: 'no-store',
    })

    if (!response.ok) return jsonOk({ items: [] })

    const data = (await response.json()) as { items?: RorOrganization[] }

    const items = (data.items ?? [])
      // A withdrawn record must not be offered: its identifier would be stored
      // against the article and resolve to nothing.
      .filter((organization) => organization.id && (organization.status ?? 'active') === 'active')
      .map((organization) => ({
        id: organization.id as string,
        name: displayName(organization),
        country: country(organization),
      }))
      .filter((item) => item.name)
      .slice(0, MAX_RESULTS)

    return jsonOk({ items })
  } catch {
    // Timeout, DNS failure, ROR outage — all the same to the author.
    return jsonOk({ items: [] })
  } finally {
    clearTimeout(timer)
  }
})
