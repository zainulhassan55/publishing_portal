import type { Metadata } from 'next'
import { AsideBox, AsideLinks, PublisherPage } from '@/components/content/PublisherPage'
import { SpecialIssueForm } from '@/components/forms/SpecialIssueForm'
import { specialIssueGuidelines, specialIssueLead } from '@/data/publisher'
import { journalCode, journals } from '@/data/registry'

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
      <section id="proposal-form" aria-labelledby="proposal-form-h" style={{ scrollMarginTop: 24, marginTop: 8 }}>
        <h2 id="proposal-form-h" style={{ margin: '0 0 6px', fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600 }}>Propose a special issue</h2>
        <p style={{ margin: '0 0 20px', fontSize: 15, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)' }}>Fields marked * are required. You can also send your proposal by email.</p>
        <SpecialIssueForm journals={journals.map((j) => ({ value: j.slug, label: `${j.title} (${journalCode(j)})` }))} />
      </section>
    </PublisherPage>
  )
}
