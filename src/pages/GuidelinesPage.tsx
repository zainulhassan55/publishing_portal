import CatalogPage from '../components/shared/CatalogPage'
import ActionLink from '../components/shared/ActionLink'
import { guidelines } from '../data/siteContent'

function GuidelinesPage() {
  return (
    <CatalogPage
      eyebrow="Guidelines"
      title="Author, reviewer, editor, and proceedings guidance."
      description="Public standards for manuscript preparation, peer review, editorial practice, and conference series publishing."
      items={guidelines}
      sidebarTitle="Before you submit"
      sidebarPoints={[
        'Prepare files according to author guidelines',
        'Confirm ethics statements and reference style',
        'Review journal-specific scope and open calls',
      ]}
      action={
        <ActionLink to="/cfp" variant="secondary" size="sm">
          View open calls
        </ActionLink>
      }
    />
  )
}

export default GuidelinesPage
