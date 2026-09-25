import { publisherServices } from '../../data/siteContent'
import Container from '../layout/Container'
import ActionLink from '../shared/ActionLink'
import SectionHeading from '../shared/SectionHeading'

function PublisherServicesSection() {
  return (
    <section className="border-y border-line bg-white py-16 sm:py-20">
      <Container>
        <div className="max-w-3xl">
          <SectionHeading
            eyebrow="How we help"
            title="Publishing services for researchers and institutions"
            description="DMPedia supports authors and partners through peer-reviewed publishing, collaboration pathways, and practical research services."
          />
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {publisherServices.map((service, index) => (
            <article
              key={service.title}
              className="rounded-2xl border border-line bg-[#f7f9fb] p-6 transition hover:border-slate-300 hover:bg-white"
            >
              <p className="font-display text-2xl font-semibold text-slate-400">
                {String(index + 1).padStart(2, '0')}
              </p>
              <h3 className="mt-3 font-display text-lg font-semibold text-ink-950">
                {service.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{service.summary}</p>
            </article>
          ))}
        </div>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <ActionLink to="/about" variant="primary" size="sm">
            About DMPedia
          </ActionLink>
          <ActionLink to="/contact" variant="secondary" size="sm">
            Contact the publisher
          </ActionLink>
        </div>
      </Container>
    </section>
  )
}

export default PublisherServicesSection
