import { policies } from '../../data/siteContent'
import Container from '../layout/Container'
import ActionLink from '../shared/ActionLink'
import SectionHeading from '../shared/SectionHeading'

function TrustHighlightsSection() {
  return (
    <section className="bg-[#f7f9fb] py-16 sm:py-20">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <SectionHeading
              eyebrow="Editorial Standards"
              title="COPE-aligned ethics and open access policies"
              description="Transparent peer review, APC-free licensing, and preservation practices support author confidence and indexing readiness."
            />
            <div className="mt-6 h-px max-w-24 bg-accent-600/70" />
            <ActionLink to="/policies" variant="primary" className="mt-7" size="sm">
              Explore all policies
            </ActionLink>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {policies.map((policy, index) => (
              <article
                key={policy.slug}
                className="flex h-full flex-col rounded-2xl border border-line bg-white p-6 transition hover:border-slate-300"
              >
                <p className="meta text-slate-500">
                  Policy {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="mt-3 font-display text-lg font-semibold text-ink-950">
                  {policy.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">{policy.summary}</p>
                <ActionLink
                  to={`/policies/${policy.slug}`}
                  variant="secondary"
                  size="sm"
                  className="mt-5 self-start"
                >
                  Read policy
                </ActionLink>
              </article>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}

export default TrustHighlightsSection
