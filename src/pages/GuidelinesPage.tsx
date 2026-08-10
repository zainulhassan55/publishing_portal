import CatalogPage from '../components/shared/CatalogPage'
import ActionLink from '../components/shared/ActionLink'
import { guidelines } from '../data/siteContent'

function GuidelinesPage() {
  return (
    <CatalogPage
      eyebrow="Guidelines"
      title="Public guidance for authors, reviewers, and editors."
      description="A clear hub for preparation standards, review expectations, and editorial responsibilities."
      items={guidelines}
      sidebarTitle="Before you submit"
      sidebarPoints={[
        'Prepare manuscript files according to author guidelines',
        'Confirm ethics statements and reference style',
        'Check journal-specific requirements where available',
      ]}
      action={<ActionLink to="/cfp" variant="secondary" size="sm">View open calls</ActionLink>}
    />
  )
}

export default GuidelinesPage
