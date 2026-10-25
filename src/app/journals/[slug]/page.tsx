import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { JournalHome, type HomeArticle } from '@/components/mockup/JournalHome'
import { JsonLd } from '@/components/seo/JsonLd'
import { articlesForJournal } from '@/data/content'
import { getJournal, journalCode, journalSlugs } from '@/data/registry'
import { authorsShort, clampText, formatDate } from '@/lib/format'
import { journalJsonLd } from '@/lib/jsonld'
import { getPublication, mastheadFor } from '@/lib/publication'

export function generateStaticParams() {
  return journalSlugs.map((slug) => ({ slug }))
}

/**
 * Refreshed on the server rather than fixed at build. Published papers reach
 * this page through the scheduled harvest and the admin show/hide gate, both of
 * which purge the page cache (src/lib/articles/purge.ts); the hour here is the
 * safety net for when that purge is missed, not the normal delay.
 */
export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const journal = getJournal(slug)
  if (!journal) return {}

  const code = journalCode(journal)
  return {
    title: `${journal.title} (${code})`,
    description: clampText(journal.scope),
    alternates: { canonical: `/journals/${slug}` },
    openGraph: {
      type: 'website',
      title: `${journal.title} (${code})`,
      description: clampText(journal.scope),
      url: `/journals/${slug}`,
    },
  }
}

export default async function JournalHomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const journal = getJournal(slug)
  const pub = getPublication('journal', slug)
  if (!journal || !pub) notFound()

  const masthead = mastheadFor(pub, 'home', true)

  const items: HomeArticle[] = (await articlesForJournal(slug)).slice(0, 5).map((a) => ({
    id: a.id,
    href: `/articles/${a.slug}`,
    type: a.type,
    title: a.title,
    authorLine: authorsShort(a.authors.map((x) => x.name)),
    meta: [`Vol. ${a.volume}, Issue ${a.issue}`, a.pages ? `pp. ${a.pages}` : '', formatDate(a.publishedIso), a.doi ? `doi.org/${a.doi}` : '']
      .filter(Boolean)
      .join(' · '),
  }))


  return (
    <>
      <JsonLd data={journalJsonLd(journal)} />
      <JournalHome
        masthead={masthead}
        topics={journal.topics}
        aimsHref={pub.pageHref('aims-scope')}
        listTitle="Latest articles"
        listHref="/search?tab=articles"
        items={items}
        emptyText={null}
        editorsLabel={journal.profile.editorsLabel}
        editors={journal.profile.editors}
        boardHref={pub.pageHref('editorial-board')}
        cta={{
          title: `Submit to ${pub.code}`,
          text: 'Submissions are accepted year-round, with continuous publication following acceptance and production.',
          label: 'Submit a manuscript',
          href: pub.pageHref('submit'),
          secondary: { label: 'Read the author guidelines first', href: pub.pageHref('author-guidelines') },
        }}
        groups={masthead.groups}
      />
    </>
  )
}
