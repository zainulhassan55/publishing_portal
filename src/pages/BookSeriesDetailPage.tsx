import { Link, useOutletContext } from 'react-router-dom'
import Container from '../components/layout/Container'
import ActionLink from '../components/shared/ActionLink'
import type { BookSeriesDetail } from '../types/content'

type BookSeriesOutletContext = {
  series: BookSeriesDetail
}

function BookSeriesDetailPage() {
  const { series } = useOutletContext<BookSeriesOutletContext>()
  const pages = series.pages ?? []

  return (
    <>
      <section className="prose-justify py-14 sm:py-16">
        <Container className="space-y-12">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr] lg:items-start">
            <article className="rounded-2xl border border-line bg-white p-7 shadow-[0_12px_36px_rgba(7,19,31,0.04)] sm:p-9">
              <p className="meta text-accent-700">Aims & scope</p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink-950">
                Series focus
              </h2>
              <div className="section-rule mt-5 max-w-20" />
              <p className="mt-6 text-base leading-8 text-slate-700">{series.scope}</p>
            </article>

            <aside className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl border border-line bg-ink-950 p-6 text-white">
                <p className="meta text-accent-300">For authors & editors</p>
                <h3 className="mt-3 font-display text-2xl font-semibold">Propose a volume</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Review the call for books and series scope before sending a proposal to the
                  editorial office.
                </p>
                <div className="mt-6 flex flex-col gap-2.5">
                  <ActionLink to="/contact" variant="light" size="sm" className="w-full">
                    Contact editorial office
                  </ActionLink>
                  {pages.find((page) => page.id === 'call-for-books') ? (
                    <ActionLink
                      to={`/books/${series.slug}/call-for-books`}
                      variant="ghost"
                      size="sm"
                      className="w-full"
                    >
                      Call for books
                    </ActionLink>
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-white p-6">
                <p className="meta text-accent-700">Editorial oversight</p>
                <div className="mt-4 space-y-3">
                  {series.board.map((member) => (
                    <p key={member} className="text-sm leading-7 text-slate-600">
                      {member}
                    </p>
                  ))}
                </div>
              </div>
            </aside>
          </div>

          <div>
            <div className="mb-6">
              <p className="meta text-accent-700">Topics of interest</p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink-950">
                What we publish
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {series.topics.map((topic, index) => (
                <div
                  key={topic}
                  className="rounded-xl border border-line bg-white p-4 transition hover:border-accent-600 hover:shadow-[0_12px_28px_rgba(7,19,31,0.06)]"
                >
                  <p className="font-display text-sm font-semibold text-accent-700">
                    {String(index + 1).padStart(2, '0')}
                  </p>
                  <p className="mt-2 text-sm leading-6 font-medium text-ink-950">{topic}</p>
                </div>
              ))}
            </div>
          </div>

          {pages.length > 0 ? (
            <div>
              <div className="mb-6">
                <p className="meta text-accent-700">Series documentation</p>
                <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink-950">
                  About & proposals
                </h2>
                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                  Full series pages covering scope, book types, open access, ethics, and how to
                  submit a proposal.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {pages.map((page, index) => (
                  <Link
                    key={page.id}
                    to={`/books/${series.slug}/${page.id}`}
                    className="group relative overflow-hidden rounded-2xl border border-line bg-white p-6 transition hover:-translate-y-1 hover:border-ink-700 hover:shadow-[0_18px_40px_rgba(7,19,31,0.08)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-display text-2xl font-semibold text-accent-600">
                        {String(index + 1).padStart(2, '0')}
                      </p>
                      <span className="rounded-md border border-line bg-paper-soft px-2 py-1 text-[11px] font-semibold tracking-[0.08em] text-slate-500 uppercase transition group-hover:border-ink-700 group-hover:text-ink-950">
                        Open
                      </span>
                    </div>
                    <h3 className="mt-4 font-display text-xl font-semibold text-ink-950">
                      {page.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{page.summary}</p>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </Container>
      </section>
    </>
  )
}

export default BookSeriesDetailPage
