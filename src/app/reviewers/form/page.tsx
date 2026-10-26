import type { Metadata } from 'next'
import { EditorialApplicationForm } from '@/components/forms/EditorialApplicationForm'
import { FormPage, formPageRobots } from '@/components/forms/FormPage'
import { publicationOptions } from '@/data/registry'
import { requireMemberPage } from '@/lib/auth/require'

export const metadata: Metadata = { title: 'Reviewer application', robots: formPageRobots }

export default async function ReviewerFormPage() {
  const user = await requireMemberPage('/reviewers/form')
  return (
    <FormPage
      trail={[{ label: 'For reviewers', href: '/reviewers' }]}
      kicker="For reviewers"
      title="Reviewer application"
      intro="Tell us which journal or book series you would like to review for, your areas of expertise, and a brief academic profile."
      back={{ label: 'reviewer guidelines', href: '/reviewers' }}
      user={user}
    >
      <EditorialApplicationForm targets={publicationOptions()} role="reviewer" />
    </FormPage>
  )
}
