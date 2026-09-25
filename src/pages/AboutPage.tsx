import {
  aboutPillars,
  aboutValues,
  brand,
  editorialStandards,
  publisherServices,
  publishingFacts,
} from '../data/siteContent'
import Container from '../components/layout/Container'
import PageHero from '../components/layout/PageHero'
import ActionLink from '../components/shared/ActionLink'
import DetailSection from '../components/shared/DetailSection'
import FeatureCard from '../components/shared/FeatureCard'
import SidebarPanel from '../components/shared/SidebarPanel'

function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title={`Welcome to ${brand.name}`}
        description="A global academic publisher and knowledge platform empowering researchers, educators, and professionals to collaborate, share knowledge, and drive impactful research."
      />

      <section className="section-y bg-paper">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <DetailSection title="Institutional overview">
                <p>
                  {brand.name} ({brand.shortName}), {brand.unitLabel.toLowerCase()}, publishes
                  high-quality journals, books, and conference proceedings across diverse
                  disciplines. Our editorial team works closely with authors and institutions to
                  ensure rigorous peer review, ethical publishing practices, and wide dissemination
                  of research.
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

              <DetailSection title="Our values">
                <div className="mt-2 grid gap-4 sm:grid-cols-2">
                  {aboutValues.map((value) => (
                    <div key={value.number} className="rounded-2xl border border-line bg-white p-4">
                      <p className="meta text-accent-700">{value.number}</p>
                      <h3 className="mt-2 font-display text-lg font-semibold text-ink-950">
                        {value.title}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{value.summary}</p>
                    </div>
                  ))}
                </div>
              </DetailSection>

              <DetailSection title="Editorial standards">
                <ul className="space-y-3">
                  {editorialStandards.map((item) => (
                    <li key={item} className="text-sm leading-7 text-slate-600">
                      {item}
                    </li>
                  ))}
                </ul>
              </DetailSection>
            </div>

            <div className="space-y-4">
              <SidebarPanel title="Publisher commitments">
                {publishingFacts.map((fact) => (
                  <p key={fact}>{fact}</p>
                ))}
              </SidebarPanel>
              <SidebarPanel title="Services">
                {publisherServices.map((service) => (
                  <p key={service.title}>{service.title}</p>
                ))}
              </SidebarPanel>
              <ActionLink to="/contact" variant="primary" className="w-full">
                Contact the publisher
              </ActionLink>
              <ActionLink to="/journals" variant="secondary" className="w-full">
                Browse journals
              </ActionLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}

export default AboutPage
