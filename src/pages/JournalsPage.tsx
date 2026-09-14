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
        title="Select the right open-access journal for your research."
        description="Browse DMPedia titles across computing, engineering, business, One Health, sustainability, and forensic science—each with transparent peer review and APC-free publishing."
      />

      <section className="bg-paper py-14 sm:py-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="mb-6">
                <FilterBar
                  items={[
                    'All disciplines',
                    'Computing',
                    'Engineering',
                    'Business',
                    'One Health',
                    'Sustainability',
                    'Forensics',
                  ]}
                />
              </div>

              <div className="grid gap-4">
                {featuredJournals.map((journal) => (
                  <FeatureCard
                    key={journal.slug}
                    title={journal.title}
                    description={journal.summary}
                    meta={`${journal.shortTitle ?? ''} · ${journal.access}`}
                    badge={journal.area}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-sm text-slate-500">
                        {journal.reviewType} · {journal.frequency}
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
              <SidebarPanel title="Publishing model">
                <p>APC-free open access across active journals</p>
                <p>CC BY 4.0 licensing for published articles</p>
                <p>Single-blind or double-blind peer review by title</p>
                <p>DOI-ready article presentation and issue archives</p>
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
                <Link to="/login" className="block font-semibold text-ink-950 hover:underline">
                  Submit manuscript
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
