import CatalogPage from '../components/shared/CatalogPage'
import { proceedings } from '../data/siteContent'

function ProceedingsPage() {
  return (
    <CatalogPage
      eyebrow="Proceedings"
      title="Conference proceedings series with ISBN and optional DOI support."
      description="DMPedia organizes recurring international conference series—DMP-LNCSE and DMP-LNMR—with peer-reviewed publication, consistent formatting, and global participation."
      items={proceedings}
      filters={['All series', 'DMP-LNCSE', 'DMP-LNMR', 'Open CFP']}
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
