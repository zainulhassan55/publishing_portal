import { policies } from '../../data/siteContent'
import Container from '../layout/Container'
import ActionLink from '../shared/ActionLink'
import SectionHeading from '../shared/SectionHeading'

function TrustHighlightsSection() {
  return (
    <section className="border-t border-line bg-paper py-16 sm:py-20">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <SectionHeading
              eyebrow="Editorial Standards"
              title="Publication ethics and open access policies"
              description="Transparent peer review, licensing, and preservation practices support author confidence and indexing readiness."
            />
            <ActionLink to="/policies" variant="primary" className="mt-6" size="sm">
              Explore all policies
            </ActionLink>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {policies.map((policy) => (
              <article key={policy.slug} className="card">
                <h3 className="font-display text-lg font-semibold text-ink-950">
                  {policy.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">
                  {policy.summary}
                </p>
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
