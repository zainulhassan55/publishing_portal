import Container from '../components/layout/Container'
import PageHero from '../components/layout/PageHero'
import ActionLink from '../components/shared/ActionLink'
import FeatureCard from '../components/shared/FeatureCard'
import SidebarPanel from '../components/shared/SidebarPanel'
import { cfpItems } from '../data/siteContent'

function CfpPage() {
  return (
    <>
      <PageHero
        eyebrow="Call for Papers"
        title="Open calls across journals and special issues."
        description="Review current thematic opportunities, deadlines, and submission pathways for prospective authors."
      />

      <section className="bg-paper py-14 sm:py-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="grid gap-4">
              {cfpItems.map((item) => (
                <FeatureCard
                  key={item.title}
                  title={item.title}
                  description={item.summary}
                  meta={item.meta}
                  badge={item.badge}
                >
                  <ActionLink href="#" variant="secondary" size="sm">
                    Prepare submission
                  </ActionLink>
                </FeatureCard>
              ))}
            </div>

            <div className="space-y-4">
              <SidebarPanel title="Author pathway">
                <p>Discover the call</p>
                <p>Review guidelines</p>
                <p>Open the related journal</p>
                <p>Submit manuscript</p>
              </SidebarPanel>
              <ActionLink to="/guidelines" variant="primary" className="w-full">
                Read author guidelines
              </ActionLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}

export default CfpPage
