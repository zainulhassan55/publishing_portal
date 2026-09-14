import CatalogPage from '../components/shared/CatalogPage'
import { indexingItems } from '../data/siteContent'

function IndexingPage() {
  return (
    <CatalogPage
      eyebrow="Indexing & DOI"
      title="Discoverability infrastructure for the scholarly record."
      description="DOI workflows, indexing pathways, metadata quality, and open-access visibility for journals and proceedings."
      items={indexingItems}
      sidebarTitle="Discoverability"
      sidebarPoints={[
        'DOI registration readiness',
        'Abstracting and indexing pathways',
        'Metadata structure for search and archives',
        'Open access visibility under CC BY licensing',
      ]}
    />
  )
}

export default IndexingPage
