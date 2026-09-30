import {
  aboutPillars,
  aboutValues,
  brand,
  editorialStandards,
  heroMetrics,
  publisherServices,
  publishingFacts,
} from '../data/siteContent'
import Container from '../components/layout/Container'
import PageHero from '../components/layout/PageHero'
import ActionLink from '../components/shared/ActionLink'
import SectionHeading from '../components/shared/SectionHeading'

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-accent-600">
      <path
        d="M5 10.5 8.5 14 15 6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title={`Welcome to ${brand.name}`}
        description="A global academic publisher and knowledge platform empowering researchers, educators, and professionals to collaborate, share knowledge, and drive impactful research."
      />

      <section className="section-y border-b border-line bg-white">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="meta text-accent-700">Institutional overview</p>
              <h2 className="mt-2 font-display text-[1.85rem] font-semibold tracking-tight text-ink-950 sm:text-[2.1rem]">
                Independent scholarly publishing
              </h2>
              <div className="section-rule mt-4 max-w-20" />
              <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-[0.95rem]">
                {brand.name} publishes
                high-quality journals, books, and conference proceedings across diverse
                disciplines. Our editorial team works closely with authors and institutions to
                ensure rigorous peer review, ethical publishing practices, and wide dissemination
                of research.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <ActionLink to="/journals" variant="primary" size="sm">
                  Browse journals
                </ActionLink>
                <ActionLink to="/contact" variant="secondary" size="sm">
                  Contact the publisher
                </ActionLink>
              </div>
            </div>

            <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-line bg-[#f7f9fb]">
              {heroMetrics.map((metric, index) => (
                <div
                  key={metric.label}
                  className={`px-5 py-5 ${index % 2 === 1 ? 'border-l border-line' : ''} ${
                    index >= 2 ? 'border-t border-line' : ''
                  }`}
                >
                  <p className="font-display text-xl font-semibold text-ink-950 sm:text-2xl">
                    {metric.value}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="section-y bg-paper">
        <Container>
          <div className="grid gap-4 md:grid-cols-3">
            {aboutPillars.map((pillar, index) => (
              <article
                key={pillar.title}
                className="flex h-full flex-col rounded-xl border border-line bg-white p-6 shadow-[0_8px_22px_rgba(7,19,31,0.04)]"
              >
                <p className="font-display text-lg font-semibold text-accent-600">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="mt-2 font-display text-xl font-semibold text-ink-950">
                  {pillar.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{pillar.body}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="section-y border-y border-line bg-white">
        <Container>
          <div className="border-b border-line pb-6">
            <SectionHeading
              eyebrow="Our values"
              title="Principles that guide our work"
              description="The standards we hold ourselves to across every journal, book series, and proceedings volume."
            />
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {aboutValues.map((value) => (
              <article
                key={value.number}
                className="flex h-full gap-4 rounded-xl border border-line bg-[#f7f9fb] p-5 transition hover:border-slate-300 hover:bg-white"
              >
                <span className="font-display text-xl font-semibold text-slate-400">
                  {value.number}
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold text-ink-950">
                    {value.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-6 text-slate-600">{value.summary}</p>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="section-y bg-paper">
        <Container>
          <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
            <article className="rounded-xl border border-line bg-white p-6 shadow-[0_8px_22px_rgba(7,19,31,0.04)] sm:p-7">
              <p className="meta text-accent-700">Editorial standards</p>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink-950">
                How we safeguard quality
              </h2>
              <ul className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {editorialStandards.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm leading-6 text-slate-600">
                    <CheckIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <aside className="flex flex-col rounded-xl bg-ink-950 p-6 text-white sm:p-7">
              <p className="meta text-accent-300">Publisher commitments</p>
              <ul className="mt-5 flex-1 space-y-4">
                {publishingFacts.map((fact) => (
                  <li key={fact} className="flex gap-2.5 text-sm leading-6 text-slate-300">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-300" />
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
              <ActionLink to="/policies" variant="light" size="sm" className="mt-6 self-start">
                View policies
              </ActionLink>
            </aside>
          </div>
        </Container>
      </section>

      <section className="section-y border-t border-line bg-white">
        <Container>
          <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              eyebrow="Services"
              title="How we support researchers"
              description="Publishing, review support, collaboration, training, and consulting for authors and institutions."
            />
            <ActionLink to="/contact" variant="primary" size="sm">
              Get in touch
            </ActionLink>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {publisherServices.map((service, index) => (
              <article
                key={service.title}
                className="flex h-full flex-col rounded-xl border border-line bg-[#f7f9fb] p-5 transition hover:border-slate-300 hover:bg-white"
              >
                <p className="font-display text-xl font-semibold text-slate-400">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="mt-2 font-display text-lg font-semibold text-ink-950">
                  {service.title}
                </h3>
                <p className="mt-1.5 flex-1 text-sm leading-6 text-slate-600">
                  {service.summary}
                </p>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </>
  )
}

export default AboutPage
