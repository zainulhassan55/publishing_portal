import { journalCode, journalMenuGroups, journals, series, seriesMenuGroups } from '@/data/registry'
import type { JournalPage } from '@/types/content'
import { subjectFor } from '@/data/subjects'
import { getArticles } from '@/data/content'
import { normalise, type ArticleHit, type GuidanceHit, type JournalHit, type SearchIndex } from './search-core'

/**
 * Builds the search index at build time from the same data the pages render.
 *
 * Server-only: it reads the OJS harvest snapshot from disk. The pure matching
 * and faceting functions live in './search-core' so the UI can import those
 * without dragging node:fs into the browser bundle.
 *
 * The whole index ships to the client as data. At a few hundred records that is
 * smaller than one hero image and removes an entire service from the stack — a
 * search server only earns its place once the index outgrows a page payload,
 * which at zero published articles is a long way off.
 */

export async function buildSearchIndex(): Promise<SearchIndex> {
  const articleHits: ArticleHit[] = (await getArticles()).map((article) => {
    const journal = journals.find((j) => j.slug === article.journalSlug)
    const authors = article.authors.map((a) => a.name)
    const journalTitle = journal?.title ?? article.journalSlug
    const code = journal ? journalCode(journal) : article.journalSlug.toUpperCase()

    return {
      kind: 'article',
      id: article.id,
      slug: article.slug,
      title: article.title,
      authors,
      journalSlug: article.journalSlug,
      journalTitle,
      journalCode: code,
      type: article.type,
      year: Number(article.publishedIso.slice(0, 4)),
      publishedIso: article.publishedIso,
      doi: article.doi,
      access: article.access,
      citations: article.metrics?.citations ?? 0,
      downloads: article.metrics?.downloads ?? 0,
      abstract: article.abstract,
      keywords: article.keywords,
      haystack: normalise(
        [article.title, article.abstract, article.keywords.join(' '), authors.join(' '), article.doi, journalTitle, code, article.type].join(' '),
      ),
    }
  })

  const journalHits: JournalHit[] = journals.map((journal) => {
    const subject = subjectFor(journal.slug)
    const code = journalCode(journal)
    return {
      kind: 'journal',
      slug: journal.slug,
      title: journal.title,
      code,
      subject: subject.label,
      subjectColor: subject.color,
      scope: journal.scope,
      haystack: normalise([journal.title, code, subject.label, journal.scope, journal.topics.join(' ')].join(' ')),
    }
  })

  const guidance: GuidanceHit[] = []
  const owners = [
    ...journals.map((j) => ({ slug: j.slug, code: journalCode(j), title: j.title, base: `/journals/${j.slug}`, pages: j.pages ?? [], groups: journalMenuGroups(j.slug) })),
    ...series.map((s) => ({ slug: s.slug, code: s.code, title: s.title, base: `/series/${s.slug}`, pages: s.pages, groups: seriesMenuGroups(s.slug) })),
  ]
  for (const owner of owners) {
    const groupFor = new Map<string, string>()
    for (const group of owner.groups) {
      for (const item of group.items) groupFor.set(item.href, group.label)
    }

    for (const page of owner.pages) {
      const href = `${owner.base}/${page.id}`
      guidance.push({
        kind: 'guidance',
        journalSlug: owner.slug,
        journalCode: owner.code,
        pageId: page.id,
        title: page.title,
        group: groupFor.get(href) ?? 'About',
        href,
        text: page.summary,
        haystack: normalise([page.title, page.label, page.summary, pageText(page), owner.title, owner.code].join(' ')),
      })
    }
  }

  return { articles: articleHits, journals: journalHits, guidance }
}


function pageText(page: JournalPage): string {
  return page.blocks
    .flatMap((b) => [
      b.title,
      ...(b.paragraphs ?? []),
      ...(b.bullets ?? []),
      ...(b.closing ?? []),
      ...(b.table?.rows.flat() ?? []),
      ...(b.subsections ?? []).flatMap((s) => [s.title, ...(s.paragraphs ?? []), ...(s.bullets ?? [])]),
    ])
    .join(' ')
}

export type TypeaheadEntry = { title: string; code: string; href: string; haystack: string }

export type TypeaheadIndex = {
  journals: TypeaheadEntry[]
  articles: TypeaheadEntry[]
  guidance: TypeaheadEntry[]
}

/**
 * Compact index for the header typeahead.
 *
 * The full index carries a haystack per record containing the entire body text
 * of every guidance page — around 210 of them. That is correct for /search,
 * which is one page and needs full-text matching, but the header renders on
 * every route, so shipping it there put the whole site's prose into the payload
 * of each page.
 *
 * A typeahead is matching against what the reader is typing — a journal name, a
 * page title, an article title. Matching the body text of a policy page would
 * surface a result whose visible label does not contain the query, which reads
 * as a bug rather than a feature. So the haystack here is the label and its
 * identifiers only, and full-text matching stays on /search.
 */
export async function buildTypeaheadIndex(): Promise<TypeaheadIndex> {
  const index = await buildSearchIndex()

  return {
    journals: index.journals.map((j) => ({
      title: j.title,
      code: j.code,
      href: `/journals/${j.slug}`,
      haystack: normalise([j.title, j.code, j.subject].join(' ')),
    })),
    articles: index.articles.map((a) => ({
      title: a.title,
      code: a.journalCode,
      href: `/articles/${a.slug}`,
      haystack: normalise([a.title, a.authors.join(' '), a.journalCode, a.doi].join(' ')),
    })),
    guidance: index.guidance.map((g) => ({
      title: g.title,
      code: g.journalCode,
      href: g.href,
      haystack: normalise([g.title, g.journalCode, g.group].join(' ')),
    })),
  }
}

export * from './search-core'
