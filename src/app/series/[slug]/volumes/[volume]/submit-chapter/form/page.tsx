import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ChapterSubmissionForm } from '@/components/forms/ChapterSubmissionForm'
import { FormPage, formPageRobots } from '@/components/forms/FormPage'
import { JournalMasthead } from '@/components/mockup/JournalMasthead'
import { getSeries } from '@/data/registry'
import { requireMemberPage } from '@/lib/auth/require'
import { volumeWithOpenCall } from '@/lib/books/volumes'
import { getPublication, mastheadFor } from '@/lib/publication'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ slug: string; volume: string }> }

export const metadata: Metadata = { title: 'Submit a chapter', robots: formPageRobots }

/** The chapter submission form for one volume. A closed call is a 404, as on the call page. */
export default async function SubmitChapterFormPage({ params }: Params) {
  const { slug, volume } = await params
  const series = getSeries(slug)
  const pub = getPublication('series', slug)
  const v = series ? await volumeWithOpenCall(slug, volume) : undefined
  if (!series || !pub || !v) notFound()

  const call = `/series/${slug}/volumes/${v.slug}/submit-chapter`
  const user = await requireMemberPage(`${call}/form`)

  return (
    <>
      <JournalMasthead {...mastheadFor(pub, 'Contributors')} />
      <FormPage
        trail={[
          { label: series.code, href: `/series/${slug}` },
          { label: `Call for chapters: ${v.title}`, href: call },
        ]}
        kicker="Submit a chapter"
        title={v.title}
        intro={`${series.title}. Upload an anonymised manuscript and a separate title page with the author details.`}
        back={{ label: 'call for chapters', href: call }}
        user={user}
      >
        <ChapterSubmissionForm series={slug} volume={v.slug} volumeTitle={v.title} />
      </FormPage>
    </>
  )
}
