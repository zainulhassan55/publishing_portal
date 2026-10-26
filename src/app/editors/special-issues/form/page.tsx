import type { Metadata } from 'next'
import { FormPage, formPageRobots } from '@/components/forms/FormPage'
import { SpecialIssueForm } from '@/components/forms/SpecialIssueForm'
import { journalCode, journals } from '@/data/registry'
import { requireMemberPage } from '@/lib/auth/require'

export const metadata: Metadata = { title: 'Propose a special issue', robots: formPageRobots }

export default async function SpecialIssueFormPage() {
  const user = await requireMemberPage('/editors/special-issues/form')
  return (
    <FormPage
      trail={[
        { label: 'For editors', href: '/editors' },
        { label: 'Special issue guidelines', href: '/editors/special-issues' },
      ]}
      kicker="For editors"
      title="Propose a special issue"
      intro="Give the target journal, the proposed title, aims, scope and topics, the guest editors, and your timeline and promotion plan."
      back={{ label: 'special issue guidelines', href: '/editors/special-issues' }}
      user={user}
    >
      <SpecialIssueForm journals={journals.map((j) => ({ value: j.slug, label: `${j.title} (${journalCode(j)})` }))} />
    </FormPage>
  )
}
