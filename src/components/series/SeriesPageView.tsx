import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FormLauncher } from '@/components/forms/FormLauncher'
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
      prev={previous ? { href: pub.pageHref(previous.id), title: previous.label } : undefined}
      next={next ? { href: pub.pageHref(next.id), title: next.label } : undefined}
      cta={{
        title: 'Have a volume in mind?',
        text: `${pub.code} welcomes proposals throughout the year.`,
        label: 'Propose a volume',
        href: `${pub.pageHref('propose-volume')}/form`,
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
        <FormLauncher
          id="proposal-form"
          href={`${href}/form`}
          title="Proposal form"
          description="You can send your proposal through the form instead of by email. Have your proposed title, format, table of contents, contributor biographies and timeline ready."
        />
      ) : null}
    </JournalStaticPage>
  )
}
