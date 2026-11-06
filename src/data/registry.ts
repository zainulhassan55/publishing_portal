import type { JournalDetail, JournalMenuGroup, JournalPage } from '@/types/content'
import type { Series } from '@/types/publishing'
import { jaaiseDetail } from './journals/jaaise'
import { jdmieDetail } from './journals/jdmie'
import { retaDetail } from './journals/reta'
import { ticrDetail } from './journals/ticr'
import { tqcisDetail } from './journals/tqcis'
import { dtcrDetail } from './magazines/dtcr'
import { aiisc } from './series/aiisc'
import { lnmr } from './series/lnmr'
import { subjectFor } from './subjects'
import { currentSlug } from '@/lib/ojs/contexts'

/**
 * Single ordered source of truth for the portfolio. Everything downstream —
 * routes, sitemap, search index, nav menus — derives from these arrays, so adding
 * a journal or series is one import plus one entry.
 */
export const journals: JournalDetail[] = [ticrDetail, jdmieDetail, tqcisDetail, jaaiseDetail, retaDetail, dtcrDetail]

/*
 * `journals` is every title OJS hosts, magazines included: a magazine has
 * articles, issues and submissions exactly like a journal, so article, account
 * and submission code reads this one list. Pages that present the portfolio
 * split it with the two lists below, and link through `periodicalBase`.
 */

export const isMagazine = (j: JournalDetail) => j.kind === 'magazine'

/** The journals proper, for the Journals menu, page and cards. */
export const journalsOnly = journals.filter((j) => !isMagazine(j))

export const magazines = journals.filter(isMagazine)

export const magazineSlugs = magazines.map((m) => m.slug)

export const journalSlugs = journals.map((j) => j.slug)

const journalBySlug = new Map(journals.map((j) => [j.slug, j]))

/** A journal or magazine by slug, in any case. A pre-rename slug (`ijic`) finds the renamed title. */
export const getJournal = (slug: string): JournalDetail | undefined => journalBySlug.get(currentSlug(slug))

/** Root path of a journal or magazine: /journals/ticr, /magazines/dtcr. */
export const periodicalBase = (slug: string) => {
  const j = getJournal(slug)
  return `/${j && isMagazine(j) ? 'magazines' : 'journals'}/${j?.slug ?? slug.toLowerCase()}`
}

/** The journal's code (TICR, DTCR). `shortTitle` has always held it. */
export const journalCode = (j: JournalDetail) => j.shortTitle ?? j.slug.toUpperCase()

export const journalSubject = (slug: string) => subjectFor(slug)

export const getJournalPage = (slug: string, pageId: string): JournalPage | undefined =>
  getJournal(slug)?.pages?.find((p) => p.id === pageId)

/**
 * Reading order for prev/next: the sub-navigation's order, group by group, then
 * any page the menu does not list. Following the stored `pages` array instead
 * sent "Previous" from a Contributors page to an About page.
 */
function menuOrder(menu: JournalMenuGroup[], pages: JournalPage[]): JournalPage[] {
  const ids = menu.flatMap((g) => g.items.flatMap((item) => (item.kind === 'page' ? [item.id] : [])))
  const listed = ids.flatMap((id) => pages.filter((p) => p.id === id))
  return [...listed, ...pages.filter((p) => !ids.includes(p.id))]
}

/** Page order within a journal, used for prev/next navigation. */
export const journalPageOrder = (slug: string): JournalPage[] => menuOrder(journalMenu, getJournal(slug)?.pages ?? [])

export const journalPageNeighbours = (slug: string, pageId: string) => neighbours(journalPageOrder(slug), pageId)

function neighbours(pages: JournalPage[], pageId: string) {
  const i = pages.findIndex((p) => p.id === pageId)
  return {
    previous: i > 0 ? pages[i - 1] : undefined,
    next: i >= 0 && i < pages.length - 1 ? pages[i + 1] : undefined,
  }
}

/* -------------------------------------------------------------------------- */
/* Sub-navigation                                                             */
/* -------------------------------------------------------------------------- */

const journalMenu: JournalMenuGroup[] = [
  {
    label: 'About',
    items: [
      { kind: 'page', id: 'aims-scope' },
      { kind: 'page', id: 'editorial-board' },
      { kind: 'page', id: 'indexing-abstracting' },
      { kind: 'page', id: 'contact' },
    ],
  },
  {
    label: 'Articles',
    items: [{ kind: 'page', id: 'articles-in-press' }],
  },
  {
    label: 'Authors',
    items: [
      { kind: 'page', id: 'author-guidelines' },
      { kind: 'submit', label: 'Submit a manuscript' },
      { kind: 'page', id: 'peer-review-ethics' },
      { kind: 'page', id: 'open-access-fees' },
      { kind: 'page', id: 'special-issue-guidelines' },
    ],
  },
]

const seriesMenu: JournalMenuGroup[] = [
  {
    label: 'About',
    items: [
      { kind: 'page', id: 'aims-scope' },
      { kind: 'page', id: 'editorial-board' },
      { kind: 'page', id: 'indexing-abstracting' },
      { kind: 'page', id: 'contact' },
    ],
  },
  {
    label: 'Contributors',
    items: [
      { kind: 'page', id: 'propose-volume' },
      { kind: 'page', id: 'author-editor-guidelines' },
      { kind: 'page', id: 'peer-review-ethics' },
      { kind: 'page', id: 'open-access-fees' },
    ],
  },
  {
    label: 'Volumes',
    items: [{ kind: 'page', id: 'volumes' }],
  },
]

/**
 * Sub-navigation groups. Each menu carries the group structure; this resolves
 * every entry to a concrete label and href so the masthead menu, the page
 * sidebar and the home page's information panel render from one source.
 */
export type ResolvedMenuItem = { label: string; href: string; external?: boolean }
export type ResolvedMenuGroup = { label: string; items: ResolvedMenuItem[] }

function resolveMenu(menu: JournalMenuGroup[], pages: JournalPage[], base: string, submitHref: string): ResolvedMenuGroup[] {
  return menu.map((group) => ({
    label: group.label,
    items: group.items.flatMap<ResolvedMenuItem>((item) => {
      if (item.kind === 'submit') return [{ label: item.label, href: submitHref }]
      if (item.kind === 'archive') return [{ label: item.label, href: `${base}/issues` }]
      if (item.kind === 'link') return [{ label: item.label, href: item.href }]
      const page = pages.find((p) => p.id === item.id)
      return page ? [{ label: page.label, href: `${base}/${page.id}` }] : []
    }),
  }))
}

export const journalSubmitHref = (slug: string) => `/submit?journal=${slug}`

export const journalMenuGroups = (slug: string): ResolvedMenuGroup[] => {
  const journal = getJournal(slug)
  if (!journal) return []
  const groups = resolveMenu(journalMenu, journal.pages ?? [], periodicalBase(slug), journalSubmitHref(slug))
  if (!isMagazine(journal)) return groups
  // A magazine publishes articles, not manuscripts, as its buttons already say.
  return groups.map((g) => ({ ...g, items: g.items.map((i) => (i.label === 'Submit a manuscript' ? { ...i, label: 'Submit an article' } : i)) }))
}

/** Href of a journal or magazine page id, including `submit`, which is not a static page. */
export const journalPageHref = (slug: string, pageId: string) =>
  pageId === 'submit' ? journalSubmitHref(slug) : `${periodicalBase(slug)}/${pageId}`

/* -------------------------------------------------------------------------- */
/* Book series                                                                */
/* -------------------------------------------------------------------------- */

export const series: Series[] = [aiisc, lnmr]

export const seriesSlugs = series.map((s) => s.slug)

export const getSeries = (slug: string) => series.find((s) => s.slug === slug.toLowerCase())

/** A volume announced in a series' data file, by its URL slug. */
export const getSeriesVolume = (slug: string, volumeSlug: string) => getSeries(slug)?.volumes?.find((v) => v.slug === volumeSlug)

/** "A (Univ, Country) and B (Univ, Country)", as the publisher writes the editor line. */
export const volumeEditorLine = (editors: { name: string; affiliation: string }[]) => {
  const parts = editors.map((e) => (e.affiliation ? `${e.name} (${e.affiliation})` : e.name))
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : (parts[0] ?? '')
}

export const getSeriesPage = (slug: string, pageId: string): JournalPage | undefined =>
  getSeries(slug)?.pages.find((p) => p.id === pageId)

export const seriesPageNeighbours = (slug: string, pageId: string) => neighbours(menuOrder(seriesMenu, getSeries(slug)?.pages ?? []), pageId)

export const seriesPageHref = (slug: string, pageId: string) => `/series/${slug}/${pageId}`

export const seriesMenuGroups = (slug: string): ResolvedMenuGroup[] => {
  const item = getSeries(slug)
  if (!item) return []
  return resolveMenu(seriesMenu, item.pages, `/series/${slug}`, seriesPageHref(slug, 'propose-volume'))
}

/** Every journal, magazine and series as form options, in that order. */
export const publicationOptions = () => [
  ...journalsOnly.map((j) => ({ value: j.slug, label: `${j.title} (${journalCode(j)})` })),
  ...magazines.map((j) => ({ value: j.slug, label: `${j.title} (${journalCode(j)})` })),
  ...series.map((s) => ({ value: s.slug, label: `${s.title} (${s.code})` })),
]
