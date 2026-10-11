import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site'

/**
 * Audit finding F-08: `/robots.txt` returned the SPA's HTML shell with HTTP 200,
 * so crawlers received a web page where they expected directives.
 *
 * Search results and API routes are excluded because they are infinite and
 * valueless to index.
 *
 * The OJS back office is excluded too — which this comment previously claimed
 * while the rules below listed no `/ojs` path at all, so every workflow URL on
 * the site was crawlable. They are endpoints, not content: a crawler following
 * them finds login walls and burns the crawl budget that should be spent on
 * journals and articles.
 *
 * OJS's *public* pages are deliberately absent from this list. They are not
 * left crawlable — they 301 to their portal equivalents in the vhost, which
 * both redirects the reader and consolidates ranking onto the portal URL.
 * Disallowing them here would be worse than useless: a crawler that cannot
 * fetch a URL cannot see that it redirects, so the duplicates would stay in
 * the index indefinitely with nothing pointing at the real page.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/search',
          '/dashboard',
          '/profile',
          '/submit',
          '/sign-in',
          // OJS workflow surfaces. Wildcards because the journal is a path
          // segment: /ojs/index.php/ijdh/submission/wizard and nine more.
          '/ojs/*/submission/',
          '/ojs/*/dashboard/',
          '/ojs/*/workflow/',
          '/ojs/*/management/',
          '/ojs/*/user/',
          '/ojs/*/login',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
