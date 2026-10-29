import type { Metadata } from 'next'
import { HomePage, type HomeArticle, type HomeAudience, type HomePublication } from '@/components/mockup/HomePage'
import { latestArticles } from '@/data/content'
import { policies, policyGroups } from '@/data/policies'
import { about, audiences, hero } from '@/data/publisher'
import { getJournal, journalCode } from '@/data/registry'
import { authorsShort, formatDate } from '@/lib/format'
import { publicationCards } from '@/lib/publication'
import { siteDescription, siteName, siteTagline } from '@/lib/site'
import { withSharing } from '@/lib/metadata'

export const metadata: Metadata = withSharing({
  title: { absolute: `${siteName} — ${siteTagline}` },
  description: siteDescription,
  alternates: { canonical: '/' },
})

/**
 * Refreshed on the server rather than fixed at build. Published papers reach
 * this page through the scheduled harvest and the admin show/hide gate, both of
 * which purge the page cache (src/lib/articles/purge.ts); the hour here is the
 * safety net for when that purge is missed, not the normal delay.
 */
export const revalidate = 3600

export default async function Page() {
  const articles: HomeArticle[] = (await latestArticles(6)).map((a) => {
    const journal = getJournal(a.journalSlug)
    return {
      id: a.id,
      href: `/articles/${a.slug}`,
      code: journal ? journalCode(journal) : a.journalSlug.toUpperCase(),
      type: a.type,
      date: formatDate(a.publishedIso),
      title: a.title,
      authorLine: authorsShort(a.authors.map((author) => author.name)),
    }
  })

  const { journals: journalCards, series: seriesCards } = publicationCards()
  const publications: HomePublication[] = [...journalCards, ...seriesCards]

  const homeAudiences: HomeAudience[] = [
    {
      who: 'Authors',
      headline: 'Publish with us',
      desc: 'Submit original research to one of our journals, or propose a volume or chapter for a book series. Journal articles are peer reviewed double-blind and published open access.',
      links: [
        { t: 'Submit a manuscript', href: '/submit' },
        { t: 'Propose a book volume', href: '/editors#books-and-proceedings' },
        { t: 'Open access and fees', href: '/authors#apc' },
      ],
    },
    ...audiences.map((a) => ({
      who: a.who.replace(/^For /, '').replace(/^\w/, (c) => c.toUpperCase()),
      headline: a.who,
      desc: a.text,
      links: a.links.map((l) => ({ t: l.label, href: l.href })),
    })),
  ]

  const policyLinks = policyGroups.map((group) => ({
    group,
    links: policies.filter((p) => p.group === group).map((p) => ({ t: p.title, href: `/policies/${p.slug}` })),
  }))

  return (
    <HomePage
      hero={hero}
      audiences={homeAudiences}
      publications={publications}
      articles={articles}
      about={about}
      policies={policyLinks}
    />
  )
}
