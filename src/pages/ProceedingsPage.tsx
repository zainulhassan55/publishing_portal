import CatalogPage from '../components/shared/CatalogPage'
import { proceedings } from '../data/siteContent'

function ProceedingsPage() {
  return (
    <CatalogPage
      eyebrow="Proceedings"
      title="Conference proceedings with clear event and volume presentation."
      description="Showcase proceedings series, partner events, and volume metadata in a professional academic format."
      items={proceedings}
      filters={['All events', 'Open CFP', 'Series volumes', '2027']}
      sidebarTitle="Event publishing"
      sidebarPoints={[
        'Present conference name, location, and date clearly',
        'Highlight open calls and partner volumes',
        'Support future ISBN, DOI, and contents linking',
      ]}
    />
  )
}

export default ProceedingsPage
