import type { Metadata } from 'next'
import { AsideBox, AsideLinks, PublisherPage } from '@/components/content/PublisherPage'
import { FormLauncher } from '@/components/forms/FormLauncher'
import { becomeReviewer, reviewerGuidelines, reviewersLead } from '@/data/publisher'

export const metadata: Metadata = {
  title: 'Reviewer guidelines',
  description: reviewersLead,
  alternates: { canonical: '/reviewers' },
}

export default function ReviewersPage() {
  return (
    <PublisherPage
      trail={[{ label: 'For reviewers' }]}
      kicker="For reviewers"
      title="Reviewer Guidelines"
      lead={reviewersLead}
      sections={[
        ...reviewerGuidelines,
        { id: 'become-a-reviewer', title: 'Become a Reviewer', paragraphs: [becomeReviewer] },
      ]}
      aside={
        <>
          <AsideBox title="Become a reviewer">
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--ink-3,#3C4854)' }}>
              Tell us your affiliation, areas of expertise and a brief academic profile.
            </p>
            <a href="/reviewers/form" style={{ background: 'var(--accent,#1D5DA8)', color: '#fff', padding: '9px 12px', borderRadius: 3, fontSize: 14, fontWeight: 500, textAlign: 'center', textDecoration: 'none' }}>
              Fill the form
            </a>
          </AsideBox>
          <AsideBox title="Related">
            <AsideLinks
              links={[
                { label: 'Peer Review Policy', href: '/policies/peer-review-policy' },
                { label: 'Publication Ethics', href: '/policies/publication-ethics' },
                { label: 'Generative AI Policy', href: '/policies/generative-ai-policy' },
                { label: 'For editors', href: '/editors' },
              ]}
            />
          </AsideBox>
        </>
      }
    >
      <FormLauncher
        id="apply"
        href="/reviewers/form"
        title="Reviewer application"
        description="Tell us which journal or book series you would like to review for, your affiliation, areas of expertise, ORCID iD and a brief academic profile, and upload your CV."
      />
    </PublisherPage>
  )
}
