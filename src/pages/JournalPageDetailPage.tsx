import { Navigate, useOutletContext, useParams } from 'react-router-dom'
import Container from '../components/layout/Container'
import ActionLink from '../components/shared/ActionLink'
import type { ContentBlock, JournalDetail } from '../types/content'

type JournalOutletContext = {
  journal: JournalDetail
}

function blockId(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function ContentBlockView({ block }: { block: ContentBlock }) {
  return (
    <article id={blockId(block.title)} className="scroll-mt-40 py-8 first:pt-2">
      <h2 className="font-display text-[1.65rem] font-semibold tracking-tight text-ink-950">
        {block.title}
      </h2>
      <div className="section-rule mt-3 max-w-14" />

      {block.paragraphs?.map((paragraph) => (
        <p key={paragraph.slice(0, 72)} className="mt-5 text-[1.02rem] leading-8 text-slate-700">
          {paragraph}
        </p>
      ))}

      {block.bullets && block.bullets.length > 0 ? (
        <ul className="mt-5 grid gap-2.5">
          {block.bullets.map((item) => (
            <li
              key={item}
              className="rounded-lg border border-line bg-paper-soft/70 px-4 py-3 text-sm leading-7 text-slate-700"
            >
              {item}
            </li>
          ))}
        </ul>
      ) : null}

      {block.subsections?.map((subsection) => (
        <div key={subsection.title} className="mt-6 border-t border-line pt-6">
          <h3 className="font-display text-lg font-semibold text-ink-950">{subsection.title}</h3>
          {subsection.paragraphs?.map((paragraph) => (
            <p key={paragraph.slice(0, 72)} className="mt-3 text-sm leading-7 text-slate-600">
              {paragraph}
            </p>
          ))}
          {subsection.bullets && subsection.bullets.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {subsection.bullets.map((item) => (
                <li
                  key={item}
                  className="relative pl-5 text-sm leading-7 text-slate-600 before:absolute before:top-3 before:left-0 before:h-1.5 before:w-1.5 before:rounded-full before:bg-accent-600"
                >
                  {item}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </article>
  )
}

function JournalPageDetailPage() {
  const { pageId } = useParams()
  const { journal } = useOutletContext<JournalOutletContext>()
  const page = journal.pages?.find((item) => item.id === pageId)

  if (!page) {
    return <Navigate to={`/journals/${journal.slug}`} replace />
  }

  return (
    <section className="bg-paper py-10 sm:py-12">
      <Container>
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 rounded-2xl border border-line bg-white p-6 sm:p-7">
            <p className="meta text-accent-700">{page.label}</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink-950">
              {page.title}
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">{page.summary}</p>
          </div>

          {page.blocks.length > 3 ? (
            <div className="mb-8 rounded-2xl border border-line bg-white p-5 sm:p-6">
              <p className="meta text-accent-700">On this page</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {page.blocks.map((block) => (
                  <a
                    key={block.title}
                    href={`#${blockId(block.title)}`}
                    className="rounded-md border border-line bg-paper-soft px-3 py-1.5 text-sm font-medium text-ink-950 transition hover:border-accent-600 hover:text-accent-700"
                  >
                    {block.title}
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-line bg-white px-6 py-4 shadow-[0_10px_30px_rgba(7,19,31,0.04)] sm:px-10 sm:py-6">
            {page.blocks.map((block) => (
              <ContentBlockView key={block.title} block={block} />
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-line bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-xl font-semibold text-ink-950">
                Continue with {journal.shortTitle ?? 'this journal'}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Return to overview or start a manuscript submission.
              </p>
            </div>
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <ActionLink to={`/journals/${journal.slug}`} variant="secondary" size="sm">
                Journal overview
              </ActionLink>
              <ActionLink to="/login" variant="primary" size="sm">
                Submit manuscript
              </ActionLink>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

export default JournalPageDetailPage
