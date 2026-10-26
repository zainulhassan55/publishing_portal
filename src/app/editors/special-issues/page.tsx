import type { Metadata } from 'next'
import { AsideBox, AsideLinks, PublisherPage } from '@/components/content/PublisherPage'
import { FormLauncher } from '@/components/forms/FormLauncher'
import { specialIssueGuidelines, specialIssueLead } from '@/data/publisher'
import { journals } from '@/data/registry'

export const metadata: Metadata = {
  title: 'Special issue guidelines',
  description: specialIssueLead,
  alternates: { canonical: '/editors/special-issues' },
}

export default function SpecialIssuesPage() {
  return (
    <PublisherPage
      trail={[{ label: 'For editors', href: '/editors' }, { label: 'Special issue guidelines' }]}
      kicker="For editors"
      title="Special Issue Guidelines"
      lead={specialIssueLead}
      sections={specialIssueGuidelines}
      aside={
        <AsideBox title="Journals">
          <AsideLinks
            links={journals.map((j) => ({ label: j.title, href: `/journals/${j.slug}/special-issue-guidelines` }))}
          />
        </AsideBox>
      }
    >
      <FormLauncher
        id="proposal-form"
        href="/editors/special-issues/form"
        title="Propose a special issue"
        description="The form asks for the target journal, proposed title, aims, scope and topics, the guest editors with brief biographies, and your timeline, expected number of submissions and promotion plan."
      />
    </PublisherPage>
  )
}
