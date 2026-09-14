import Container from '../components/layout/Container'
import PageHero from '../components/layout/PageHero'
import ActionLink from '../components/shared/ActionLink'
import FeatureCard from '../components/shared/FeatureCard'
import FilterBar from '../components/shared/FilterBar'
import SidebarPanel from '../components/shared/SidebarPanel'
import { latestArticles } from '../data/siteContent'

function ArticlesPage() {
  return (
    <>
      <PageHero
        eyebrow="Articles"
        title="Recent peer-reviewed articles across the DMPedia portfolio."
        description="Browse newly published research with clear journal placement, DOI metadata, and full article records."
      />

      <section className="bg-paper py-14 sm:py-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="mb-6">
                <FilterBar
                  items={['Most recent', 'Open access', 'By journal', 'By year', 'By topic']}
                />
              </div>

              <div className="grid gap-4">
                {latestArticles.map((article) => (
                  <FeatureCard
                    key={article.slug}
                    title={article.title}
                    description={article.excerpt}
                    meta={article.journal}
                    badge={article.type ?? article.meta}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-slate-500">
                        {article.authors}
                        {article.doi ? ` · DOI ${article.doi}` : ''}
                      </p>
                      <ActionLink to={`/articles/${article.slug}`} variant="secondary" size="sm">
                        Read article
                      </ActionLink>
                    </div>
                  </FeatureCard>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <SidebarPanel title="Reader focus">
                <p>Clear titles, abstracts, and DOI presentation</p>
                <p>Visible journal and issue placement</p>
                <p>Fast movement from summary to full record</p>
              </SidebarPanel>
              <SidebarPanel title="Author next steps">
                <p>Review guidelines before submission</p>
                <p>Check journal scope and open calls</p>
                <p>Contact the editorial office for inquiries</p>
              </SidebarPanel>
              <ActionLink to="/login" variant="primary" className="w-full">
                Submit manuscript
              </ActionLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}

export default ArticlesPage
