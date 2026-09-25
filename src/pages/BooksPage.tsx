import { Link } from 'react-router-dom'
import Container from '../components/layout/Container'
import PageHero from '../components/layout/PageHero'
import PortfolioCard from '../components/shared/PortfolioCard'
import { featuredBookSeries } from '../data/siteContent'

function BooksPage() {
  return (
    <>
      <PageHero
        eyebrow="Book Series"
        title="Browse the DMPedia open-access book series portfolio."
        description="Peer-reviewed open-access series for monographs, lecture notes, and edited volumes across research, innovation, and interdisciplinary science."
      />

      <section className="section-y prose-justify bg-paper">
        <Container>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="meta text-accent-700">Active series</p>
              <h2 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink-950 sm:text-[1.85rem]">
                {featuredBookSeries.length} open-access book series
              </h2>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-ink-950">
              <Link to="/books/isri/call-for-books" className="hover:text-accent-700">
                ISRI proposals
              </Link>
              <Link to="/books/lnisi/call-for-books" className="hover:text-accent-700">
                LNISI proposals
              </Link>
              <Link to="/contact" className="hover:text-accent-700">
                Contact office
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {featuredBookSeries.map((series) => (
              <PortfolioCard
                key={series.slug}
                slug={series.slug}
                shortTitle={series.shortTitle ?? series.slug.toUpperCase()}
                title={series.title}
                area={series.area}
                access={series.access}
                frequency={series.frequency}
                reviewType={series.reviewType}
                to={`/books/${series.slug}`}
                actionLabel="View series"
              />
            ))}
          </div>
        </Container>
      </section>
    </>
  )
}

export default BooksPage
