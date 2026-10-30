import type { Metadata } from 'next'
import { AsideBox, AsideLinks, PublisherPage } from '@/components/content/PublisherPage'
import { about } from '@/data/publisher'
import { journals, periodicalBase, series } from '@/data/registry'
import { withSharing } from '@/lib/metadata'

export const metadata: Metadata = withSharing({
  title: 'About',
  description: about.paragraphs[0],
  alternates: { canonical: '/about' },
})

export default function AboutPage() {
  const [lead, ...rest] = about.paragraphs
  return (
    <PublisherPage
      trail={[{ label: 'About' }]}
      kicker="About"
      title={about.title}
      lead={lead}
      sections={[
        { id: 'programme', title: '', paragraphs: rest },
        ...about.sections.map((s) => ({
          id: s.title.toLowerCase().replace(/[^a-z]+/g, '-'),
          title: s.title,
          paragraphs: [s.text],
          links: [s.link],
        })),
        { id: 'contact', title: 'Contact', paragraphs: [`Contact: ${about.contact}`], links: [{ label: 'Contact form', href: '/contact' }] },
      ]}
      aside={
        <AsideBox title="Our publications">
          <AsideLinks
            links={[
              ...journals.map((j) => ({ label: `${j.shortTitle} · ${j.title}`, href: periodicalBase(j.slug) })),
              ...series.map((s) => ({ label: `${s.code} · ${s.title}`, href: `/series/${s.slug}` })),
            ]}
          />
        </AsideBox>
      }
    />
  )
}
