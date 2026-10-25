/** Canonical origin. Used for absolute URLs in metadata, sitemap and JSON-LD. */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.nextgeniqpress.com').replace(/\/$/, '')

export const siteName = 'NextGenIQ Press'
export const siteTagline = 'Open-access journals, book series and proceedings'
export const siteDescription =
  'NextGenIQ Press publishes open-access journals, research books, monographs, and conference proceedings across digital, computational, and interdisciplinary fields.'

export const editorialEmail = 'contact@nextgeniqpress.com'

/** Crossref DOI prefix. Registered per-publisher; used to build DOI URLs. */
export const doiPrefix = process.env.NEXT_PUBLIC_DOI_PREFIX || '10.63521'

export const doiUrl = (doi: string) => `https://doi.org/${doi}`

export const publisherCountry = 'United Kingdom'
export const licenceName = 'Creative Commons Attribution 4.0 International'
export const licenceShort = 'CC BY 4.0'
export const licenceUrl = 'https://creativecommons.org/licenses/by/4.0/'

/**
 * Absolute form of a site path. A URL that is already absolute — the PDF
 * galley OJS reports lives on the OJS origin — is returned untouched; the
 * first real paper shipped a `citation_pdf_url` of `https://site/https://…`
 * because this prefixed unconditionally.
 */
export const absoluteUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) return path
  return `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`
}

export const legalLinks = [
  { label: 'Privacy', href: '/policies/privacy' },
  { label: 'Terms', href: '/policies/terms' },
  { label: 'Cookies', href: '/policies/cookies' },
  { label: 'Accessibility', href: '/policies/accessibility' },
] as const
