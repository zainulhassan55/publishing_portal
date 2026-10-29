import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SeriesPageView } from '@/components/series/SeriesPageView'
import { getSeries, series } from '@/data/registry'
import { withSharing } from '@/lib/metadata'

export function generateStaticParams() {
  return series.map((s) => ({ slug: s.slug }))
}

/**
 * Volumes come from the database, so this page is refreshed on the server. The
 * admin volume screen purges it on every change; the hour is the safety net.
 */
export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const item = getSeries(slug)
  if (!item) return {}
  return withSharing({
    title: `Published volumes — ${item.code}`,
    description: `Volumes published in ${item.title}.`,
    alternates: { canonical: `/series/${slug}/volumes` },
  })
}

export default async function SeriesVolumesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!getSeries(slug)) notFound()
  return <SeriesPageView slug={slug} pageId="volumes" />
}
