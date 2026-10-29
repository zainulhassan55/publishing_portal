import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { JournalHome, type HomeArticle } from '@/components/mockup/JournalHome'
import { contributorLine } from '@/components/series/SeriesPageView'
import { publishedVolumes } from '@/lib/books/volumes'
import { getSeries, series } from '@/data/registry'
import { clampText, formatDate } from '@/lib/format'
import { VOLUME_FORMATS } from '@/lib/forms/options'
import { getPublication, mastheadFor } from '@/lib/publication'
import { withSharing } from '@/lib/metadata'

export function generateStaticParams() {
  return series.map((s) => ({ slug: s.slug }))
}

/** Volumes come from the database; the admin volume screen purges this page on every change. */
export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const item = getSeries(slug)
  if (!item) return { title: 'Series not found' }

  return withSharing({
    title: `${item.title} (${item.code})`,
    description: clampText(item.scope),
    alternates: { canonical: `/series/${item.slug}` },
  })
}

export default async function SeriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const item = getSeries(slug)
  const pub = getPublication('series', slug)
  if (!item || !pub) notFound()

  const masthead = mastheadFor(pub, 'home', true)
  const empty = item.pages.find((p) => p.id === 'volumes')?.blocks[0]?.paragraphs?.[0] ?? ''
  const items: HomeArticle[] = (await publishedVolumes(slug)).slice(0, 5).map((v) => ({
    id: String(v.id),
    href: `/series/${slug}/volumes/${v.slug}`,
    type: VOLUME_FORMATS.find((f) => f.value === v.format)?.label ?? 'Volume',
    title: v.subtitle ? `${v.title}: ${v.subtitle}` : v.title,
    authorLine: contributorLine(v),
    meta: [v.volumeNumber ? `Volume ${v.volumeNumber}` : '', v.publishedAt ? formatDate(v.publishedAt) : '', v.doi ? `doi.org/${v.doi}` : '']
      .filter(Boolean)
      .join(' · '),
  }))

  return (
    <JournalHome
      masthead={masthead}
      topics={item.topics}
      aimsHref={pub.pageHref('aims-scope')}
      listTitle="Published volumes"
      listHref={pub.pageHref('volumes')}
      items={items}
      emptyText={empty}
      editorsLabel={item.profile.editorsLabel}
      editors={item.profile.editors}
      editorsNote={item.profile.editorsNote}
      boardHref={pub.pageHref('editorial-board')}
      cta={{
        title: `Propose a volume for ${item.code}`,
        text: 'Proposals for monographs, edited volumes and conference proceedings are welcome throughout the year.',
        label: 'Propose a volume',
        href: pub.pageHref('propose-volume'),
        secondary: { label: 'Author and editor guidelines', href: pub.pageHref('author-editor-guidelines') },
      }}
      groups={masthead.groups}
    />
  )
}
