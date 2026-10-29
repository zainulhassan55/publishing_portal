import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { IssuePage, type ArchiveRow, type IssueArticle, type IssueSectionRow } from '@/components/mockup/IssuePage'
import { currentIssue, getArticles, issueArchive } from '@/data/content'
import { getJournal, journalCode, journalSlugs } from '@/data/registry'
import { getPublication, mastheadFor } from '@/lib/publication'
import { authorsShort, formatDate, formatMonthYear, volumeIssueLabel } from '@/lib/format'
import type { Article } from '@/types/publishing'
import { withSharing } from '@/lib/metadata'

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
  const issue = currentIssue(slug)
  const title = issue ? `${volumeIssueLabel(issue.volume, issue.number)} — ${code}` : `Current issue — ${code}`

  return withSharing({
    title,
    description: issue
      ? `Table of contents for ${volumeIssueLabel(issue.volume, issue.number)} of ${journal.title}.`
      : `Articles published in ${journal.title}.`,
    alternates: { canonical: `/journals/${slug}/current-issue` },
  })
}

const toItem = (a: Article): IssueArticle => ({
  id: a.id,
  href: `/articles/${a.slug}`,
  type: a.type,
  title: a.title,
  authorLine: authorsShort(a.authors.map((x) => x.name)),
  pages: a.pages ?? '',
  date: formatDate(a.publishedIso),
  doi: a.doi,
})

export default async function CurrentIssuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const pub = getPublication('journal', slug)
  if (!pub) notFound()

  // Until OJS publishes an issue there is no table of contents to show.
  const issue = currentIssue(slug)
  if (!issue) redirect(`/journals/${slug}`)

  const articles = await getArticles()
  const byId = new Map(articles.map((a) => [a.id, a]))

  const sections: IssueSectionRow[] = issue.sections
    .map((s) => {
      const items = s.articleIds.map((id) => byId.get(id)).filter((a): a is Article => Boolean(a)).map(toItem)
      return { name: s.name, items, n: `${items.length} ${items.length === 1 ? 'article' : 'articles'}` }
    })
    .filter((s) => s.items.length > 0)
  const count = sections.reduce((n, s) => n + s.items.length, 0)
  const monthYear = issue.publishedIso ? formatMonthYear(issue.publishedIso) : String(issue.year)

  const archive: ArchiveRow[] = issueArchive(slug).map((i) => {
    const c = i.sections.reduce((n, s) => n + s.articleIds.length, 0)
    return {
      label: `Issue ${i.number} · ${i.publishedIso ? formatMonthYear(i.publishedIso) : i.year}`,
      meta: `${c} ${c === 1 ? 'article' : 'articles'}`,
      current: i === issue,
    }
  })

  return (
    <IssuePage
      masthead={mastheadFor(pub, 'home')}
      vol={issue.volume}
      num={issue.number}
      monthYear={monthYear}
      sections={sections}
      count={count}
      archive={archive}
    />
  )
}
