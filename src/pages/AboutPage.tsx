import Container from '../components/layout/Container'
import PageHero from '../components/layout/PageHero'
import ActionLink from '../components/shared/ActionLink'
import DetailSection from '../components/shared/DetailSection'
import FeatureCard from '../components/shared/FeatureCard'
import SidebarPanel from '../components/shared/SidebarPanel'
import { aboutPillars, brand, publishingFacts } from '../data/siteContent'

function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title={`${brand.name} is an independent academic publishing identity.`}
        description="We present journals, articles, policies, and publishing guidance with clarity, credibility, and a modern public-facing structure."
      />

      <section className="bg-paper py-14 sm:py-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <DetailSection title="Mission and vision">
                <p>
                  {brand.name} exists to make scholarly publishing easier to discover and easier to
                  trust. Readers can find journals and articles quickly. Authors can understand
                  expectations. Partners can evaluate the organization with confidence.
                </p>
              </DetailSection>

              <DetailSection title="Publishing philosophy">
                <p>
                  The portal prioritizes clear typography, visible ethics, organized archives, and
                  credible research presentation. The experience is designed to feel academically
                  serious without looking outdated.
                </p>
              </DetailSection>

              <div className="grid gap-4 md:grid-cols-3">
                {aboutPillars.map((pillar) => (
                  <FeatureCard
                    key={pillar.title}
                    title={pillar.title}
                    description={pillar.body}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <SidebarPanel title="Platform notes">
                {publishingFacts.map((fact) => (
                  <p key={fact}>{fact}</p>
                ))}
              </SidebarPanel>
              <SidebarPanel title="Services">
                <p>Journal hosting and public journal presentation</p>
                <p>Conference proceedings publishing support</p>
                <p>Policy, guidance, and indexing visibility</p>
                <p>Future manuscript-system integration</p>
              </SidebarPanel>
              <ActionLink to="/contact" variant="primary" className="w-full">
                Contact the publisher
              </ActionLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}

export default AboutPage
