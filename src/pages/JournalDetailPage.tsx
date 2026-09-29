import { Link, useOutletContext } from 'react-router-dom'
import Container from '../components/layout/Container'
import ActionLink from '../components/shared/ActionLink'
import { ojsJournalRegisterUrl, ojsSubmitUrl } from '../lib/ojs'
import type { JournalDetail } from '../types/content'

type JournalOutletContext = {
  journal: JournalDetail
}

function JournalDetailPage() {
  const { journal } = useOutletContext<JournalOutletContext>()
  const pages = journal.pages ?? []

  return (
    <>
      <section className="section-y prose-justify">
        <Container className="space-y-8">
          <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr] lg:items-start">
            <article className="rounded-xl border border-line bg-white p-5 shadow-[0_8px_22px_rgba(7,19,31,0.04)] sm:p-7">
              <p className="meta text-accent-700">Aims & scope</p>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink-950 sm:text-[1.85rem]">
                Research focus
              </h2>
              <div className="section-rule mt-4 max-w-20" />
              <p className="mt-4 text-sm leading-7 text-slate-700 sm:text-base sm:leading-8">{journal.scope}</p>
              {journal.ownership ? (
                <p className="mt-5 rounded-xl border border-line bg-paper-soft px-4 py-3 text-sm leading-7 text-slate-600">
                  {journal.ownership}
                </p>
              ) : null}
            </article>

            <aside className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl border border-line bg-ink-950 p-6 text-white">
                <p className="meta text-accent-300">For authors</p>
                <h3 className="mt-3 font-display text-2xl font-semibold">Ready to submit?</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Review author instructions, ethics, and APC details before opening a new
                  submission.
                </p>
                <div className="mt-6 flex flex-col gap-2.5">
                  <ActionLink href={ojsSubmitUrl(journal.slug)} variant="light" size="sm" className="w-full">
                    Submit manuscript
                  </ActionLink>
                  <ActionLink
                    href={ojsJournalRegisterUrl(journal.slug)}
                    variant="ghost"
                    size="sm"
                    className="w-full"
                  >
                    Register as author or reviewer
                  </ActionLink>
                  {pages.find((page) => page.id === 'author-instructions') ? (
                    <ActionLink
                      to={`/journals/${journal.slug}/author-instructions`}
                      variant="ghost"
                      size="sm"
                      className="w-full"
                    >
                      Author instructions
                    </ActionLink>
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-white p-6">
                <p className="meta text-accent-700">Editorial leadership</p>
                <div className="mt-4 space-y-3">
                  {journal.board.map((member) => (
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
              {journal.topics.map((topic, index) => (
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
                <p className="meta text-accent-700">Journal documentation</p>
                <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink-950">
                  Policies & guidance
                </h2>
                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                  Complete journal pages for authors, editors, and readers — covering about,
                  instructions, charges, ethics, and editorial workflow.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {pages.map((page, index) => (
                  <Link
                    key={page.id}
                    to={`/journals/${journal.slug}/${page.id}`}
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
                      {page.label}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{page.summary}</p>
                    <p className="mt-5 text-sm font-semibold text-accent-700 transition group-hover:text-ink-950">
                      Read full page →
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </Container>
      </section>

      <section className="border-t border-line bg-ink-950 py-12 text-white">
        <Container className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="meta text-accent-300">{journal.shortTitle ?? 'Journal'}</p>
            <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
              Publish with {journal.shortTitle ?? journal.title}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
              {journal.frequency} · {journal.license} · {journal.reviewType}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ActionLink href={ojsSubmitUrl(journal.slug)} variant="light">
              Submit manuscript
            </ActionLink>
            <ActionLink to={`/journals/${journal.slug}/issues`} variant="ghost">
              View issues
            </ActionLink>
          </div>
        </Container>
      </section>
    </>
  )
}

export default JournalDetailPage
