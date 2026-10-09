import type { JournalDetail, JournalPage } from '@/types/content'
import type { Series } from '@/types/publishing'
import { journalMenu } from './journalTemplate'
import { ijdhDetail } from './journals/ijdh'
import { ijdmDetail } from './journals/ijdm'
import { ijdsDetail } from './journals/ijds'
import { ijeiDetail } from './journals/ijei'
import { ijicDetail } from './journals/ijic'
import { ijisDetail } from './journals/ijis'
import { ijmcDetail } from './journals/ijmc'
import { ijmrDetail } from './journals/ijmr'
import { ijqtDetail } from './journals/ijqt'
import { ijseDetail } from './journals/ijse'
import { subjectFor } from './subjects'

/**
 * Single ordered source of truth for the portfolio. Everything downstream —
 * routes, sitemap, search index, nav menus — derives from this array, so adding
 * a journal is one import plus one entry.
 */
export const journals: JournalDetail[] = [
  ijdhDetail,
  ijdmDetail,
  ijdsDetail,
  ijeiDetail,
  ijicDetail,
  ijisDetail,
  ijmcDetail,
  ijmrDetail,
  ijqtDetail,
  ijseDetail,
]

export const journalSlugs = journals.map((j) => j.slug)

const journalBySlug = new Map(journals.map((j) => [j.slug, j]))

export const getJournal = (slug: string): JournalDetail | undefined => journalBySlug.get(slug.toLowerCase())

/** The journal's code (IJDH, IJQT, …). `shortTitle` has always held it. */
export const journalCode = (j: JournalDetail) => j.shortTitle ?? j.slug.toUpperCase()

export const journalSubject = (slug: string) => subjectFor(slug)

export const getJournalPage = (slug: string, pageId: string): JournalPage | undefined =>
  getJournal(slug)?.pages?.find((p) => p.id === pageId)

/** Flat page order within a journal, used for prev/next navigation. */
export const journalPageOrder = (slug: string): JournalPage[] => getJournal(slug)?.pages ?? []

export const journalPageNeighbours = (slug: string, pageId: string) => {
  const pages = journalPageOrder(slug)
  const i = pages.findIndex((p) => p.id === pageId)
  return {
    previous: i > 0 ? pages[i - 1] : undefined,
    next: i >= 0 && i < pages.length - 1 ? pages[i + 1] : undefined,
  }
}

/**
 * Journal sub-navigation groups. The template's `journalMenu` carries the group
 * structure; this resolves each entry to a concrete label and href so the
 * mega-menu and the "journal information" link map render from one source.
 */
export type ResolvedMenuItem = { label: string; href: string; external?: boolean }

export const journalMenuGroups = (slug: string): { label: string; items: ResolvedMenuItem[] }[] => {
  const journal = getJournal(slug)
  if (!journal) return []

  return journalMenu.map((group) => ({
    label: group.label,
    items: group.items.flatMap<ResolvedMenuItem>((item) => {
      if (item.kind === 'submit') return [{ label: item.label, href: `/submit?journal=${slug}` }]
      if (item.kind === 'archive') return [{ label: item.label, href: `/journals/${slug}/issues` }]
      const page = journal.pages?.find((p) => p.id === item.id)
      if (!page) return []
      if (page.id === 'current-issue') return [{ label: page.label, href: `/journals/${slug}/current-issue` }]
      return [{ label: page.label, href: `/journals/${slug}/${page.id}` }]
    }),
  }))
}

/* -------------------------------------------------------------------------- */
/* Book and proceedings series                                                */
/* -------------------------------------------------------------------------- */

export const series: Series[] = [
  {
    slug: 'isri',
    code: 'ISRI',
    title: 'International Series in Research and Innovation',
    kind: 'book',
    subjectKey: 'interdisciplinary',
    scope:
      'Edited volumes and monographs on research methodology, innovation systems and the organisation of scientific work.',
    issn: null,
  },
  {
    slug: 'lnisi',
    code: 'LNISI',
    title: 'Lecture Notes in Intelligent Systems and Informatics',
    kind: 'book',
    subjectKey: 'computing',
    scope: 'Monographs and lecture notes across intelligent systems, informatics and applied computing.',
    issn: null,
  },
  {
    slug: 'ngiq-lncse',
    code: 'NGIQ-LNCSE',
    title: 'Lecture Notes in Computational Science and Engineering',
    kind: 'proceedings',
    subjectKey: 'mathematics',
    scope:
      'Peer-reviewed proceedings of conferences and workshops in computational science, numerical methods and engineering simulation.',
    issn: null,
  },
  {
    slug: 'ngiq-lnmr',
    code: 'NGIQ-LNMR',
    title: 'Lecture Notes in Multidisciplinary Research',
    kind: 'proceedings',
    subjectKey: 'interdisciplinary',
    scope: 'Peer-reviewed proceedings of multidisciplinary conferences and symposia.',
    issn: null,
  },
]

export const getSeries = (slug: string) => series.find((s) => s.slug === slug)
