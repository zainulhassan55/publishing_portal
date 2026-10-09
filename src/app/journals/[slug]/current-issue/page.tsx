import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { IssuePage, type ArchiveRow, type IssueArticle, type IssueSectionRow } from '@/components/mockup/IssuePage'
import { currentIssue, getArticles, issueArchive } from '@/data/content'
import { getJournal, journalCode, journalMenuGroups, journalSlugs } from '@/data/registry'
import { subjectFor } from '@/data/subjects'
import { authorsShort, formatDate, formatMonthYear, volumeIssueLabel } from '@/lib/format'
import type { Article } from '@/types/publishing'

export function generateStaticParams() {
  return journalSlugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const journal = getJournal(slug)
  if (!journal) return {}

  const code = journalCode(journal)
  const issue = currentIssue(slug)
  const title = issue ? `${volumeIssueLabel(issue.volume, issue.number)} — ${code}` : `Current issue — ${code}`

  return {
    title,
    description: issue
      ? `Table of contents for ${volumeIssueLabel(issue.volume, issue.number)} of ${journal.title}.`
      : `${journal.title} publishes continuously: each article appears online as soon as it is accepted and typeset, under Volume 1.`,
    alternates: { canonical: `/journals/${slug}/current-issue` },
  }
}

const SECTION_TYPES: [string, string[]][] = [
  ['Editorial', ['Editorial']],
  ['Research Articles', ['Research Article', 'Case Study']],
  ['Reviews', ['Review']],
  ['Short Communications and Perspectives', ['Short Communication', 'Perspective']],
]

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
  const journal = getJournal(slug)
  if (!journal) notFound()

  const code = journalCode(journal)
  const subject = subjectFor(slug)
  const articles = getArticles()
  const own = articles.filter((a) => a.journalSlug === slug)

  const masthead = {
    j: { slug, code, title: journal.title, subject: subject.label, color: subject.color },
    tab: 'Content',
    groups: journalMenuGroups(slug).map((g) => ({
      group: g.label,
      links: g.items.map((item) => ({ title: item.label, href: item.href })),
    })),
    articlesPublished: own.length,
    downloads: own.reduce((n, a) => n + (a.metrics?.downloads ?? 0), 0),
  }

  const issue = currentIssue(slug)
  const byId = new Map(articles.map((a) => [a.id, a]))

  // The issue fixture drives the table of contents where one exists; otherwise
  // the journal's articles are grouped into the mockup's sections by type so
  // the page still renders populated.
  let sections: IssueSectionRow[]
  if (issue) {
    sections = issue.sections.map((s) => {
      const items = s.articleIds.map((id) => byId.get(id)).filter((a): a is Article => Boolean(a)).map(toItem)
      return { name: s.name, items, n: `${items.length} ${items.length === 1 ? 'article' : 'articles'}` }
    })
  } else {
    sections = SECTION_TYPES.map(([name, types]) => {
      const items = own.filter((a) => types.includes(a.type)).map(toItem)
      return { name, items, n: `${items.length} ${items.length === 1 ? 'article' : 'articles'}` }
    })
  }
  sections = sections.filter((s) => s.items.length > 0)
  const count = sections.reduce((n, s) => n + s.items.length, 0)

  const vol = issue?.volume ?? 1
  const num = issue?.number ?? 2
  const monthYear = issue?.publishedIso ? formatMonthYear(issue.publishedIso) : 'June 2026'

  const fixtures = issueArchive(slug)
  const archive: ArchiveRow[] =
    fixtures.length > 0
      ? fixtures.map((i) => {
          const c = i.sections.reduce((n, s) => n + s.articleIds.length, 0)
          return {
            label: `Issue ${i.number} · ${i.publishedIso ? formatMonthYear(i.publishedIso) : i.year}`,
            meta: `${c} ${c === 1 ? 'article' : 'articles'}`,
            current: i === issue,
          }
        })
      : [{ label: `Issue ${num} · ${monthYear}`, meta: `${count} ${count === 1 ? 'article' : 'articles'}`, current: true }]

  return (
    <IssuePage
      masthead={masthead}
      vol={vol}
      num={num}
      monthYear={monthYear}
      sections={sections}
      count={count}
      archive={archive}
    />
  )
}
