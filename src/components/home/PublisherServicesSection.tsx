import { publisherServices } from '../../data/siteContent'
import Container from '../layout/Container'
import ActionLink from '../shared/ActionLink'
import SectionHeading from '../shared/SectionHeading'

function PublisherServicesSection() {
  return (
    <section className="section-y border-y border-line bg-white">
      <Container>
        <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="How we help"
            title="Publishing services for researchers and institutions"
            description="Peer-reviewed publishing, collaboration pathways, and practical research services."
          />
          <div className="flex flex-wrap gap-2">
            <ActionLink to="/about" variant="primary" size="sm">
              About DMPedia
            </ActionLink>
            <ActionLink to="/contact" variant="secondary" size="sm">
              Contact
            </ActionLink>
          </div>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {publisherServices.map((service, index) => (
            <article
              key={service.title}
              className="border border-line bg-[#f7f9fb] px-5 py-5 transition hover:border-slate-300 hover:bg-white"
            >
              <p className="font-display text-xl font-semibold text-slate-400">
                {String(index + 1).padStart(2, '0')}
              </p>
              <h3 className="mt-2 font-display text-lg font-semibold text-ink-950">
                {service.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{service.summary}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  )
}

export default PublisherServicesSection
