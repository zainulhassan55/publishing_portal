import { policies } from '../../data/siteContent'
import Container from '../layout/Container'
import ActionLink from '../shared/ActionLink'
import SectionHeading from '../shared/SectionHeading'

function TrustHighlightsSection() {
  return (
    <section className="relative overflow-hidden bg-white py-16 sm:py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(ellipse 45% 50% at 0% 100%, rgba(20,150,140,0.08), transparent 55%)',
        }}
      />

      <Container className="relative">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <SectionHeading
              eyebrow="Editorial Standards"
              title="COPE-aligned ethics and open access policies"
              description="Transparent peer review, APC-free licensing, and preservation practices support author confidence and indexing readiness."
            />
            <div className="section-rule mt-6 max-w-24" />
            <ActionLink to="/policies" variant="primary" className="mt-7" size="sm">
              Explore all policies
            </ActionLink>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {policies.map((policy, index) => (
              <article key={policy.slug} className="card group">
                <p className="meta text-accent-700">
                  Policy {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="mt-3 font-display text-lg font-semibold text-ink-950 transition group-hover:text-accent-700">
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
