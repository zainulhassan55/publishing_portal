import { brand, featuredJournals, heroMetrics } from '../../data/siteContent'
import Container from '../layout/Container'
import ActionLink from '../shared/ActionLink'

function HomeHero() {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-ink-950 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />

      <Container className="relative py-16 sm:py-20 lg:py-24">
        <div className="grid items-end gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="meta text-accent-300">Independent Academic Publisher</p>
            <p className="mt-4 font-display text-4xl leading-none font-semibold tracking-tight text-white sm:text-5xl lg:text-[3.6rem]">
              {brand.name}
            </p>
            <h1 className="mt-6 max-w-2xl font-display text-2xl leading-snug font-medium text-slate-100 sm:text-3xl">
              Discover peer-reviewed journals, articles, and scholarly collections.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              {brand.summary}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ActionLink to="/journals" variant="light">
                Browse Journals
              </ActionLink>
              <ActionLink to="/guidelines" variant="ghost">
                Author Guidelines
              </ActionLink>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {featuredJournals.slice(0, 4).map((journal, index) => (
              <article
                key={journal.slug}
                className={`rounded-2xl border border-white/15 bg-white/[0.06] p-4 ${
                  index % 2 === 0 ? 'translate-y-3' : '-translate-y-1'
                }`}
              >
                <p className="meta text-slate-400">{journal.area}</p>
                <h2 className="mt-3 font-display text-base leading-snug font-semibold text-white">
                  {journal.title}
                </h2>
                <p className="mt-3 text-xs text-slate-400">{journal.issn}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-14 grid gap-6 border-t border-white/10 pt-8 sm:grid-cols-2 lg:grid-cols-4">
          {heroMetrics.map((metric) => (
            <div key={metric.label}>
              <p className="font-display text-3xl font-semibold text-white">{metric.value}</p>
              <p className="mt-1 text-sm text-slate-400">{metric.label}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}

export default HomeHero
