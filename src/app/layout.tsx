import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Mono, IBM_Plex_Sans, Source_Serif_4 } from 'next/font/google'
import './globals.css'
import { SiteChrome } from '@/components/mockup/SiteChrome'
import { RevealObserver } from '@/components/motion/RevealObserver'
import { SessionProvider } from '@/components/auth/SessionProvider'
import { siteDescription, siteName, siteTagline, siteUrl } from '@/lib/site'
import { organizationJsonLd, websiteJsonLd } from '@/lib/jsonld'
import { JsonLd } from '@/components/seo/JsonLd'

// next/font downloads and self-hosts at build time, so the CSP can keep
// font-src to 'self' and there is no render-blocking request to Google.
const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-plex-sans',
})

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-source-serif',
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-plex-mono',
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
  },
  twitter: { card: 'summary_large_image' },
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
