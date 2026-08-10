import Container from '../components/layout/Container'
import PageHero from '../components/layout/PageHero'
import ActionLink from '../components/shared/ActionLink'
import FeatureCard from '../components/shared/FeatureCard'
import SidebarPanel from '../components/shared/SidebarPanel'
import { policies } from '../data/siteContent'

function PoliciesPage() {
  return (
    <>
      <PageHero
        eyebrow="Policies"
        title="Clear policy pages are a core trust signal for academic publishing."
        description="Ethics, peer review, open access, and archiving information are presented in a structured and readable public format."
      />

      <section className="bg-paper py-14 sm:py-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="grid gap-4 md:grid-cols-2">
              {policies.map((policy) => (
                <FeatureCard
                  key={policy.slug}
                  title={policy.title}
                  description={policy.summary}
                >
                  <ActionLink to={`/policies/${policy.slug}`} variant="secondary" size="sm">
                    Open policy
                  </ActionLink>
                </FeatureCard>
              ))}
            </div>

            <div className="space-y-4">
              <SidebarPanel title="Why this matters">
                <p>Authors need transparent standards before submitting.</p>
                <p>Readers and librarians look for ethical clarity.</p>
                <p>Indexers expect public policy documentation.</p>
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

export default PoliciesPage
