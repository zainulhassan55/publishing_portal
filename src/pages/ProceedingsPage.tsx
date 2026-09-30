import CatalogPage from '../components/shared/CatalogPage'
import { proceedings } from '../data/siteContent'

function ProceedingsPage() {
  return (
    <CatalogPage
      eyebrow="Proceedings"
      title="Conference proceedings series with ISBN and optional DOI support."
      description="NextGenIQ Press organizes recurring international conference series—NGIQ-LNCSE and NGIQ-LNMR—with peer-reviewed publication, consistent formatting, and global participation."
      items={proceedings}
      filters={['All series', 'NGIQ-LNCSE', 'NGIQ-LNMR', 'Open CFP']}
      sidebarTitle="Series publishing"
      sidebarPoints={[
        'Peer-reviewed conference volumes',
        'ISBN assignment with optional Crossref DOIs',
        'Online, hybrid, and physical event modes',
        'Partner pathways for organizers and institutions',
      ]}
    />
  )
}

export default ProceedingsPage
