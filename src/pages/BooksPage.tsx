import CatalogPage from '../components/shared/CatalogPage'
import { books } from '../data/siteContent'

function BooksPage() {
  return (
    <CatalogPage
      eyebrow="Books"
      title="Monographs, edited volumes, and scholarly reference works."
      description="A structured catalog for academic books with clear metadata and publishing status."
      items={books}
      filters={['All titles', 'Forthcoming', 'Monographs', '2026']}
      sidebarTitle="Book catalog"
      sidebarPoints={[
        'Browse by subject and publication status',
        'Review ISBN and release information',
        'Expand later into purchase or download detail pages',
      ]}
    />
  )
}

export default BooksPage
