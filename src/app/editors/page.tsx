import type { Metadata } from 'next'
import { AsideBox, AsideLinks, PublisherPage } from '@/components/content/PublisherPage'
import { EditorialApplicationForm } from '@/components/forms/EditorialApplicationForm'
import { audiences } from '@/data/publisher'
import { journals, publicationOptions, series, seriesPageHref } from '@/data/registry'
import { editorialEmail } from '@/lib/site'

const editors = audiences.find((a) => a.id === 'editors')!

export const metadata: Metadata = {
  title: 'For editors',
  description: editors.text,
  alternates: { canonical: '/editors' },
}

export default function EditorsPage() {
  return (
    <PublisherPage
      trail={[{ label: 'For editors' }]}
      kicker="For editors"
      title="For Editors"
      lead={editors.text}
      sections={[
        {
          id: 'join-a-board',
          title: 'Join an editorial board',
          paragraphs: [
            `To express your interest in joining the editorial board of a journal or book series, complete the application below or email ${editorialEmail} with the title you are interested in, your affiliation, areas of expertise, and a brief academic profile.`,
          ],
          links: [
            ...journals.map((j) => ({ label: `${j.shortTitle} editorial board`, href: `/journals/${j.slug}/editorial-board` })),
            ...series.map((s) => ({ label: `${s.code} editorial board`, href: `/series/${s.slug}/editorial-board` })),
          ],
        },
        {
          id: 'special-issues',
          title: 'Propose a special issue',
          paragraphs: [
            'NextGenIQ Press welcomes special issue proposals on emerging, significant, and interdisciplinary topics relevant to the scope of its journals.',
          ],
          links: [{ label: 'Special Issue Guidelines', href: '/editors/special-issues' }],
        },
        {
          id: 'books-and-proceedings',
          title: 'Propose an edited book or conference proceedings',
          paragraphs: [
            'Our book series welcome proposals for research monographs, edited volumes, and conference proceedings throughout the year.',
          ],
          links: series.map((s) => ({ label: `Propose a volume for ${s.code}`, href: seriesPageHref(s.slug, 'propose-volume') })),
        },
        {
          id: 'new-journal',
          title: 'Submit a new journal proposal',
          paragraphs: ['Researchers and societies may propose a new open-access journal.'],
          links: [{ label: 'Submit a New Journal proposal', href: '/propose-journal' }],
        },
      ]}
      aside={
        <AsideBox title="Related">
          <AsideLinks
            links={[
              { label: 'Special Issue Guidelines', href: '/editors/special-issues' },
              { label: 'Reviewer guidelines', href: '/reviewers' },
              { label: 'Publication Ethics', href: '/policies/publication-ethics' },
              { label: 'Complaints and Appeals', href: '/policies/complaints-appeals' },
            ]}
          />
        </AsideBox>
      }
    >
      <section id="board-application" aria-labelledby="board-application-h" style={{ scrollMarginTop: 24, marginTop: 8 }}>
        <h2 id="board-application-h" style={{ margin: '0 0 6px', fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600 }}>Editorial board application</h2>
        <p style={{ margin: '0 0 20px', fontSize: 15, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)' }}>Fields marked * are required.</p>
        <EditorialApplicationForm targets={publicationOptions()} role="board" />
      </section>
    </PublisherPage>
  )
}
