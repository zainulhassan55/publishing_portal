import type { PublicationCardData } from '@/components/content/PublicationCard'
import type { JournalMastheadProps, PublicationKind } from '@/components/mockup/JournalMasthead'
import { electronicIssn } from '@/data/issn'
import type { PageBlock, SideGroup } from '@/components/mockup/JournalStaticPage'
import {
  getJournal,
  getSeries,
  journalCode,
  journalMenuGroups,
  journalPageHref,
  journalSlugs,
  seriesMenuGroups,
  seriesSlugs,
  seriesPageHref,
  type ResolvedMenuGroup,
} from '@/data/registry'
import { subjectFor, subjects } from '@/data/subjects'
import { anchorIds } from '@/lib/format'
import type { ContentBlock, JournalPage, PublicationProfile } from '@/types/content'

/**
 * One view of a journal or a book series, so the masthead, home page and
 * static pages are built the same way for both.
 */
export type Publication = {
  kind: PublicationKind
  slug: string
  code: string
  title: string
  subject: { label: string; color: string }
  topics: string[]
  profile: PublicationProfile
  pages: JournalPage[]
  groups: ResolvedMenuGroup[]
  pageHref: (pageId: string) => string
}

export function getPublication(kind: PublicationKind, slug: string): Publication | undefined {
  if (kind === 'journal') {
    const j = getJournal(slug)
    if (!j) return undefined
    return {
      kind,
      slug: j.slug,
      code: journalCode(j),
      title: j.title,
      subject: subjectFor(j.slug),
      topics: j.topics,
      profile: j.profile,
      pages: j.pages ?? [],
      groups: journalMenuGroups(j.slug),
      pageHref: (id) => journalPageHref(j.slug, id),
    }
  }
  const s = getSeries(slug)
  if (!s) return undefined
  return {
    kind,
    slug: s.slug,
    code: s.code,
    title: s.title,
    subject: subjects[s.subjectKey],
    topics: s.topics,
    profile: s.profile,
    pages: s.pages,
    groups: seriesMenuGroups(s.slug),
    pageHref: (id) => seriesPageHref(s.slug, id),
  }
}

export function mastheadFor(pub: Publication, tab: string, showIntro = false): JournalMastheadProps {
  return {
    j: { slug: pub.slug, code: pub.code, title: pub.title, subject: pub.subject.label, color: pub.subject.color },
    kind: pub.kind,
    tab,
    showIntro,
    groups: pub.groups.map((g) => ({ group: g.label, links: g.items.map((i) => ({ title: i.label, href: i.href })) })),
    profile: {
      tile: pub.profile.tile,
      kicker: pub.profile.kicker,
      badges: pub.profile.badges,
      intro: pub.profile.intro,
      ctas: pub.profile.ctas.map((c) => ({ label: c.label, href: pub.pageHref(c.pageId) })),
      facts: pub.profile.facts,
    },
  }
}

/** The menu group that holds `href`, so the masthead tab and the page kicker agree. */
export const groupOf = (pub: Publication, href: string) =>
  pub.groups.find((g) => g.items.some((i) => i.href === href))?.label ?? 'About'

export const sideGroupsFor = (pub: Publication, currentHref: string): SideGroup[] =>
  pub.groups.map((g) => ({
    group: g.label,
    links: g.items.map((i) => ({ title: i.label, href: i.href, current: i.href === currentHref })),
  }))

/**
 * Content blocks to the numbered sections the static page renders. A block with
 * no title has no heading and no number, and later blocks are numbered as if it
 * were not there.
 */
export function toPageBlocks(blocks: ContentBlock[]): PageBlock[] {
  let n = 0
  const ids = anchorIds(blocks.map((b) => b.title))
  return blocks.map((b, i) => {
    const numbered = b.title !== ''
    if (numbered) n += 1
    const subIds = anchorIds((b.subsections ?? []).map((s) => s.title))
    return {
      id: ids[i],
      n: numbered ? n : 0,
      h: b.title,
      lead: b.lead ?? '',
      p: b.paragraphs ?? [],
      ul: b.bullets ?? [],
      topics: b.topicList ?? false,
      closing: b.closing ?? [],
      table: b.table ? { head: b.table.head, rows: b.table.rows } : null,
      downloads: b.downloads ?? [],
      sub: (b.subsections ?? []).map((s, k) => ({
        id: `${ids[i]}--${subIds[k]}`,
        n: `${n}.${k + 1}`,
        h: s.title,
        p: s.paragraphs ?? [],
        ul: s.bullets ?? [],
        table: s.table ? { head: s.table.head, rows: s.table.rows } : null,
      })),
    }
  })
}

/** Card data for every journal and series, in portfolio order, for the home page and /journals. */
export function publicationCards(): { journals: (PublicationCardData & { slug: string })[]; series: (PublicationCardData & { slug: string })[] } {
  const card = (kind: PublicationKind, slug: string): PublicationCardData & { slug: string } => {
    const pub = getPublication(kind, slug)!
    const eIssn = kind === 'journal' ? electronicIssn(slug) : null
    return {
      slug,
      href: kind === 'journal' ? `/journals/${slug}` : `/series/${slug}`,
      code: pub.code,
      title: pub.title,
      color: pub.subject.color,
      subject: pub.subject.label,
      cover: pub.profile.cover,
      tile: pub.profile.tile,
      identifier: kind === 'journal' ? `ISSN: ${eIssn ?? 'applied for'}` : 'ISBN: assigned per volume',
      aboutLabel: kind === 'journal' ? 'About journal' : 'About series',
      action: kind === 'journal' ? { label: 'Submit', href: pub.pageHref('submit') } : { label: 'Propose', href: pub.pageHref('propose-volume') },
    }
  }
  return {
    journals: journalSlugs.map((s) => card('journal', s)),
    series: seriesSlugs.map((s) => card('series', s)),
  }
}
