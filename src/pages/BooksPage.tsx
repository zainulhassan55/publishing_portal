import CatalogPage from '../components/shared/CatalogPage'
import { books } from '../data/siteContent'

function BooksPage() {
  return (
    <CatalogPage
      eyebrow="Books"
      title="Scholarly books and edited volumes from Digital Manuscriptpedia."
      description="Monographs and reference works supporting researchers across computing, engineering, health, business, and interdisciplinary fields."
      items={books}
      filters={['All titles', 'Forthcoming', 'Monographs', '2026']}
      sidebarTitle="Book publishing"
      sidebarPoints={[
        'ISBN assignment for print and electronic editions',
        'Editorial support for author and edited volumes',
        'Aligned with open scholarly communication standards',
      ]}
    />
  )
}

export default BooksPage
