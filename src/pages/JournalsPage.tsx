import { Link } from 'react-router-dom'
import Container from '../components/layout/Container'
import PageHero from '../components/layout/PageHero'
import PortfolioCard from '../components/shared/PortfolioCard'
import { featuredJournals } from '../data/siteContent'
import { ojsRegisterUrl } from '../lib/ojs'

function JournalsPage() {
  return (
    <>
      <PageHero
        eyebrow="Journals"
        title="Browse the DMPedia open-access journal portfolio."
        description="Peer-reviewed continuous open-access journals across digital health, management, computing, electronics, and related scholarly fields."
      />

      <section className="section-y prose-justify bg-paper">
        <Container>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="meta text-accent-700">Active portfolio</p>
              <h2 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink-950 sm:text-[1.85rem]">
                {featuredJournals.length} open-access journals
              </h2>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-ink-950">
              <Link to="/cfp" className="hover:text-accent-700">
                Calls for papers
              </Link>
              <Link to="/guidelines" className="hover:text-accent-700">
                Author guidelines
              </Link>
              <a href={ojsRegisterUrl} className="hover:text-accent-700">
                Register account
              </a>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {featuredJournals.map((journal) => (
              <PortfolioCard
                key={journal.slug}
                slug={journal.slug}
                shortTitle={journal.shortTitle ?? journal.slug.toUpperCase()}
                title={journal.title}
                summary={journal.summary}
                area={journal.area}
                access={journal.access}
                frequency={journal.frequency}
                reviewType={journal.reviewType}
                to={`/journals/${journal.slug}`}
                actionLabel="View journal"
              />
            ))}
          </div>
        </Container>
      </section>
    </>
  )
}

export default JournalsPage
