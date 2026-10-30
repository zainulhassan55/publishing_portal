import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { IssuePage, type ArchiveRow, type IssueArticle, type IssueSectionRow } from '@/components/mockup/IssuePage'
import { JournalHome, type HomeArticle } from '@/components/mockup/JournalHome'
import { JournalMasthead } from '@/components/mockup/JournalMasthead'
import { JournalStaticPage } from '@/components/mockup/JournalStaticPage'
import { JsonLd } from '@/components/seo/JsonLd'
import { articlesForJournal, currentIssue, getArticles, issueArchive } from '@/data/content'
import { getJournal, getJournalPage, journalCode, journalPageNeighbours, journalSubmitHref, journalsOnly, magazines } from '@/data/registry'
import { authorsShort, clampText, formatDate, formatMonthYear, volumeIssueLabel } from '@/lib/format'
import { journalJsonLd } from '@/lib/jsonld'
import { withSharing } from '@/lib/metadata'
import { getPublication, groupOf, mastheadFor, sideGroupsFor, toPageBlocks } from '@/lib/publication'
import type { Article } from '@/types/publishing'

/**
 * The pages of a journal or a magazine. Both are OJS journals and render the
 * same way; they differ only in their section of the site (/journals or
 * /magazines), so each route file under those sections builds its handlers
 * here with its kind. `getPublication` refuses a slug of the other kind, so
 * /journals/sst and /magazines/ijic are 404s.
 *
 * Every page is refreshed on the server rather than fixed at build. Published
 * papers arrive through the scheduled harvest and the admin show/hide gate,
 * both of which purge the page cache (src/lib/articles/purge.ts); the routes'
 * hourly `revalidate` is the safety net for when that purge is missed.
 */
export type PeriodicalKind = 'journal' | 'magazine'

type SlugParams = { params: Promise<{ slug: string }> }
type PageParams = { params: Promise<{ slug: string; pageId: string }> }

const titlesOf = (kind: PeriodicalKind) => (kind === 'magazine' ? magazines : journalsOnly)
const slugParams = (kind: PeriodicalKind) => () => titlesOf(kind).map((j) => ({ slug: j.slug }))

/** The publication and its journal record, or undefined when the slug is not of this kind. */
function lookup(kind: PeriodicalKind, slug: string) {
  const pub = getPublication(kind, slug)
  const journal = getJournal(slug)
  return pub && journal ? { pub, journal, base: `/${kind}s/${pub.slug}` } : undefined
}

/* -------------------------------------------------------------------------- */
/* Home                                                                       */
/* -------------------------------------------------------------------------- */

export function homeRoute(kind: PeriodicalKind) {
  async function generateMetadata({ params }: SlugParams): Promise<Metadata> {
    const found = lookup(kind, (await params).slug)
    if (!found) return {}
    const { journal, base } = found
    const title = `${journal.title} (${journalCode(journal)})`
    return withSharing({
      title,
      description: clampText(journal.scope),
      alternates: { canonical: base },
      openGraph: { type: 'website', title, description: clampText(journal.scope), url: base },
    })
  }

  async function Page({ params }: SlugParams) {
    const { slug } = await params
    const found = lookup(kind, slug)
    if (!found) notFound()
    const { pub, journal } = found

    const masthead = mastheadFor(pub, 'home', true)

    const items: HomeArticle[] = (await articlesForJournal(slug)).slice(0, 5).map((a) => ({
      id: a.id,
      href: `/articles/${a.slug}`,
      type: a.type,
      title: a.title,
      authorLine: authorsShort(a.authors.map((x) => x.name)),
      meta: [`Vol. ${a.volume}, Issue ${a.issue}`, a.pages ? `pp. ${a.pages}` : '', formatDate(a.publishedIso), a.doi ? `doi.org/${a.doi}` : '']
        .filter(Boolean)
        .join(' · '),
    }))

    return (
      <>
        <JsonLd data={journalJsonLd(journal)} />
        <JournalHome
          masthead={masthead}
          topics={journal.topics}
          aimsHref={pub.pageHref('aims-scope')}
          listTitle="Latest articles"
          listHref="/search?tab=articles"
          items={items}
          emptyText={null}
          editorsLabel={journal.profile.editorsLabel}
          editors={journal.profile.editors}
          editorsNote={journal.profile.editorsNote}
          boardHref={pub.pageHref('editorial-board')}
          cta={{
            title: `Submit to ${pub.code}`,
            text: 'Submissions are accepted year-round, with continuous publication following acceptance and production.',
            label: kind === 'magazine' ? 'Submit an article' : 'Submit a manuscript',
            href: pub.pageHref('submit'),
            secondary: { label: 'Read the author guidelines first', href: pub.pageHref('author-guidelines') },
          }}
          groups={masthead.groups}
        />
      </>
    )
  }

  return { generateStaticParams: slugParams(kind), generateMetadata, Page }
}

/* -------------------------------------------------------------------------- */
/* Static pages                                                               */
/* -------------------------------------------------------------------------- */

export function contentPageRoute(kind: PeriodicalKind) {
  const generateStaticParams = () =>
    titlesOf(kind).flatMap((journal) => (journal.pages ?? []).map((page) => ({ slug: journal.slug, pageId: page.id })))

  async function generateMetadata({ params }: PageParams): Promise<Metadata> {
    const { slug, pageId } = await params
    const found = lookup(kind, slug)
    const page = getJournalPage(slug, pageId)
    if (!found || !page) return {}
    const { journal, base } = found

    return withSharing({
      title: `${page.title} — ${journalCode(journal)}`,
      description: page.summary,
      alternates: { canonical: `${base}/${pageId}` },
      openGraph: { type: 'article', title: `${page.title} — ${journal.title}`, description: page.summary, url: `${base}/${pageId}` },
    })
  }

  async function Page({ params }: PageParams) {
    const { slug, pageId } = await params
    const found = lookup(kind, slug)
    // The publisher's path list gives every journal a /submit page; submission itself lives at /submit.
    if (pageId === 'submit' && found) redirect(journalSubmitHref(slug))

    const page = getJournalPage(slug, pageId)
    if (!page || !found) notFound()
    const { pub, journal, base } = found

    const href = `${base}/${pageId}`
    const group = groupOf(pub, href)
    const { previous, next } = journalPageNeighbours(slug, pageId)

    const cta =
      pageId === 'special-issue-guidelines'
        ? {
            title: 'Propose a special issue',
            text: 'Send your proposal online, following the special issue guidelines.',
            label: 'Proposal form',
            href: '/editors/special-issues/form',
          }
        : pageId === 'editorial-board' && journal.profile.editors.length === 0
          ? {
              title: 'Join the editorial board',
              text: `Apply to serve on the ${pub.code} editorial board.`,
              label: 'Application form',
              href: '/editors/form',
            }
          : {
              title: 'Ready to submit?',
              text: `${pub.code} accepts submissions year-round.`,
              label: kind === 'magazine' ? 'Submit an article' : 'Submit a manuscript',
              href: journalSubmitHref(slug),
            }

    return (
      <JournalStaticPage
        masthead={mastheadFor(pub, group)}
        group={group}
        title={page.title}
        blocks={toPageBlocks(page.blocks)}
        side={sideGroupsFor(pub, href)}
        prev={previous ? { href: pub.pageHref(previous.id), title: previous.label } : undefined}
        next={next ? { href: pub.pageHref(next.id), title: next.label } : undefined}
        cta={cta}
      />
    )
  }

  return { generateStaticParams, generateMetadata, Page }
}

/* -------------------------------------------------------------------------- */
/* Issue archive                                                              */
/* -------------------------------------------------------------------------- */

export function issuesRoute(kind: PeriodicalKind) {
  async function generateMetadata({ params }: SlugParams): Promise<Metadata> {
    const found = lookup(kind, (await params).slug)
    if (!found) return {}
    const { journal, base } = found
    return withSharing({
      title: `Issue archive — ${journalCode(journal)}`,
      description: `All published volumes and issues of ${journal.title}, newest first.`,
      alternates: { canonical: `${base}/issues` },
    })
  }

  async function Page({ params }: SlugParams) {
    const { slug } = await params
    const found = lookup(kind, slug)
    if (!found) notFound()
    const { pub, base } = found

    const current = currentIssue(slug)
    const issues = issueArchive(slug)
    // Nothing published yet: there is no archive to show.
    if (issues.length === 0) redirect(base)
    const masthead = mastheadFor(pub, 'home')

    // Volumes newest first, each with its issues in the order issueArchive gives.
    const volumes = [...new Set(issues.map((i) => i.volume))].map((volume) => {
      const inVolume = issues.filter((i) => i.volume === volume)
      return {
        volume,
        year: inVolume[0].year,
        rows: inVolume.map((i) => {
          const count = i.sections.reduce((n, s) => n + s.articleIds.length, 0)
          return {
            label: `Issue ${i.number} · ${i.publishedIso ? formatMonthYear(i.publishedIso) : i.year}`,
            meta: `${count} ${count === 1 ? 'article' : 'articles'}`,
            current: i === current,
          }
        }),
      }
    })

    const cur = { bar: 'var(--accent,#1D5DA8)', bg: 'var(--surface-2,#F5F6F7)', weight: 600 }
    const oth = { bar: 'var(--line,#DCE1E6)', bg: 'transparent', weight: 400 }

    return (
      <>
        <JournalMasthead {...masthead} />
        <div id="main-content" style={{ maxWidth: 1280, margin: '0 auto', padding: '40px var(--shell-pad) 0' }}>
          <section id="archive" style={{ maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h1 style={{ margin: 0, fontSize: 13, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink,#101B27)', paddingBottom: 10, borderBottom: '2px solid var(--accent,#0B7265)' }}>Issue archive</h1>
            {volumes.map((v) => (
              <div key={v.volume} style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, color: 'var(--ink,#101B27)', padding: '8px 0' }}>{v.year}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-3,#3C4854)', padding: '4px 0 8px' }}>Volume {v.volume}</span>
                {v.rows.map((i) => {
                  const st = i.current ? cur : oth
                  return (
                    <div key={i.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 12px', borderLeft: `2px solid ${st.bar}`, background: st.bg, fontSize: 14 }}>
                      <span style={{ color: 'var(--ink,#101B27)', fontWeight: st.weight }}>{i.label}</span>
                      <span style={{ color: 'var(--muted,#505C68)', fontSize: 13 }}>{i.meta}</span>
                    </div>
                  )
                })}
              </div>
            ))}
            <Link href={`${base}/current-issue`} style={{ fontSize: 14, fontWeight: 500 }}>
              View the current issue
            </Link>
          </section>
        </div>
      </>
    )
  }

  return { generateStaticParams: slugParams(kind), generateMetadata, Page }
}

/* -------------------------------------------------------------------------- */
/* Current issue                                                              */
/* -------------------------------------------------------------------------- */

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

export function currentIssueRoute(kind: PeriodicalKind) {
  async function generateMetadata({ params }: SlugParams): Promise<Metadata> {
    const { slug } = await params
    const found = lookup(kind, slug)
    if (!found) return {}
    const { journal, base } = found

    const code = journalCode(journal)
    const issue = currentIssue(slug)
    const title = issue ? `${volumeIssueLabel(issue.volume, issue.number)} — ${code}` : `Current issue — ${code}`

    return withSharing({
      title,
      description: issue
        ? `Table of contents for ${volumeIssueLabel(issue.volume, issue.number)} of ${journal.title}.`
        : `Articles published in ${journal.title}.`,
      alternates: { canonical: `${base}/current-issue` },
    })
  }

  async function Page({ params }: SlugParams) {
    const { slug } = await params
    const found = lookup(kind, slug)
    if (!found) notFound()
    const { pub, base } = found

    // Until OJS publishes an issue there is no table of contents to show.
    const issue = currentIssue(slug)
    if (!issue) redirect(base)

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

  return { generateStaticParams: slugParams(kind), generateMetadata, Page }
}
