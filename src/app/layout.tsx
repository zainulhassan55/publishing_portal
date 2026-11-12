import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { SiteChrome } from '@/components/mockup/SiteChrome'
import { RevealObserver } from '@/components/motion/RevealObserver'
import { SessionProvider } from '@/components/auth/SessionProvider'
import { siteDescription, siteName, siteTagline, siteUrl } from '@/lib/site'
import { organizationJsonLd, websiteJsonLd } from '@/lib/jsonld'
import { JsonLd } from '@/components/seo/JsonLd'
import { shareImage } from '@/lib/metadata'

// The fonts are stored in ./fonts (the latin files Google Fonts served for these
// weights) and served from our own origin, so the CSP can keep font-src to
// 'self' and the build needs no network: fetching them from Google during
// `next build` started failing in Turbopack in November 2026 and broke deploys.
// See ./fonts/README.md. The CSS variable names are unchanged (globals.css).
const plexSans = localFont({
  src: [{ path: './fonts/ibm-plex-sans-latin-400-700-variable.woff2', weight: '400 700', style: 'normal' }],
  display: 'swap',
  variable: '--font-plex-sans',
})

const sourceSerif = localFont({
  src: [{ path: './fonts/source-serif-4-latin-400-700-variable.woff2', weight: '400 700', style: 'normal' }],
  display: 'swap',
  variable: '--font-source-serif',
  adjustFontFallback: 'Times New Roman',
})

const plexMono = localFont({
  src: [
    { path: './fonts/ibm-plex-mono-latin-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/ibm-plex-mono-latin-500.woff2', weight: '500', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-plex-mono',
  // Arial/Times metrics would mis-size a monospace fallback; let the system monospace stand in.
  adjustFontFallback: false,
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} — ${siteTagline}`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  authors: [{ name: siteName, url: siteUrl }],
  publisher: siteName,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName,
    url: siteUrl,
    title: `${siteName} — ${siteTagline}`,
    description: siteDescription,
    locale: 'en_GB',
    images: [shareImage],
  },
  twitter: { card: 'summary_large_image', images: [shareImage.url] },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#121619' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${plexSans.variable} ${sourceSerif.variable} ${plexMono.variable}`}>
      <body className="min-h-screen bg-page text-ink antialiased">
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <RevealObserver />
        <SessionProvider>
          <SiteChrome>{children}</SiteChrome>
        </SessionProvider>
      </body>
    </html>
  )
}
