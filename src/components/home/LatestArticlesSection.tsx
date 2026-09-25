import { Link } from 'react-router-dom'
import { latestArticles, newsItems } from '../../data/siteContent'
import Container from '../layout/Container'
import ActionLink from '../shared/ActionLink'
import SectionHeading from '../shared/SectionHeading'

function LatestArticlesSection() {
  return (
    <section className="bg-[#f7f9fb] py-16 sm:py-20">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1.25fr_0.75fr]">
          <div>
            <SectionHeading
              eyebrow="Recent Research"
              title="Latest articles"
              description="Newly published work appears here as manuscripts complete peer review and production."
            />

            <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-white">
              {latestArticles.length > 0 ? (
                latestArticles.slice(0, 5).map((article, index) => (
                  <article
                    key={article.slug}
                    className="article-row border-b border-line p-5 last:border-b-0 sm:p-6"
                  >
                    <div className="flex gap-4">
                      <span className="mt-1 hidden w-8 shrink-0 font-display text-lg font-semibold text-accent-600 sm:block">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <p className="meta text-accent-700">
                          {article.type ?? 'Article'} · {article.journal}
                        </p>
                        <h3 className="mt-2 font-display text-xl leading-snug font-semibold text-ink-950">
                          <Link
                            to={`/articles/${article.slug}`}
                            className="transition hover:text-accent-700"
                          >
                            {article.title}
                          </Link>
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                          {article.authors} · {article.meta}
                        </p>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                          {article.excerpt}
                        </p>
                        <ActionLink
                          to={`/articles/${article.slug}`}
                          variant="secondary"
                          size="sm"
                          className="mt-4"
                        >
                          Read article
                        </ActionLink>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="p-6 sm:p-8">
                  <p className="font-display text-xl font-semibold text-ink-950">
                    Articles coming soon
                  </p>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                    Journals are open for submissions. Published articles will be listed here after
                    peer review and production.
                  </p>
                  <ActionLink to="/journals" variant="primary" size="sm" className="mt-5">
                    Browse journals
                  </ActionLink>
                </div>
              )}
            </div>
          </div>

          <aside className="lg:pt-16">
            <div className="sticky top-28 rounded-2xl border border-line bg-white p-6 shadow-[0_12px_32px_rgba(7,19,31,0.05)]">
              <p className="meta text-accent-700">Announcements</p>
              <h2 className="mt-3 font-display text-2xl font-semibold text-ink-950">
                News and calls for papers
              </h2>
              <div className="mt-6">
                {newsItems.map((item) => (
                  <div
                    key={item.title}
                    className="border-t border-line py-5 first:border-t-0 first:pt-0 last:pb-0"
                  >
                    <p className="meta text-slate-500">
                      {item.badge} · {item.meta}
                    </p>
                    <p className="mt-2 text-sm leading-6 font-semibold text-ink-950">{item.title}</p>
                  </div>
                ))}
              </div>
              <ActionLink to="/cfp" variant="primary" size="sm" className="mt-6 w-full justify-center">
                View open calls
              </ActionLink>
            </div>
          </aside>
        </div>
      </Container>
    </section>
  )
}

export default LatestArticlesSection
