import { Link, useOutletContext } from 'react-router-dom'
import Container from '../components/layout/Container'
import ActionLink from '../components/shared/ActionLink'
import { journalMenu } from '../data/journalTemplate'
import { ojsJournalRegisterUrl, ojsSubmitUrl } from '../lib/ojs'
import type { JournalDetail } from '../types/content'

type JournalOutletContext = {
  journal: JournalDetail
}

const topicPreviewCount = 12
const groupLinkClass = 'text-sm font-medium text-slate-700 transition hover:text-accent-700'

function JournalDetailPage() {
  const { journal } = useOutletContext<JournalOutletContext>()
  const pages = journal.pages ?? []
  const pageLabels = new Map(pages.map((page) => [page.id, page.label]))

  return (
    <>
      <section className="section-y prose-justify">
        <Container className="space-y-8">
          <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr] lg:items-stretch">
            <article className="flex flex-col rounded-xl border border-line bg-white p-5 shadow-[0_8px_22px_rgba(7,19,31,0.04)] sm:p-7">
              <p className="meta text-accent-700">Aims & scope</p>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink-950 sm:text-[1.85rem]">
                Research focus
              </h2>
              <div className="section-rule mt-4 max-w-20" />
              {(journal.overview ?? [journal.scope]).map((paragraph) => (
                <p key={paragraph.slice(0, 72)} className="mt-4 text-sm leading-7 text-slate-700 sm:text-base sm:leading-8">
                  {paragraph}
                </p>
              ))}
              <div className="mt-auto pt-5">
                {pageLabels.has('about') ? (
                  <Link
                    to={`/journals/${journal.slug}/about`}
                    className="text-sm font-semibold text-accent-700 transition hover:text-ink-950"
                  >
                    Read more about the journal →
                  </Link>
                ) : null}
                {journal.ownership ? (
                  <p className="mt-4 rounded-xl border border-line bg-paper-soft px-4 py-3 text-sm leading-7 text-slate-600">
                    {journal.ownership}
                  </p>
                ) : null}
              </div>
            </article>

            <aside className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 lg:grid-rows-[auto_1fr]">
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
              {journal.topics.slice(0, topicPreviewCount).map((topic, index) => (
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
            {journal.topics.length > topicPreviewCount && pageLabels.has('aims-scope') ? (
              <Link
                to={`/journals/${journal.slug}/aims-scope`}
                className="mt-5 inline-block text-sm font-semibold text-accent-700 transition hover:text-ink-950"
              >
                View all {journal.topics.length} topics in Aims & Scope →
              </Link>
            ) : null}
          </div>

          {pages.length > 0 ? (
            <div>
              <div className="mb-6">
                <p className="meta text-accent-700">Journal information</p>
                <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink-950">
                  About, authors, policies & content
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {journalMenu.map((group) => (
                  <div key={group.label} className="rounded-2xl border border-line bg-white p-6">
                    <h3 className="font-display text-xl font-semibold text-ink-950">{group.label}</h3>
                    <div className="section-rule mt-3 max-w-12" />
                    <ul className="mt-4 space-y-2.5">
                      {group.items.map((item) => (
                        <li key={item.kind === 'page' ? item.id : item.kind}>
                          {item.kind === 'submit' ? (
                            <a href={ojsSubmitUrl(journal.slug)} className={groupLinkClass}>
                              {item.label} ↗
                            </a>
                          ) : item.kind === 'archive' ? (
                            <Link to={`/journals/${journal.slug}/issues`} className={groupLinkClass}>
                              {item.label}
                            </Link>
                          ) : pageLabels.has(item.id) ? (
                            <Link to={`/journals/${journal.slug}/${item.id}`} className={groupLinkClass}>
                              {pageLabels.get(item.id)}
                            </Link>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
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
