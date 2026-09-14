import { brand, featuredJournals, heroMetrics } from '../../data/siteContent'
import Container from '../layout/Container'
import ActionLink from '../shared/ActionLink'

function HomeHero() {
  const spotlight = featuredJournals[0]

  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-ink-950 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 85% 15%, rgba(20,150,140,0.28), transparent 55%), radial-gradient(ellipse 50% 45% at 10% 80%, rgba(126,202,195,0.12), transparent 50%), linear-gradient(160deg, #07131f 0%, #102235 48%, #0a3d3a 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="animate-drift pointer-events-none absolute -top-24 -right-16 h-80 w-80 rounded-full bg-accent-500/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'linear-gradient(180deg, black, transparent 90%)',
        }}
      />

      <Container className="relative py-16 sm:py-20 lg:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-14">
          <div className="animate-fade-up">
            <p className="meta text-accent-300">{brand.unitLabel}</p>
            <p className="mt-5 font-display text-4xl leading-[0.95] font-semibold tracking-tight text-white sm:text-5xl lg:text-[3.65rem]">
              {brand.name}
            </p>
            <div className="section-rule mt-6 max-w-40" />
            <h1 className="mt-6 max-w-2xl font-display text-2xl leading-snug font-medium text-slate-100 sm:text-[1.9rem]">
              Peer-reviewed journals, books, and conference proceedings for global scholarship.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:leading-8">
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

          <aside className="hero-panel animate-fade-up-delay-1 p-6 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <p className="meta text-accent-300">Featured journal</p>
              <span className="rounded-md border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] text-white uppercase">
                {spotlight.shortTitle}
              </span>
            </div>
            <h2 className="mt-4 font-display text-2xl leading-snug font-semibold text-white">
              {spotlight.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">{spotlight.summary}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-md border border-white/18 px-2.5 py-1 text-xs text-slate-200">
                {spotlight.access}
              </span>
              <span className="rounded-md border border-white/18 px-2.5 py-1 text-xs text-slate-200">
                APC-free
              </span>
              <span className="rounded-md border border-white/18 px-2.5 py-1 text-xs text-slate-200">
                {spotlight.reviewType}
              </span>
            </div>
            <ActionLink
              to={`/journals/${spotlight.slug}`}
              variant="light"
              size="sm"
              className="mt-7"
            >
              Open journal
            </ActionLink>
          </aside>
        </div>

        <div className="animate-fade-up-delay-2 mt-14 grid gap-5 border-t border-white/10 pt-8 sm:grid-cols-2 lg:grid-cols-4">
          {heroMetrics.map((metric) => (
            <div key={metric.label} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="font-display text-3xl font-semibold text-white">{metric.value}</p>
              <p className="mt-1.5 text-sm text-slate-400">{metric.label}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}

export default HomeHero
