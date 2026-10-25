import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BookProposalForm } from '@/components/forms/BookProposalForm'
import { JournalStaticPage, type PageListItem } from '@/components/mockup/JournalStaticPage'
import { getSeriesPage, seriesPageNeighbours } from '@/data/registry'
import { openCalls, publishedVolumes, type BookVolume } from '@/lib/books/volumes'
import { formatDate } from '@/lib/format'
import { getPublication, groupOf, mastheadFor, sideGroupsFor, toPageBlocks } from '@/lib/publication'

export const contributorLine = (v: BookVolume) => {
  const editors = v.contributors.filter((c) => c.role === 'editor').map((c) => c.name)
  const authors = v.contributors.filter((c) => c.role === 'author').map((c) => c.name)
  return editors.length ? `${editors.join(', ')} (${editors.length > 1 ? 'eds' : 'ed'}.)` : authors.join(', ')
}

const h2 = { margin: '0 0 6px', fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600 } as const

/** One page of a book series: publisher text, plus volumes, open calls or the proposal form where they belong. */
export async function SeriesPageView({ slug, pageId }: { slug: string; pageId: string }) {
  const page = getSeriesPage(slug, pageId)
  const pub = getPublication('series', slug)
  if (!page || !pub) notFound()

  const href = `/series/${slug}/${pageId}`
  const group = groupOf(pub, href)
  const { previous, next } = seriesPageNeighbours(slug, pageId)
  const wrapPrev = previous ?? pub.pages[pub.pages.length - 1]
  const wrapNext = next ?? pub.pages[0]

  let list: PageListItem[] | undefined
  let calls: BookVolume[] = []
  if (pageId === 'volumes') {
    list = (await publishedVolumes(slug)).map((v) => ({
      href: `/series/${slug}/volumes/${v.slug}`,
      title: v.subtitle ? `${v.title}: ${v.subtitle}` : v.title,
      meta: [v.volumeNumber ? `Volume ${v.volumeNumber}` : '', contributorLine(v), v.publishedAt ? formatDate(v.publishedAt) : '']
        .filter(Boolean)
        .join(' · '),
    }))
    calls = await openCalls(slug)
  }

  return (
    <JournalStaticPage
      masthead={mastheadFor(pub, group)}
      group={group}
      title={page.title}
      blocks={toPageBlocks(page.blocks)}
      side={sideGroupsFor(pub, href)}
      prev={{ href: pub.pageHref(wrapPrev.id), title: wrapPrev.label }}
      next={{ href: pub.pageHref(wrapNext.id), title: wrapNext.label }}
      cta={{
        title: 'Have a volume in mind?',
        text: `${pub.code} welcomes proposals throughout the year.`,
        label: 'Propose a volume',
        href: pageId === 'propose-volume' ? '#proposal-form' : pub.pageHref('propose-volume'),
      }}
      list={list}
    >
      {calls.length > 0 ? (
        <section aria-labelledby="calls-h" style={{ marginTop: 24 }}>
          <h2 id="calls-h" style={h2}>
            Calls for chapters
          </h2>
          {calls.map((v) => (
            <div key={v.id} style={{ padding: '14px 0', borderBottom: '1px solid var(--line,#DCE1E6)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600 }}>{v.title}</span>
              <span style={{ fontSize: 13, color: 'var(--muted,#505C68)' }}>
                {contributorLine(v)}
                {v.cfpDeadline ? ` · Submission deadline ${formatDate(v.cfpDeadline)}` : ''}
              </span>
              <Link href={`/series/${slug}/volumes/${v.slug}/submit-chapter`} style={{ fontSize: 14, fontWeight: 500 }}>
                Read the call and submit a chapter →
              </Link>
            </div>
          ))}
        </section>
      ) : null}
      {pageId === 'propose-volume' ? (
        <section id="proposal-form" aria-labelledby="proposal-form-h" style={{ scrollMarginTop: 24 }}>
          <h2 id="proposal-form-h" style={h2}>
            Proposal form
          </h2>
          <p style={{ margin: '0 0 20px', fontSize: 15, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)' }}>
            You can send your proposal here instead of by email. Fields marked * are required.
          </p>
          <BookProposalForm series={pub.slug} code={pub.code} />
        </section>
      ) : null}
    </JournalStaticPage>
  )
}
