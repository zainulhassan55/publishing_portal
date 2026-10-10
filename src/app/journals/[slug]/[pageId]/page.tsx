import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  JournalStaticPage,
  type PageBlock,
  type SideGroup,
  type StaticPageCall,
} from '@/components/mockup/JournalStaticPage'
import { callsForJournal, getArticles } from '@/data/content'
import { isStanding } from '@/data/content/cfps'
import {
  getJournal,
  getJournalPage,
  journalCode,
  journalMenuGroups,
  journalPageNeighbours,
  journals,
} from '@/data/registry'
import { subjectFor } from '@/data/subjects'
import { formatDate } from '@/lib/format'

/**
 * Every journal page except the two with routes of their own: `current-issue`
 * and the archive, which read live issue data rather than static blocks.
 */
const EXCLUDED = new Set(['current-issue', 'issues'])

export function generateStaticParams() {
  return journals.flatMap((journal) =>
    (journal.pages ?? [])
      .filter((page) => !EXCLUDED.has(page.id))
      .map((page) => ({ slug: journal.slug, pageId: page.id })),
  )
}

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

const pageHref = (slug: string, id: string) =>
  id === 'current-issue' ? `/journals/${slug}/current-issue` : `/journals/${slug}/${id}`

export default async function JournalContentPage({
  params,
}: {
  params: Promise<{ slug: string; pageId: string }>
}) {
  const { slug, pageId } = await params
  const journal = getJournal(slug)
  const page = getJournalPage(slug, pageId)
  if (!journal || !page || EXCLUDED.has(pageId)) notFound()

  const code = journalCode(journal)
  const subject = subjectFor(slug)
  const own = getArticles().filter((a) => a.journalSlug === slug)
  const menuGroups = journalMenuGroups(slug)

  const masthead = {
    j: { slug, code, title: journal.title, subject: subject.label, color: subject.color },
    tab:
      menuGroups.find((g) => g.items.some((item) => item.href === `/journals/${slug}/${pageId}`))?.label ?? 'About',
    groups: menuGroups.map((g) => ({
      group: g.label,
      links: g.items.map((item) => ({ title: item.label, href: item.href })),
    })),
    articlesPublished: own.length,
    downloads: own.reduce((n, a) => n + (a.metrics?.downloads ?? 0), 0),
  }

  const blocks: PageBlock[] = (page.blocks ?? []).map((b, i) => ({
    id: `s${i + 1}`,
    n: i + 1,
    h: b.title,
    p: b.paragraphs ?? [],
    ul: b.bullets ?? [],
    table: b.table ? { head: b.table.head, rows: b.table.rows } : null,
    sub: (b.subsections ?? []).map((s, k) => ({
      id: `s${i + 1}-${k + 1}`,
      n: `${i + 1}.${k + 1}`,
      h: s.title,
      p: s.paragraphs ?? [],
      ul: s.bullets ?? [],
      table: s.table ? { head: s.table.head, rows: s.table.rows } : null,
    })),
  }))

  const side: SideGroup[] = menuGroups.map((g) => ({
    group: g.label,
    links: g.items.map((item) => ({
      title: item.label,
      href: item.href,
      current: item.href === `/journals/${slug}/${pageId}`,
    })),
  }))

  // Prev/next wrap around the full page order, as the mockup's modulo does.
  const pages = journal.pages ?? []
  const { previous, next } = journalPageNeighbours(slug, pageId)
  const wrapPrev = previous ?? pages[pages.length - 1]
  const wrapNext = next ?? pages[0]

  const calls: StaticPageCall[] = callsForJournal(slug)
    .filter((c) => !isStanding(c))
    .map((c) => ({
      theme: c.theme,
      deadlineIso: c.deadlineIso,
      deadline: formatDate(c.deadlineIso),
      guest: c.guestEditor ?? '',
    }))

  return (
    <JournalStaticPage
      masthead={masthead}
      group={masthead.tab}
      title={page.title}
      blocks={blocks}
      isInstructions={pageId === 'author-instructions'}
      showCalls={pageId === 'call-for-papers' || pageId === 'special-issues'}
      calls={calls}
      todayIso={new Date().toISOString().slice(0, 10)}
      side={side}
      prev={{ href: pageHref(slug, wrapPrev.id), title: wrapPrev.label }}
      next={{ href: pageHref(slug, wrapNext.id), title: wrapNext.label }}
    />
  )
}
