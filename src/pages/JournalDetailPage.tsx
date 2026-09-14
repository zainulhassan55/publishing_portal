import { Link, Navigate, useParams } from 'react-router-dom'
import Container from '../components/layout/Container'
import PageHero from '../components/layout/PageHero'
import ActionLink from '../components/shared/ActionLink'
import DetailSection from '../components/shared/DetailSection'
import SidebarPanel from '../components/shared/SidebarPanel'
import { journalDetails } from '../data/siteContent'

function JournalDetailPage() {
  const { slug } = useParams()
  const journal = journalDetails.find((item) => item.slug === slug)

  if (!journal) {
    return <Navigate to="/journals" replace />
  }

  return (
    <>
      <PageHero
        eyebrow="Journal profile"
        title={journal.title}
        description={journal.scope}
        aside={
          <div className="rounded-2xl border border-white/15 bg-white/5 p-6">
            <p className="meta text-slate-300">{journal.issn}</p>
            <p className="mt-2 text-sm text-slate-300">{journal.eIssn}</p>
            <p className="mt-4 font-display text-xl font-semibold text-white">{journal.area}</p>
            <p className="mt-2 text-sm text-slate-300">
              {journal.access} · {journal.frequency}
            </p>
            <p className="mt-3 text-sm text-slate-300">{journal.reviewType}</p>
            <p className="mt-1 text-sm text-slate-300">License: {journal.license}</p>
            <ActionLink
              to={`/journals/${journal.slug}/issues`}
              variant="light"
              size="sm"
              className="mt-5"
            >
              View issue archive
            </ActionLink>
          </div>
        }
      />

      <section className="bg-paper py-14 sm:py-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <DetailSection title="Aims and scope">
                <p>{journal.scope}</p>
              </DetailSection>
              <DetailSection title="Topics of interest">
                <ul className="space-y-2">
                  {journal.topics.map((topic) => (
                    <li key={topic} className="text-sm leading-7 text-slate-600">
                      {topic}
                    </li>
                  ))}
                </ul>
              </DetailSection>
              <DetailSection title="Editorial board">
                {journal.board.map((member) => (
                  <p key={member}>{member}</p>
                ))}
              </DetailSection>
            </div>

            <div className="space-y-4">
              <SidebarPanel title="Quick links">
                {journal.quickLinks.map((item) => (
                  <p key={item}>{item}</p>
                ))}
                <Link
                  to={`/journals/${journal.slug}/issues`}
                  className="block font-semibold text-ink-950 hover:underline"
                >
                  Open issue archive
                </Link>
                <Link to="/guidelines" className="block font-semibold text-ink-950 hover:underline">
                  Author guidelines
                </Link>
                <Link to="/login" className="block font-semibold text-ink-950 hover:underline">
                  Submit manuscript
                </Link>
              </SidebarPanel>
              <SidebarPanel title="Journal metrics">
                {journal.metrics.map((metric) => (
                  <p key={metric.label}>
                    <span className="font-semibold text-ink-950">{metric.value}</span> ·{' '}
                    {metric.label}
                  </p>
                ))}
              </SidebarPanel>
              <ActionLink to="/login" variant="primary" className="w-full">
                Submit manuscript
              </ActionLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}

export default JournalDetailPage
