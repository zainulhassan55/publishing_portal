import { Link } from 'react-router-dom'
import Container from '../components/layout/Container'
import PageHero from '../components/layout/PageHero'
import ActionLink from '../components/shared/ActionLink'
import FeatureCard from '../components/shared/FeatureCard'
import FilterBar from '../components/shared/FilterBar'
import SidebarPanel from '../components/shared/SidebarPanel'
import { featuredJournals } from '../data/siteContent'

function JournalsPage() {
  return (
    <>
      <PageHero
        eyebrow="Journals"
        title="A clean journal catalog built for serious academic presentation."
        description="Each journal listing connects to aims and scope, editorial board information, archives, and author pathways."
      />

      <section className="bg-paper py-14 sm:py-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="mb-6">
                <FilterBar items={['All disciplines', 'Open Access', 'Hybrid', 'Newest', 'A-Z']} />
              </div>

              <div className="grid gap-4">
                {featuredJournals.map((journal) => (
                  <FeatureCard
                    key={journal.slug}
                    title={journal.title}
                    description={journal.summary}
                    meta={journal.issn}
                    badge={journal.area}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-sm text-slate-500">
                        {journal.access} · {journal.frequency}
                      </span>
                      <ActionLink to={`/journals/${journal.slug}`} variant="secondary" size="sm">
                        View journal
                      </ActionLink>
                    </div>
                  </FeatureCard>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <SidebarPanel title="Catalog structure">
                <p>Journal cards with metadata and access model</p>
                <p>Dedicated journal detail pages</p>
                <p>Issue archive routes for volume browsing</p>
              </SidebarPanel>
              <SidebarPanel title="Quick paths">
                <Link to="/guidelines" className="block font-semibold text-ink-950 hover:underline">
                  Author guidelines
                </Link>
                <Link to="/cfp" className="block font-semibold text-ink-950 hover:underline">
                  Open calls for papers
                </Link>
                <Link to="/indexing" className="block font-semibold text-ink-950 hover:underline">
                  Indexing and DOI
                </Link>
              </SidebarPanel>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}

export default JournalsPage
