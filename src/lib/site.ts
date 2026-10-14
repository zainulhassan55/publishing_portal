/** Canonical origin. Used for absolute URLs in metadata, sitemap and JSON-LD. */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.nextgeniqpress.com').replace(/\/$/, '')

export const siteName = 'NextGenIQ Press'
export const siteTagline = 'Open-access journals, book series and proceedings'
export const siteDescription =
  'NextGenIQ Press is an independent open-access academic publisher. Ten peer-reviewed journals across digital health, computing, management, society, mathematics and quantum technologies — double-blind review, CC BY 4.0, no submission fee.'

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

export const mainNav = [
  { label: 'Journals', href: '/journals' },
  { label: 'Articles', href: '/search?tab=articles' },
  { label: 'Books and proceedings', href: '/journals#series' },
  { label: 'Calls for papers', href: '/authors#calls' },
  { label: 'For authors', href: '/authors' },
  { label: 'Policies', href: '/authors#policies' },
  { label: 'About', href: '/about' },
] as const

export const footerGroups = [
  {
    label: 'Publishing',
    links: [
      { label: 'All journals', href: '/journals' },
      { label: 'Book series', href: '/journals#series' },
      { label: 'Proceedings', href: '/journals#series' },
      { label: 'Propose a journal', href: '/propose-journal' },
      { label: 'News', href: '/news' },
    ],
  },
  {
    label: 'Authors',
    links: [
      { label: 'Author hub', href: '/authors' },
      { label: 'Submit a manuscript', href: '/submit' },
      { label: 'Article types', href: '/authors#types' },
      { label: 'Open access and fees', href: '/authors#fees' },
      { label: 'Templates', href: '/authors#templates' },
    ],
  },
  {
    label: 'Reviewers and editors',
    links: [
      { label: 'For reviewers', href: '/authors#reviewers' },
      { label: 'For editors', href: '/authors#editors' },
      { label: 'For librarians', href: '/authors#librarians' },
      { label: 'Review invitations', href: '/dashboard?role=reviewer' },
    ],
  },
  {
    label: 'Policies',
    links: [
      { label: 'Publication ethics', href: '/policies/publication-ethics' },
      { label: 'Open access', href: '/policies/open-access' },
      { label: 'Copyright and licensing', href: '/policies/copyright-licensing' },
      { label: 'Generative AI policy', href: '/policies/generative-ai-policy' },
      { label: 'Research data policy', href: '/policies/research-data-policy' },
    ],
  },
  {
    label: 'Publisher',
    links: [
      { label: 'About NextGenIQ Press', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Indexing', href: '/indexing' },
      { label: 'Editorial office', href: '/contact' },
    ],
  },
] as const

export const legalLinks = [
  { label: 'Privacy', href: '/policies/privacy' },
  { label: 'Terms', href: '/policies/terms' },
  { label: 'Cookies', href: '/policies/cookies' },
  { label: 'Accessibility', href: '/policies/accessibility' },
] as const
