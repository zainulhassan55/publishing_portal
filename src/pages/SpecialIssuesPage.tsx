import CatalogPage from '../components/shared/CatalogPage'
import { specialIssues } from '../data/siteContent'

function SpecialIssuesPage() {
  return (
    <CatalogPage
      eyebrow="Special Issues"
      title="Guest-edited collections across healthcare, cities, and digital transformation."
      description="Explore active and forthcoming thematic issues with clear deadlines and journal alignment."
      items={specialIssues}
      filters={['Open', 'Forthcoming', 'All journals']}
      sidebarTitle="For guest editors"
      sidebarPoints={[
        'Highlight theme and submission deadlines',
        'Connect authors to guidelines and journal pages',
        'Support published collections with article listings',
      ]}
    />
  )
}

export default SpecialIssuesPage
