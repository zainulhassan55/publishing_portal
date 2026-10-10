import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { JournalHome, type HomeArticle, type HomeCall } from '@/components/mockup/JournalHome'
import { JsonLd } from '@/components/seo/JsonLd'
import { callsForJournal, currentIssue, getArticles } from '@/data/content'
import { isStanding } from '@/data/content/cfps'
import { getJournal, journalCode, journalMenuGroups, journalSlugs } from '@/data/registry'
import { subjectFor } from '@/data/subjects'
import { authorsShort, formatDate, formatMonthYear } from '@/lib/format'
import { journalJsonLd } from '@/lib/jsonld'

export function generateStaticParams() {
  return journalSlugs.map((slug) => ({ slug }))
}

/** Trims to a whole word so a meta description never ends mid-term. */
function clamp(text: string, max = 155): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:]$/, '')}…`
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const journal = getJournal(slug)
  if (!journal) return {}

  const code = journalCode(journal)
  return {
    title: `${journal.title} (${code})`,
    description: clamp(`${journal.tagline ? `${journal.tagline} ` : ''}${journal.scope}`),
    alternates: { canonical: `/journals/${slug}` },
    openGraph: {
      type: 'website',
      title: `${journal.title} (${code})`,
      description: clamp(journal.scope),
      url: `/journals/${slug}`,
    },
  }
}

const SECTION_TYPES: [string, string[]][] = [
  ['Editorial', ['Editorial']],
  ['Research Articles', ['Research Article', 'Case Study']],
  ['Reviews', ['Review']],
  ['Short Communications and Perspectives', ['Short Communication', 'Perspective']],
]

export default async function JournalHomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const journal = getJournal(slug)
  if (!journal) notFound()

  const code = journalCode(journal)
  const subject = subjectFor(slug)
  const articles = getArticles()
  const own = articles.filter((a) => a.journalSlug === slug)

  const masthead = {
    j: { slug, code, title: journal.title, subject: subject.label, color: subject.color },
    tab: 'home',
    groups: journalMenuGroups(slug).map((g) => ({
      group: g.label,
      links: g.items.map((item) => ({ title: item.label, href: item.href })),
    })),
    articlesPublished: own.length,
    downloads: own.reduce((n, a) => n + (a.metrics?.downloads ?? 0), 0),
  }

  const pool: HomeArticle[] = own
    .concat(articles.filter((a) => a.journalSlug !== slug))
    .map((a) => ({
      id: a.id,
      href: `/articles/${a.slug}`,
      type: a.type,
      title: a.title,
      authorLine: authorsShort(a.authors.map((x) => x.name)),
      vol: a.volume,
      issue: a.issue,
      pages: a.pages ?? '',
      date: formatDate(a.publishedIso),
      doi: a.doi,
    }))

  const issue = currentIssue(slug)
  let issueLine: string
  let issueMeta: string
  if (issue) {
    const count = issue.sections.reduce((n, s) => n + s.articleIds.length, 0)
    issueLine = `Volume ${issue.volume}, Issue ${issue.number}${issue.publishedIso ? ` · ${formatMonthYear(issue.publishedIso)}` : ''}`
    issueMeta = `${count} articles · ${issue.sections.map((s) => s.name).join(', ')}`
  } else {
    const names = SECTION_TYPES.filter(([, types]) => own.some((a) => types.includes(a.type))).map(([name]) => name)
    issueLine = 'Volume 1, Issue 2 · June 2026'
    issueMeta = `${own.length} articles${names.length ? ` · ${names.join(', ')}` : ''}`
  }

  const calls: HomeCall[] = callsForJournal(slug)
    .filter((c) => !isStanding(c))
    .map((c) => ({
      theme: c.theme,
      deadlineIso: c.deadlineIso,
      deadline: formatDate(c.deadlineIso),
      guest: c.guestEditor ?? '',
    }))

  const todayIso = new Date().toISOString().slice(0, 10)

  return (
    <>
      <JsonLd data={journalJsonLd(journal)} />
      <JournalHome
        masthead={masthead}
        topics={journal.topics.slice(0, 8)}
        pool={pool}
        calls={calls}
        todayIso={todayIso}
        issueLine={issueLine}
        issueMeta={issueMeta}
        groups={masthead.groups}
      />
    </>
  )
}
