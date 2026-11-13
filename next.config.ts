import type { NextConfig } from 'next'

/**
 * Content-Security-Policy. `unsafe-inline` on style-src is required: the design
 * system drives per-subject colours and progress widths through inline style
 * attributes. Scripts are not given that latitude.
 */
const csp = [
  "default-src 'self'",
  // Cloudflare Turnstile, the captcha on sign-in and register: its script
  // loads from this host and renders its check in a frame from it.
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  // Editorial form uploads go from the browser straight to Cloudflare R2 with a
  // presigned URL (src/lib/storage.ts), so the R2 API host must be reachable.
  "connect-src 'self' https://*.r2.cloudflarestorage.com",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ')

/**
 * The article page embeds its own PDF route in an iframe. `frame-ancestors
 * 'none'` and `X-Frame-Options: DENY` are right for every other path, so that
 * one route gets `'self'` instead — the later headers() rule wins on a key the
 * global rule also sets.
 */
const pdfCsp = csp.replace("frame-ancestors 'none'", "frame-ancestors 'self'")

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

/**
 * October 2026 portfolio change: the publisher kept two journals (now TICR and
 * JDMIE) and two book series (now SISDT and LNMRI). Pages of the titles that were dropped, and
 * journal page ids that were renamed, redirect to their nearest equivalent.
 */
const removedJournals = ['ijdh', 'ijds', 'ijei', 'ijis', 'ijmc', 'ijmr', 'ijqt', 'ijse']
const removedSeries = ['isri', 'lnisi', 'ngiq-lncse']

/** Old journal page id → new page id, or a publisher-wide page when it starts with "/". */
const renamedJournalPages: Record<string, string> = {
  about: '',
  'author-instructions': 'author-guidelines',
  'article-types': 'author-guidelines',
  'peer-review-process': 'peer-review-ethics',
  'publication-ethics': 'peer-review-ethics',
  apc: 'open-access-fees',
  'open-access': 'open-access-fees',
  // Indexing and archiving pages were removed from the journals in October 2026.
  // `indexing-abstracting` and `articles-in-press` came back as real pages in
  // November 2026, so they no longer redirect.
  indexing: 'indexing-abstracting',
  'archiving-preservation': '',
  'editorial-office': 'contact',
  // No articles are published yet; the journal home is the nearest page.
  articles: '',
  'special-issues': 'special-issue-guidelines',
  'call-for-papers': 'special-issue-guidelines',
  news: '',
  'reviewer-guidelines': '/reviewers',
  'copyright-licensing': '/policies/copyright-licensing',
  'generative-ai-policy': '/policies/generative-ai-policy',
  'research-data-policy': '/policies/research-data-policy',
  'corrections-retractions': '/policies/corrections-retractions',
}

/**
 * Renamed titles: the code each title had before → where it lives now. The
 * titles were renamed in October 2026 and the portal's URLs followed on
 * 2026-11-01, so a portal slug is now the OJS path in lowercase (ticr ↔ TICR).
 * src/lib/ojs/contexts.ts holds the same pairs as `legacySlugs`; this file
 * stays self-contained because next.config.ts cannot reliably import app
 * modules. Permanent: the old codes are retired for good.
 */
const renamedTitles: { from: string; to: string }[] = [
  { from: '/journals/ijic', to: '/journals/ticr' },
  { from: '/journals/ijdm', to: '/journals/jdmie' },
  { from: '/journals/jqcs', to: '/journals/tqcis' },
  { from: '/journals/jaise', to: '/journals/jaaise' },
  { from: '/magazines/sst', to: '/magazines/dtcr' },
  // A magazine is not a journal; these were never real pages but are linked.
  { from: '/journals/sst', to: '/magazines/dtcr' },
  { from: '/journals/dtcr', to: '/magazines/dtcr' },
  // Book series slugs followed their codes in November 2026 (SISDT, LNMRI).
  // src/lib/books/series-slugs.ts maps the same pairs for database rows.
  { from: '/series/aiisc', to: '/series/sisdt' },
  { from: '/series/lnmr', to: '/series/lnmri' },
  // Manuscript templates live under the series slug (public/templates/<slug>/).
  { from: '/templates/aiisc', to: '/templates/sisdt' },
  { from: '/templates/lnmr', to: '/templates/lnmri' },
]

const portfolioRedirects = [
  ...renamedTitles.map(({ from, to }) => ({ source: from, destination: to, permanent: true })),
  ...renamedTitles.map(({ from, to }) => ({ source: `${from}/:path*`, destination: `${to}/:path*`, permanent: true })),
  // Publisher-wide guidance that used to live under one journal's path.
  { source: '/journals/:journal(ijdh|ijds|ijei|ijis|ijmc|ijmr|ijqt|ijse|ticr|jdmie|tqcis|jaaise|reta)/reviewer-guidelines', destination: '/reviewers', permanent: true },
  ...removedJournals.map((slug) => ({ source: `/journals/${slug}/:path*`, destination: '/journals', permanent: true })),
  ...removedJournals.map((slug) => ({ source: `/journals/${slug}`, destination: '/journals', permanent: true })),
  { source: '/series/ngiq-lnmr/:path*', destination: '/series/lnmri', permanent: true },
  { source: '/series/ngiq-lnmr', destination: '/series/lnmri', permanent: true },
  ...removedSeries.map((slug) => ({ source: `/series/${slug}/:path*`, destination: '/series', permanent: true })),
  ...removedSeries.map((slug) => ({ source: `/series/${slug}`, destination: '/series', permanent: true })),
  ...Object.entries(renamedJournalPages).map(([from, to]) => ({
    source: `/journals/:journal(ticr|jdmie)/${from}`,
    destination: to.startsWith('/') ? to : `/journals/:journal${to ? `/${to}` : ''}`,
    permanent: true,
  })),
]

const nextConfig: NextConfig = {
  // Standalone output keeps the VPS deploy to a single self-contained directory
  // that can be swapped in atomically by symlink.
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        source: '/articles/:slug/pdf',
        headers: [
          { key: 'Content-Security-Policy', value: pdfCsp },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ]
  },
  async redirects() {
    return [
      // Route shape from the previous Vite app, preserved so existing links and
      // any already-indexed URLs do not 404.
      // Temporary: nothing is published yet. Point back at the article search once papers appear.
      { source: '/articles', destination: '/journals', permanent: false },
      { source: '/cfp', destination: '/authors#cfp', permanent: true },
      { source: '/guidelines', destination: '/authors', permanent: true },
      { source: '/proceedings', destination: '/series', permanent: true },
      { source: '/special-issues', destination: '/editors/special-issues', permanent: true },
      ...portfolioRedirects,
    ]
  },
}

export default nextConfig
