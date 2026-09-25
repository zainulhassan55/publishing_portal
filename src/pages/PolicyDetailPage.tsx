import { Navigate, useParams } from 'react-router-dom'
import Container from '../components/layout/Container'
import PageHero from '../components/layout/PageHero'
import ActionLink from '../components/shared/ActionLink'
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

      <section className="section-y bg-paper">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              {policy.sections.map((section) => (
                <DetailSection key={section.title} title={section.title}>
                  <p>{section.body}</p>
                </DetailSection>
              ))}
            </div>

            <div className="space-y-4">
              <SidebarPanel title="Related policies">
                {policies
                  .filter((item) => item.slug !== policy.slug)
                  .map((item) => (
                    <ActionLink
                      key={item.slug}
                      to={`/policies/${item.slug}`}
                      variant="secondary"
                      size="sm"
                      className="w-full"
                    >
                      {item.title}
                    </ActionLink>
                  ))}
              </SidebarPanel>
              <SidebarPanel title="Author support">
                <p>Authorship and contributorship</p>
                <p>Conflicts of interest</p>
                <p>Data availability and ethics approvals</p>
                <p>Archiving and preservation</p>
              </SidebarPanel>
              <ActionLink to="/guidelines" variant="primary" className="w-full">
                View author guidelines
              </ActionLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}

export default PolicyDetailPage
