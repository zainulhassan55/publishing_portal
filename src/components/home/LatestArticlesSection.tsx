import { Link } from 'react-router-dom'
import { latestArticles, newsItems } from '../../data/siteContent'
import Container from '../layout/Container'
import ActionLink from '../shared/ActionLink'
import SectionHeading from '../shared/SectionHeading'

function LatestArticlesSection() {
  const hasArticles = latestArticles.length > 0

  return (
    <section className="section-y bg-[#f7f9fb]">
      <Container>
        <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Recent Research"
            title={hasArticles ? 'Latest articles' : 'Publishing updates'}
            description={
              hasArticles
                ? 'Newly published work appears here as manuscripts complete peer review and production.'
                : 'Journals are open for submissions. Published articles will appear here after peer review.'
            }
          />
          <ActionLink to={hasArticles ? '/articles' : '/journals'} variant="primary" size="sm">
            {hasArticles ? 'View all articles' : 'Browse journals'}
          </ActionLink>
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="overflow-hidden rounded-xl border border-line bg-white">
            {hasArticles ? (
              latestArticles.slice(0, 5).map((article, index) => (
                <article
                  key={article.slug}
                  className="article-row border-b border-line px-5 py-4 last:border-b-0 sm:px-6 sm:py-5"
                >
                  <div className="flex gap-4">
                    <span className="mt-1 hidden w-8 shrink-0 font-display text-lg font-semibold text-accent-600 sm:block">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <p className="meta text-accent-700">
                        {article.type ?? 'Article'} · {article.journal}
                      </p>
                      <h3 className="mt-1.5 font-display text-lg leading-snug font-semibold text-ink-950 sm:text-xl">
                        <Link
                          to={`/articles/${article.slug}`}
                          className="transition hover:text-accent-700"
                        >
                          {article.title}
                        </Link>
                      </h3>
                      <p className="mt-1.5 text-sm text-slate-500">
                        {article.authors} · {article.meta}
                      </p>
                      <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-6 text-slate-600">
                        {article.excerpt}
                      </p>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="grid gap-0 sm:grid-cols-2">
                <div className="border-b border-line p-5 sm:border-r sm:border-b-0 sm:p-6">
                  <p className="meta text-accent-700">Status</p>
                  <h3 className="mt-2 font-display text-xl font-semibold text-ink-950">
                    Articles coming soon
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Peer-reviewed articles will be listed here with journal placement and DOI
                    records after production.
                  </p>
                  <ActionLink to="/journals" variant="secondary" size="sm" className="mt-4">
                    Submit manuscript
                  </ActionLink>
                </div>
                <div className="p-5 sm:p-6">
                  <p className="meta text-slate-500">Open now</p>
                  <ul className="mt-3 space-y-2.5 text-sm text-slate-600">
                    <li className="flex gap-2">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent-600" />
                      10 active open-access journals
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent-600" />
                      APC waived until September 2026
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent-600" />
                      Author guidelines and CFPs available
                    </li>
                  </ul>
                  <ActionLink to="/cfp" variant="secondary" size="sm" className="mt-4">
                    View open calls
                  </ActionLink>
                </div>
              </div>
            )}
          </div>

          <aside className="rounded-xl border border-line bg-white p-5 sm:p-6">
            <p className="meta text-accent-700">Announcements</p>
            <h2 className="mt-2 font-display text-xl font-semibold text-ink-950 sm:text-2xl">
              News and calls
            </h2>
            <div className="mt-4">
              {newsItems.slice(0, 3).map((item) => (
                <div
                  key={item.title}
                  className="border-t border-line py-3.5 first:border-t-0 first:pt-0 last:pb-0"
                >
                  <p className="meta text-slate-500">
                    {item.badge} · {item.meta}
                  </p>
                  <p className="mt-1.5 text-sm leading-6 font-semibold text-ink-950">{item.title}</p>
                </div>
              ))}
            </div>
            <ActionLink to="/cfp" variant="primary" size="sm" className="mt-5 w-full justify-center">
              View open calls
            </ActionLink>
          </aside>
        </div>
      </Container>
    </section>
  )
}

export default LatestArticlesSection
