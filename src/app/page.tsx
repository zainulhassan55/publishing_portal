import type { Metadata } from 'next'
import {
  HomePage,
  type HomeArticle,
  type HomeCall,
  type HomeJournal,
  type HomeMetric,
  type HomeNews,
} from '@/components/mockup/HomePage'
import { articleHrefById, getArticles, getCalls, getNews } from '@/data/content'
import { isStanding } from '@/data/content/cfps'
import { getJournal, journalCode, journals } from '@/data/registry'
import { subjectFor } from '@/data/subjects'
import { authorsShort, deadlineState, formatDate, formatNumber } from '@/lib/format'
import { siteName } from '@/lib/site'

export const metadata: Metadata = {
  title: { absolute: `${siteName} — open-access academic publishing` },
  description:
    'Ten peer-reviewed open-access journals, two book series and two proceedings series in digital, computational and interdisciplinary science. Double-blind review, CC BY 4.0, no submission fee.',
  alternates: { canonical: '/' },
}

/** Mockup's mature-mode indexing badges (Home.dc.html `idx` map). */
const INDEXING: Record<string, string> = { ijic: 'DOAJ', ijdh: 'DOAJ', ijqt: 'DOAJ', ijdm: 'DOAJ' }

export default function Page() {
  const articles = getArticles()

  /* Metric strip — the mockup's mature labels, derived from the real records
     where the mockup derived them. */
  const views = articles.reduce((sum, a) => sum + (a.metrics?.views ?? 0), 0)
  const downloads = articles.reduce((sum, a) => sum + (a.metrics?.downloads ?? 0), 0)
  const editors = journals.reduce((sum, j) => sum + j.board.length, 0)
  const metrics: HomeMetric[] = [
    { v: formatNumber(articles.length), l: 'Articles published' },
    { v: formatNumber(views), l: 'Article views' },
    { v: formatNumber(downloads), l: 'Article downloads' },
    { v: formatNumber(editors), l: 'Editors on board' },
  ]

  /* Featured articles — D.articles.slice(0, 9) in the mockup. */
  const featured: HomeArticle[] = articles.slice(0, 9).map((a, i) => {
    const journal = getJournal(a.journalSlug)
    return {
      id: a.id,
      href: articleHrefById(a.id),
      thumb: `/images/thumb-${i + 1}.png`,
      code: journal ? journalCode(journal) : a.journalSlug.toUpperCase(),
      type: a.type,
      date: formatDate(a.publishedIso),
      title: a.title,
      authorLine: authorsShort(a.authors.map((author) => author.name)),
      doi: a.doi,
    }
  })

  /* Calls for papers — thematic, not yet closed, soonest deadline first,
     top four (the mockup's filter/sort/slice). The countdown itself is
     computed client-side in the component. */
  const calls: HomeCall[] = getCalls()
    .filter((c) => !isStanding(c) && deadlineState(c.deadlineIso) !== 'closed')
    .sort((a, b) => a.deadlineIso.localeCompare(b.deadlineIso))
    .slice(0, 4)
    .map((c) => {
      const journal = getJournal(c.journalSlug)
      return {
        id: c.id,
        code: journal ? journalCode(journal) : c.journalSlug.toUpperCase(),
        theme: c.theme,
        deadline: formatDate(c.deadlineIso),
        deadlineIso: c.deadlineIso,
        jTitle: journal?.title ?? c.journalSlug,
        guestName: (c.guestEditor ?? '').split(',')[0],
        href: `/journals/${c.journalSlug}/call-for-papers`,
      }
    })

  /* Featured journals — D.journals.slice(0, 8), mature branch. */
  const featuredJournals: HomeJournal[] = journals.slice(0, 8).map((j, i) => {
    const subject = subjectFor(j.slug)
    return {
      slug: j.slug,
      code: journalCode(j),
      title: j.title,
      subject: subject.label,
      color: subject.color,
      scope: j.scope,
      href: `/journals/${j.slug}`,
      submit: `/submit?journal=${j.slug}`,
      hasIndex: !!INDEXING[j.slug],
      index: INDEXING[j.slug] ?? '',
      m1l: 'Article views',
      m1: formatNumber(18000 + i * 7311),
      m2l: 'Downloads',
      m2: formatNumber(4200 + i * 1873),
    }
  })

  const news: HomeNews[] = getNews()
    .slice(0, 3)
    .map((n) => ({
      type: n.type,
      date: formatDate(n.dateIso),
      title: n.title,
      summary: n.body?.[0] ?? '',
    }))

  return <HomePage metrics={metrics} featured={featured} calls={calls} journals={featuredJournals} news={news} />
}
