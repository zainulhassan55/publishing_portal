import { Link } from 'react-router-dom'
import { latestArticles, newsItems } from '../../data/siteContent'
import Container from '../layout/Container'
import ActionLink from '../shared/ActionLink'
import SectionHeading from '../shared/SectionHeading'

function LatestArticlesSection() {
  return (
    <section className="bg-white py-16 sm:py-20">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <SectionHeading
              eyebrow="Recent Research"
              title="Latest articles"
              description="Newly published work across the Northfield Scholarly Press portfolio."
            />

            <div className="mt-8 divide-y divide-line surface-soft">
              {latestArticles.map((article) => (
                <article key={article.slug} className="p-5 sm:p-6">
                  <p className="meta">{article.journal}</p>
                  <h3 className="mt-2 font-display text-xl leading-snug font-semibold text-ink-950">
                    <Link to={`/articles/${article.slug}`} className="hover:underline">
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
                </article>
              ))}
            </div>
          </div>

          <aside>
            <div className="surface-soft p-6">
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
                    <p className="meta">
                      {item.badge} · {item.meta}
                    </p>
                    <p className="mt-2 text-sm leading-6 font-semibold text-ink-950">
                      {item.title}
                    </p>
                  </div>
                ))}
              </div>
              <ActionLink to="/cfp" variant="primary" className="mt-6 w-full">
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
