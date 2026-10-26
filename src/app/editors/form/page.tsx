import type { Metadata } from 'next'
import { EditorialApplicationForm } from '@/components/forms/EditorialApplicationForm'
import { FormPage, formPageRobots } from '@/components/forms/FormPage'
import { publicationOptions } from '@/data/registry'
import { requireMemberPage } from '@/lib/auth/require'

export const metadata: Metadata = { title: 'Editorial board application', robots: formPageRobots }

export default async function BoardFormPage() {
  const user = await requireMemberPage('/editors/form')
  return (
    <FormPage
      trail={[{ label: 'For editors', href: '/editors' }]}
      kicker="For editors"
      title="Editorial board application"
      intro="Tell us which journal or book series you are interested in, your affiliation, areas of expertise, and a brief academic profile."
      back={{ label: 'information for editors', href: '/editors' }}
      user={user}
    >
      <EditorialApplicationForm targets={publicationOptions()} role="board" />
    </FormPage>
  )
}
