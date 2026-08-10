import { Link } from 'react-router-dom'
import { featuredJournals } from '../../data/siteContent'
import Container from '../layout/Container'
import ActionLink from '../shared/ActionLink'
import SectionHeading from '../shared/SectionHeading'

function FeaturedJournalsSection() {
  return (
    <section className="bg-paper py-16 sm:py-20">
      <Container>
        <div className="flex flex-col gap-5 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Journals"
            title="Current journals"
            description="Browse active titles by subject area, access model, and publication frequency."
          />
          <ActionLink to="/journals" variant="primary" size="sm">
            View all journals
          </ActionLink>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {featuredJournals.map((journal) => (
            <article key={journal.slug} className="card p-0">
              <div className="card-cover rounded-t-[1.4rem]">
                <div>
                  <p className="meta text-slate-300">{journal.area}</p>
                  <p className="mt-2 font-display text-lg leading-snug font-semibold text-white">
                    {journal.title.split(' ').slice(0, 4).join(' ')}
                  </p>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <p className="meta">{journal.issn}</p>
                <h3 className="mt-2 font-display text-xl leading-snug font-semibold text-ink-950">
                  {journal.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">{journal.summary}</p>
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
                  <span className="text-xs font-medium text-slate-500">
                    {journal.access} · {journal.frequency}
                  </span>
                  <Link to={`/journals/${journal.slug}`} className="btn btn-secondary btn-sm">
                    Open
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  )
}

export default FeaturedJournalsSection
