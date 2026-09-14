import CatalogPage from '../components/shared/CatalogPage'
import { newsItems } from '../data/siteContent'

function NewsPage() {
  return (
    <CatalogPage
      eyebrow="News & Events"
      title="Portal updates, open calls, and conference series announcements."
      description="Follow publishing launches, thematic calls for papers, and DMP-LNCSE / DMP-LNMR partnership news."
      items={newsItems}
      filters={['All', 'Announcement', 'Call for Papers', 'Update']}
      sidebarTitle="Stay informed"
      sidebarPoints={[
        'Follow open calls and special issue deadlines',
        'Track indexing and publishing updates',
        'Contact us for partnership and event inquiries',
      ]}
    />
  )
}

export default NewsPage
