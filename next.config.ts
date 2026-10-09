import type { NextConfig } from 'next'

/**
 * Content-Security-Policy. `unsafe-inline` on style-src is required: the design
 * system drives per-subject colours and progress widths through inline style
 * attributes. Scripts are not given that latitude.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
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
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  async redirects() {
    // Route shape from the previous Vite app, preserved so existing links and
    // any already-indexed URLs do not 404.
    return [
      { source: '/articles', destination: '/search?tab=articles', permanent: true },
      { source: '/cfp', destination: '/authors#calls', permanent: true },
      { source: '/guidelines', destination: '/authors', permanent: true },
      { source: '/policies', destination: '/authors#policies', permanent: true },
      { source: '/proceedings', destination: '/journals#series', permanent: true },
      { source: '/special-issues', destination: '/authors#calls', permanent: true },
    ]
  },
}

export default nextConfig
