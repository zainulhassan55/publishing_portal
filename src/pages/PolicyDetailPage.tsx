import { Navigate, useParams } from 'react-router-dom'
import Container from '../components/layout/Container'
import PageHero from '../components/layout/PageHero'
import DetailSection from '../components/shared/DetailSection'
import SidebarPanel from '../components/shared/SidebarPanel'
import { policies } from '../data/siteContent'

function PolicyDetailPage() {
  const { slug } = useParams()
  const policy = policies.find((item) => item.slug === slug)

  if (!policy) {
    return <Navigate to="/policies" replace />
  }

  return (
    <>
      <PageHero eyebrow="Policy detail" title={policy.title} description={policy.summary} />

      <section className="bg-paper py-14 sm:py-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <DetailSection title="Policy overview">
                <p>
                  This policy is presented as a clear public document supporting academic
                  credibility, author trust, and indexing readiness. It explains the publishing
                  framework in a transparent and accessible way.
                </p>
              </DetailSection>
              <DetailSection title="Implementation focus">
                <p>
                  Each policy can later expand into full text, anchor sections, guidance notes, and
                  journal-specific references without changing the overall design language.
                </p>
              </DetailSection>
            </div>

            <SidebarPanel title="Related topics">
              <p>Authorship and contributorship</p>
              <p>Conflicts of interest</p>
              <p>Archiving and preservation</p>
            </SidebarPanel>
          </div>
        </Container>
      </section>
    </>
  )
}

export default PolicyDetailPage
