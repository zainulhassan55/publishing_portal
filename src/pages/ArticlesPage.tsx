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
        title="Peer-reviewed articles from the NextGenIQ Press portfolio."
        description="Published articles appear here with journal placement, DOI metadata, and full article records."
      />

      <section className="section-y bg-paper">
        <Container>
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="mb-5">
                <FilterBar
                  items={['Most recent', 'Open access', 'By journal', 'By year', 'By topic']}
                />
              </div>

              <div className="grid gap-3">
                {latestArticles.length > 0 ? (
                  latestArticles.map((article) => (
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
                  ))
                ) : (
                  <div className="grid gap-0 overflow-hidden rounded-xl border border-line bg-white sm:grid-cols-2">
                    <div className="border-b border-line p-5 sm:border-r sm:border-b-0 sm:p-6">
                      <p className="meta text-accent-700">Archive status</p>
                      <h2 className="mt-2 font-display text-xl font-semibold text-ink-950">
                        No articles published yet
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Articles will appear here after peer review and production, with journal
                        placement and DOI records.
                      </p>
                      <ActionLink to="/journals" variant="primary" size="sm" className="mt-4">
                        Browse journals
                      </ActionLink>
                    </div>
                    <div className="p-5 sm:p-6">
                      <p className="meta text-slate-500">While you wait</p>
                      <ul className="mt-3 space-y-2.5 text-sm text-slate-600">
                        <li>Review author guidelines before submission</li>
                        <li>Check open calls for papers</li>
                        <li>Confirm journal scope and APC waiver details</li>
                      </ul>
                      <ActionLink to="/guidelines" variant="secondary" size="sm" className="mt-4">
                        Author guidelines
                      </ActionLink>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
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
              <ActionLink to="/journals" variant="primary" className="w-full">
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
