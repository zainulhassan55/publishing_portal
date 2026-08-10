import CatalogPage from '../components/shared/CatalogPage'
import { indexingItems } from '../data/siteContent'

function IndexingPage() {
  return (
    <CatalogPage
      eyebrow="Indexing & DOI"
      title="Visibility infrastructure for scholarly discovery."
      description="Present DOI readiness, indexing pathways, and metadata quality in a confidence-building public format."
      items={indexingItems}
      sidebarTitle="Discoverability"
      sidebarPoints={[
        'DOI registration readiness',
        'Abstracting and indexing pathways',
        'Metadata structure for search and archives',
      ]}
    />
  )
}

export default IndexingPage
