import type { Metadata } from 'next'
import { AsideBox, AsideLinks, PublisherPage } from '@/components/content/PublisherPage'
import { EditorialApplicationForm } from '@/components/forms/EditorialApplicationForm'
import { becomeReviewer, reviewerGuidelines, reviewersLead } from '@/data/publisher'
import { publicationOptions } from '@/data/registry'

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
            <a href="#apply" style={{ background: 'var(--accent,#1D5DA8)', color: '#fff', padding: '9px 12px', borderRadius: 3, fontSize: 14, fontWeight: 500, textAlign: 'center', textDecoration: 'none' }}>
              Apply online
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
      <section id="apply" aria-labelledby="apply-h" style={{ scrollMarginTop: 24, marginTop: 8 }}>
        <h2 id="apply-h" style={{ margin: '0 0 6px', fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600 }}>Reviewer application</h2>
        <p style={{ margin: '0 0 20px', fontSize: 15, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)' }}>Fields marked * are required. You can also apply by email.</p>
        <EditorialApplicationForm targets={publicationOptions()} role="reviewer" />
      </section>
    </PublisherPage>
  )
}
