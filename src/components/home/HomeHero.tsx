import { brand, featuredJournals, heroMetrics } from '../../data/siteContent'
import Container from '../layout/Container'
import ActionLink from '../shared/ActionLink'

function HomeHero() {
  const spotlight = featuredJournals[0]

  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-ink-950 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <Container className="relative py-16 sm:py-20 lg:py-22">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
          <div>
            <p className="meta text-accent-300">Independent Academic Publisher</p>
            <p className="mt-4 font-display text-4xl leading-none font-semibold tracking-tight text-white sm:text-5xl lg:text-[3.4rem]">
              {brand.name}
            </p>
            <h1 className="mt-5 max-w-2xl font-display text-2xl leading-snug font-medium text-slate-100 sm:text-[1.85rem]">
              Discover peer-reviewed journals, articles, and scholarly collections.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:leading-8">
              {brand.summary}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ActionLink to="/journals" variant="light">
                Browse Journals
              </ActionLink>
              <ActionLink to="/guidelines" variant="ghost">
                Author Guidelines
              </ActionLink>
            </div>
          </div>

          <aside className="rounded-[1.5rem] border border-white/15 bg-white/[0.06] p-5 sm:p-6">
            <p className="meta text-accent-300">Featured journal</p>
            <h2 className="mt-3 font-display text-2xl leading-snug font-semibold text-white">
              {spotlight.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">{spotlight.summary}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-200">
                {spotlight.issn}
              </span>
              <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-200">
                {spotlight.access}
              </span>
              <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-200">
                {spotlight.frequency}
              </span>
            </div>
            <ActionLink
              to={`/journals/${spotlight.slug}`}
              variant="light"
              size="sm"
              className="mt-6"
            >
              Open journal
            </ActionLink>
          </aside>
        </div>

        <div className="mt-12 grid gap-6 border-t border-white/10 pt-8 sm:grid-cols-2 lg:grid-cols-4">
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
