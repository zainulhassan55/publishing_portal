import { Link } from 'react-router-dom'
import { latestArticles, newsItems } from '../../data/siteContent'
import Container from '../layout/Container'
import ActionLink from '../shared/ActionLink'
import SectionHeading from '../shared/SectionHeading'

function LatestArticlesSection() {
  return (
    <section className="relative overflow-hidden bg-white py-16 sm:py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,rgba(20,150,140,0.08),transparent_60%)]"
      />

      <Container className="relative">
        <div className="grid gap-10 lg:grid-cols-[1.25fr_0.75fr]">
          <div>
            <SectionHeading
              eyebrow="Recent Research"
              title="Latest articles"
              description="Newly published work across the Digital Manuscriptpedia journal portfolio."
            />

            <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-paper-soft/70">
              {latestArticles.slice(0, 5).map((article, index) => (
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
                        <Link to={`/articles/${article.slug}`} className="transition hover:text-accent-700">
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
              ))}
            </div>
          </div>

          <aside className="lg:pt-16">
            <div className="sticky top-28 overflow-hidden rounded-2xl border border-line bg-ink-950 p-6 text-white shadow-[0_20px_50px_rgba(7,19,31,0.18)]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full bg-accent-500/25 blur-2xl"
              />
              <p className="meta relative text-accent-300">Announcements</p>
              <h2 className="relative mt-3 font-display text-2xl font-semibold text-white">
                News and calls for papers
              </h2>
              <div className="relative mt-6">
                {newsItems.map((item) => (
                  <div
                    key={item.title}
                    className="border-t border-white/10 py-5 first:border-t-0 first:pt-0 last:pb-0"
                  >
                    <p className="meta text-accent-300">
                      {item.badge} · {item.meta}
                    </p>
                    <p className="mt-2 text-sm leading-6 font-semibold text-white">{item.title}</p>
                  </div>
                ))}
              </div>
              <ActionLink to="/cfp" variant="light" className="relative mt-6 w-full">
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
