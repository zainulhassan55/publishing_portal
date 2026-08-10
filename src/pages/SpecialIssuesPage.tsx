import CatalogPage from '../components/shared/CatalogPage'
import { specialIssues } from '../data/siteContent'

function SpecialIssuesPage() {
  return (
    <CatalogPage
      eyebrow="Special Issues"
      title="Themed collections and guest-edited calls for papers."
      description="Promote active and forthcoming special issues with clear deadlines and editorial focus."
      items={specialIssues}
      filters={['Open', 'Forthcoming', 'All journals']}
      sidebarTitle="Guest editors"
      sidebarPoints={[
        'Highlight theme and submission deadlines',
        'Connect authors to guidelines and journal pages',
        'Support closed collections with published article lists later',
      ]}
    />
  )
}

export default SpecialIssuesPage
