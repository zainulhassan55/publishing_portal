import { Navigate, useParams } from 'react-router-dom'
import Container from '../components/layout/Container'
import PageHero from '../components/layout/PageHero'
import FeatureCard from '../components/shared/FeatureCard'
import SidebarPanel from '../components/shared/SidebarPanel'
import { issueArchives, journalDetails } from '../data/siteContent'

function JournalArchivePage() {
  const { slug } = useParams()
  const journal = journalDetails.find((item) => item.slug === slug)

  if (!journal) {
    return <Navigate to="/journals" replace />
  }

  const issues = issueArchives.filter((item) => item.journalSlug === journal.slug)

  return (
    <>
      <PageHero
        eyebrow="Issue archive"
        title={`${journal.title} archive`}
        description="Browse volumes and issues in a clean scholarly archive structure."
      />

      <section className="bg-paper py-14 sm:py-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="grid gap-4">
              {issues.map((issue) => (
                <FeatureCard
                  key={`${issue.volume}-${issue.issue}`}
                  title={`${issue.volume} · ${issue.issue}`}
                  description={issue.highlight}
                  meta={issue.year}
                  badge="Archive"
                />
              ))}
            </div>

            <SidebarPanel title="Archive structure">
              <p>Volume-first organization for long-term growth</p>
              <p>Issue highlights and content grouping</p>
              <p>Prepared for article listings and pagination</p>
            </SidebarPanel>
          </div>
        </Container>
      </section>
    </>
  )
}

export default JournalArchivePage
