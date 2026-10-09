import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site'

/**
 * Audit finding F-08: `/robots.txt` returned the SPA's HTML shell with HTTP 200,
 * so crawlers received a web page where they expected directives.
 *
 * Search results and API routes are excluded because they are infinite and
 * valueless to index; the OJS back office is excluded because its URLs are
 * workflow endpoints, not content. The OJS *public* journal pages are not
 * excluded — OJS serves its own robots directives under /ojs.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/search', '/dashboard', '/profile', '/submit', '/sign-in'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
