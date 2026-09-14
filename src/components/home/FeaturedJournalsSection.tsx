import { Link } from 'react-router-dom'
import { featuredJournals } from '../../data/siteContent'
import Container from '../layout/Container'
import ActionLink from '../shared/ActionLink'
import SectionHeading from '../shared/SectionHeading'

const coverStyles = [
  'from-[#07131f] via-[#16384f] to-[#0f8178]',
  'from-[#0c1c2c] via-[#1a4560] to-[#1f6f78]',
  'from-[#102235] via-[#0d4a55] to-[#14968c]',
  'from-[#0a1826] via-[#25445f] to-[#0a6b63]',
  'from-[#122338] via-[#1b4a5c] to-[#2a7d74]',
  'from-[#0d1a28] via-[#183149] to-[#12706a]',
]

function FeaturedJournalsSection() {
  return (
    <section className="relative py-16 sm:py-20">
      <Container>
        <div className="flex flex-col gap-5 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Journals"
            title="Active open-access journals"
            description="Browse DMPedia titles by subject area, peer-review model, and APC-free open access."
          />
          <ActionLink to="/journals" variant="primary" size="sm">
            View all journals
          </ActionLink>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {featuredJournals.map((journal, index) => (
            <article
              key={journal.slug}
              className="group card overflow-hidden p-0"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <Link to={`/journals/${journal.slug}`} className="block">
                <div
                  className={`relative flex min-h-[11rem] items-end overflow-hidden bg-gradient-to-br p-5 text-white ${coverStyles[index % coverStyles.length]}`}
                >
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 opacity-30 transition duration-500 group-hover:opacity-45"
                    style={{
                      backgroundImage:
                        'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.25), transparent 35%), linear-gradient(135deg, transparent 40%, rgba(0,0,0,0.25))',
                    }}
                  />
                  <div className="absolute top-4 right-4 rounded-md border border-white/25 bg-black/20 px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] text-white uppercase backdrop-blur-sm">
                    {journal.access}
                  </div>
                  <div className="relative">
                    <p className="meta text-accent-200">{journal.area}</p>
                    <p className="mt-2 max-w-sm font-display text-xl leading-snug font-semibold">
                      {journal.title}
                    </p>
                  </div>
                </div>
              </Link>

              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="badge">{journal.shortTitle ?? journal.area}</span>
                  <span className="badge">{journal.frequency}</span>
                </div>
                <p className="mt-4 flex-1 text-sm leading-7 text-slate-600">{journal.summary}</p>
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
                  <p className="text-xs font-medium text-slate-500">
                    {journal.reviewType ?? 'Peer-reviewed'} · APC-free
                  </p>
                  <ActionLink to={`/journals/${journal.slug}`} variant="secondary" size="sm">
                    View journal
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
