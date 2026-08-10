import { featuredJournals } from '../../data/siteContent'
import Container from '../layout/Container'
import ActionLink from '../shared/ActionLink'
import SectionHeading from '../shared/SectionHeading'

const coverStyles = [
  'from-ink-950 via-ink-800 to-accent-700',
  'from-[#132a40] via-[#1f4a5f] to-[#2f6f7a]',
  'from-[#0f2438] via-[#16384f] to-[#0d5c57]',
  'from-[#182636] via-[#274767] to-[#3b6b78]',
]

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

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {featuredJournals.map((journal, index) => (
            <article key={journal.slug} className="card overflow-hidden p-0">
              <div
                className={`relative flex min-h-[9.5rem] items-end bg-gradient-to-br p-5 text-white ${coverStyles[index % coverStyles.length]}`}
              >
                <div className="absolute top-4 right-4 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-[0.08em] text-white uppercase">
                  {journal.access}
                </div>
                <div>
                  <p className="meta text-slate-200">{journal.area}</p>
                  <p className="mt-2 max-w-sm font-display text-xl leading-snug font-semibold">
                    {journal.title}
                  </p>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="badge">{journal.issn}</span>
                  <span className="badge">{journal.frequency}</span>
                </div>
                <p className="mt-4 flex-1 text-sm leading-7 text-slate-600">{journal.summary}</p>
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
                  <p className="text-xs font-medium text-slate-500">
                    Peer-reviewed · {journal.access}
                  </p>
                  <ActionLink to={`/journals/${journal.slug}`} variant="secondary" size="sm">
                    View journals
                  </ActionLink>
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
