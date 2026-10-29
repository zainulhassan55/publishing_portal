import type { Metadata } from 'next'
import { SeriesPageView } from '@/components/series/SeriesPageView'
import { getSeries, getSeriesPage, series } from '@/data/registry'
import { withSharing } from '@/lib/metadata'

export function generateStaticParams() {
  // `volumes` has its own route, which lists the published volumes from the database.
  return series.flatMap((s) => s.pages.filter((p) => p.id !== 'volumes').map((page) => ({ slug: s.slug, pageId: page.id })))
}

export const dynamicParams = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; pageId: string }>
}): Promise<Metadata> {
  const { slug, pageId } = await params
  const item = getSeries(slug)
  const page = getSeriesPage(slug, pageId)
  if (!item || !page) return {}

  return withSharing({
    title: `${page.title} — ${item.code}`,
    description: page.summary,
    alternates: { canonical: `/series/${slug}/${pageId}` },
    openGraph: {
      type: 'article',
      title: `${page.title} — ${item.title}`,
      description: page.summary,
      url: `/series/${slug}/${pageId}`,
    },
  })
}

export default async function SeriesContentPage({ params }: { params: Promise<{ slug: string; pageId: string }> }) {
  const { slug, pageId } = await params
  return <SeriesPageView slug={slug} pageId={pageId} />
}
