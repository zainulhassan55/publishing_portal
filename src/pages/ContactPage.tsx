import { brand, contactChannels } from '../data/siteContent'
import Container from '../components/layout/Container'
import PageHero from '../components/layout/PageHero'
import ActionLink from '../components/shared/ActionLink'
import SidebarPanel from '../components/shared/SidebarPanel'

function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Get in touch with Digital Manuscriptpedia"
        description="Reach the editorial office for journal inquiries, author support, proceedings partnerships, and general publishing questions."
      />

      <section className="bg-paper py-14 sm:py-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
              {contactChannels.map((channel) => (
                <div key={channel.label} className="card-quiet">
                  <p className="meta text-accent-700">{channel.label}</p>
                  <p className="mt-3 font-display text-lg font-semibold text-ink-950">
                    {channel.value}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{channel.note}</p>
                </div>
              ))}
              <SidebarPanel title="Publisher">
                <p>
                  {brand.name} ({brand.shortName})
                </p>
                <p>{brand.unitLabel}</p>
                <p>Independent academic publishing for journals, books, and proceedings</p>
              </SidebarPanel>
            </div>

            <form className="surface-soft p-7 sm:p-8">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-semibold text-ink-950">
                  Full name
                  <input className="field" />
                </label>
                <label className="flex flex-col gap-2 text-sm font-semibold text-ink-950">
                  Email
                  <input className="field" type="email" />
                </label>
                <label className="flex flex-col gap-2 text-sm font-semibold text-ink-950 sm:col-span-2">
                  Subject category
                  <select className="field">
                    <option>General inquiry</option>
                    <option>Editorial support</option>
                    <option>Journal submission question</option>
                    <option>Proceedings partnership</option>
                    <option>Indexing / DOI</option>
                  </select>
                </label>
                <label className="flex flex-col gap-2 text-sm font-semibold text-ink-950 sm:col-span-2">
                  Message
                  <textarea rows={6} className="field" />
                </label>
              </div>

              <ActionLink href="#" variant="primary" className="mt-6">
                Send inquiry
              </ActionLink>
            </form>
          </div>
        </Container>
      </section>
    </>
  )
}

export default ContactPage
