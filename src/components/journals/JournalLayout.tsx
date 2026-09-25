import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom'
import JournalSubnav from './JournalSubnav'
import Container from '../layout/Container'
import ActionLink from '../shared/ActionLink'
import { journalDetails } from '../../data/siteContent'

function JournalMasthead() {
  const { slug } = useParams()
  const journal = journalDetails.find((item) => item.slug === slug)

  if (!journal) {
    return null
  }

  const pages = journal.pages ?? []

  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10 bg-ink-950 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 70% at 90% 10%, rgba(20,150,140,0.28), transparent 55%), linear-gradient(145deg, #07131f 0%, #102235 55%, #0c3532 100%)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <Container className="relative py-10 sm:py-12 lg:py-14">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-semibold tracking-[0.1em] text-white uppercase">
              {journal.shortTitle ?? 'Journal'}
            </span>
            <span className="rounded-md border border-white/15 px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] text-slate-200 uppercase">
              {journal.access}
            </span>
            <span className="rounded-md border border-white/15 px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] text-slate-200 uppercase">
              {journal.area}
            </span>
          </div>

          <h1 className="mt-4 max-w-4xl font-display text-[1.85rem] leading-tight font-semibold tracking-tight sm:text-3xl lg:text-[2.65rem]">
            {journal.title}
          </h1>
          <div className="section-rule mt-4 max-w-24" />
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 text-justify sm:text-base sm:leading-7">
            {journal.tagline ?? journal.scope}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <ActionLink to="/login" variant="light">
              Submit manuscript
            </ActionLink>
            <ActionLink to={`/journals/${journal.slug}/issues`} variant="ghost">
              Browse issues
            </ActionLink>
            {pages[0] ? (
              <ActionLink to={`/journals/${journal.slug}/${pages[0].id}`} variant="ghost">
                {pages[0].label}
              </ActionLink>
            ) : null}
          </div>

          <div className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {journal.metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-lg border border-white/12 bg-white/[0.05] px-4 py-3.5 backdrop-blur-sm"
              >
                <p className="font-display text-lg font-semibold text-white sm:text-xl">
                  {metric.value}
                </p>
                <p className="mt-1 text-sm text-slate-400">{metric.label}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-b border-line bg-white">
        <Container className="flex flex-wrap items-center gap-x-6 gap-y-2 py-3 text-sm text-slate-600">
          <span>
            <span className="font-semibold text-ink-950">{journal.issn}</span>
          </span>
          <span className="hidden text-line sm:inline">|</span>
          <span>
            <span className="font-semibold text-ink-950">{journal.eIssn}</span>
          </span>
          {journal.publisher ? (
            <>
              <span className="hidden text-line sm:inline">|</span>
              <span>
                Publisher:{' '}
                <span className="font-semibold text-ink-950">{journal.publisher}</span>
              </span>
            </>
          ) : null}
          <span className="hidden text-line sm:inline">|</span>
          <span>
            Review: <span className="font-semibold text-ink-950">{journal.reviewType}</span>
          </span>
          <span className="hidden text-line sm:inline">|</span>
          <span>
            License: <span className="font-semibold text-ink-950">{journal.license}</span>
          </span>
        </Container>
      </section>
    </>
  )
}

function getActiveTab(pathname: string, slug: string, pageIds: string[]) {
  if (pathname.endsWith('/issues')) {
    return 'issues'
  }

  const matchedPage = pageIds.find((id) => pathname.endsWith(`/${id}`))
  if (matchedPage) {
    return matchedPage
  }

  if (pathname.endsWith(`/journals/${slug}`) || pathname.endsWith(`/journals/${slug}/`)) {
    return 'overview'
  }

  return 'overview'
}

function JournalLayout() {
  const { slug } = useParams()
  const location = useLocation()
  const journal = journalDetails.find((item) => item.slug === slug)

  if (!journal) {
    return <Navigate to="/journals" replace />
  }

  const pages = journal.pages ?? []
  const active = getActiveTab(
    location.pathname,
    journal.slug,
    pages.map((page) => page.id),
  )

  return (
    <>
      <JournalMasthead />
      <JournalSubnav journalSlug={journal.slug} pages={pages} active={active} />
      <Outlet context={{ journal }} />
    </>
  )
}

export default JournalLayout
