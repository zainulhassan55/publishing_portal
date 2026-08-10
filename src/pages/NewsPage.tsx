import CatalogPage from '../components/shared/CatalogPage'
import { newsItems } from '../data/siteContent'

function NewsPage() {
  return (
    <CatalogPage
      eyebrow="News & Events"
      title="Announcements, publishing updates, and community notices."
      description="A professional communications layer for launches, indexing updates, and calls for papers."
      items={newsItems}
      filters={['All', 'Announcement', 'Call for Papers', 'Update']}
      sidebarTitle="Stay informed"
      sidebarPoints={[
        'Follow open calls and special issue deadlines',
        'Track indexing and publishing updates',
        'Use contact for partnership and event inquiries',
      ]}
    />
  )
}

export default NewsPage
