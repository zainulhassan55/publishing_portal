import type { Metadata } from 'next'
import { AsideBox, AsideLinks, PublisherPage } from '@/components/content/PublisherPage'
import { audiences, librarianSections } from '@/data/publisher'
import { journals, periodicalBase, series } from '@/data/registry'
import { withSharing } from '@/lib/metadata'

const librarians = audiences.find((a) => a.id === 'librarians')!

export const metadata: Metadata = withSharing({
  title: 'For librarians',
  description: librarians.text,
  alternates: { canonical: '/librarians' },
})

export default function LibrariansPage() {
  const [browse, indexing, access] = librarianSections
  return (
    <PublisherPage
      trail={[{ label: 'For librarians' }]}
      kicker="For librarians"
      title="For librarians"
      lead={librarians.text}
      sections={[
        {
          ...browse,
          links: [
            ...journals.map((j) => ({ label: j.title, href: periodicalBase(j.slug) })),
            ...series.map((s) => ({ label: s.title, href: `/series/${s.slug}` })),
          ],
        },
        {
          ...indexing,
          links: [
            ...series.map((s) => ({ label: `${s.code} indexing`, href: `/series/${s.slug}/indexing-abstracting` })),
          ],
        },
        {
          ...access,
          links: [
            { label: 'Open Access and Licensing', href: '/policies/open-access' },
            { label: 'Copyright and Permissions', href: '/policies/copyright-licensing' },
            { label: 'Archiving and Preservation', href: '/policies/archiving-preservation' },
          ],
        },
      ]}
      aside={
        <AsideBox title="Publications">
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
