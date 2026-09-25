import { policies } from '../../data/siteContent'
import Container from '../layout/Container'
import ActionLink from '../shared/ActionLink'
import SectionHeading from '../shared/SectionHeading'

function TrustHighlightsSection() {
  return (
    <section className="section-y bg-[#f7f9fb]">
      <Container>
        <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Editorial Standards"
            title="COPE-aligned ethics and open access policies"
            description="Transparent peer review, APC-free licensing, and preservation practices for authors and indexing readiness."
          />
          <ActionLink to="/policies" variant="primary" size="sm">
            Explore all policies
          </ActionLink>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {policies.map((policy, index) => (
            <article
              key={policy.slug}
              className="flex h-full flex-col border border-line bg-white px-5 py-5 transition hover:border-slate-300"
            >
              <p className="meta text-slate-500">Policy {String(index + 1).padStart(2, '0')}</p>
              <h3 className="mt-2 font-display text-lg font-semibold text-ink-950">
                {policy.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{policy.summary}</p>
              <ActionLink
                to={`/policies/${policy.slug}`}
                variant="secondary"
                size="sm"
                className="mt-4 self-start"
              >
                Read policy
              </ActionLink>
            </article>
          ))}
        </div>
      </Container>
    </section>
  )
}

export default TrustHighlightsSection
