import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { JournalStaticPage } from '@/components/mockup/JournalStaticPage'
import { getJournal, getJournalPage, journalCode, journalPageNeighbours, journals, journalSubmitHref } from '@/data/registry'
import { getPublication, groupOf, mastheadFor, sideGroupsFor, toPageBlocks } from '@/lib/publication'

export function generateStaticParams() {
  return journals.flatMap((journal) => (journal.pages ?? []).map((page) => ({ slug: journal.slug, pageId: page.id })))
}

/**
 * Refreshed on the server rather than fixed at build; the scheduled harvest and
 * the admin screens purge the page cache (src/lib/articles/purge.ts), and the
 * hour here is the safety net for when that purge is missed.
 */
export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; pageId: string }>
}): Promise<Metadata> {
  const { slug, pageId } = await params
  const journal = getJournal(slug)
  const page = getJournalPage(slug, pageId)
  if (!journal || !page) return {}

  return {
    title: `${page.title} — ${journalCode(journal)}`,
    description: page.summary,
    alternates: { canonical: `/journals/${slug}/${pageId}` },
    openGraph: {
      type: 'article',
      title: `${page.title} — ${journal.title}`,
      description: page.summary,
      url: `/journals/${slug}/${pageId}`,
    },
  }
}

export default async function JournalContentPage({
  params,
}: {
  params: Promise<{ slug: string; pageId: string }>
}) {
  const { slug, pageId } = await params
  // The publisher's path list gives every journal a /submit page; submission itself lives at /submit.
  if (pageId === 'submit' && getJournal(slug)) redirect(journalSubmitHref(slug))

  const page = getJournalPage(slug, pageId)
  const pub = getPublication('journal', slug)
  if (!page || !pub) notFound()

  const href = `/journals/${slug}/${pageId}`
  const group = groupOf(pub, href)

  // Prev/next wrap around the full page order.
  const { previous, next } = journalPageNeighbours(slug, pageId)
  const wrapPrev = previous ?? pub.pages[pub.pages.length - 1]
  const wrapNext = next ?? pub.pages[0]


  return (
    <JournalStaticPage
      masthead={mastheadFor(pub, group)}
      group={group}
      title={page.title}
      blocks={toPageBlocks(page.blocks)}
      side={sideGroupsFor(pub, href)}
      prev={{ href: pub.pageHref(wrapPrev.id), title: wrapPrev.label }}
      next={{ href: pub.pageHref(wrapNext.id), title: wrapNext.label }}
      cta={
        pageId === 'special-issue-guidelines'
          ? {
              title: 'Propose a special issue',
              text: 'Send your proposal online, following the Special Issue Guidelines.',
              label: 'Proposal form',
              href: '/editors/special-issues/form',
            }
          : {
              title: 'Ready to submit?',
              text: `${pub.code} accepts submissions year-round.`,
              label: 'Submit a manuscript',
              href: journalSubmitHref(slug),
            }
      }
    />
  )
}
