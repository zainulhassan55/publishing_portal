import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BookProposalForm } from '@/components/forms/BookProposalForm'
import { FormPage, formPageRobots } from '@/components/forms/FormPage'
import { JournalMasthead } from '@/components/mockup/JournalMasthead'
import { requireMemberPage } from '@/lib/auth/require'
import { seriesPageHref } from '@/data/registry'
import { getPublication, mastheadFor } from '@/lib/publication'

type Params = { params: Promise<{ slug: string; pageId: string }> }

/** Of the series pages, only "Propose a volume" has a form. */
const FORM_PAGE = 'propose-volume'

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const pub = getPublication('series', slug)
  return { title: pub ? `Propose a volume — ${pub.code}` : 'Propose a volume', robots: formPageRobots }
}

export default async function ProposeVolumeFormPage({ params }: Params) {
  const { slug, pageId } = await params
  const pub = getPublication('series', slug)
  if (!pub || pageId !== FORM_PAGE) notFound()

  const guidance = seriesPageHref(slug, FORM_PAGE)
  const user = await requireMemberPage(`${guidance}/form`)

  return (
    <>
      <JournalMasthead {...mastheadFor(pub, 'Contributors')} />
      <FormPage
        trail={[
          { label: pub.code, href: `/series/${slug}` },
          { label: 'Propose a volume', href: guidance },
        ]}
        kicker={`${pub.code} · Book proposal`}
        title={`Propose a volume for ${pub.code}`}
        intro="Monographs, edited volumes and conference proceedings are all welcome. Give the proposed title and format, the scholarly contribution, a preliminary table of contents, and your timeline."
        back={{ label: 'proposal requirements', href: guidance }}
        user={user}
      >
        <BookProposalForm series={pub.slug} code={pub.code} />
      </FormPage>
    </>
  )
}
