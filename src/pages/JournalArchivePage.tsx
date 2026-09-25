import { useOutletContext } from 'react-router-dom'
import Container from '../components/layout/Container'
import FeatureCard from '../components/shared/FeatureCard'
import { issueArchives } from '../data/siteContent'
import type { JournalDetail } from '../types/content'

type JournalOutletContext = {
  journal: JournalDetail
}

function JournalArchivePage() {
  const { journal } = useOutletContext<JournalOutletContext>()
  const issues = issueArchives.filter((item) => item.journalSlug === journal.slug)

  return (
    <section className="section-y prose-justify bg-paper">
      <Container>
        <div className="mb-8 max-w-3xl">
          <p className="meta text-accent-700">Issue archive</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink-950">
            Volumes and issues
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Browse published volumes for {journal.shortTitle ?? journal.title} with highlights
            prepared for long-term scholarly archiving.
          </p>
        </div>

        {issues.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {issues.map((issue) => (
              <FeatureCard
                key={`${issue.volume}-${issue.issue}`}
                title={`${issue.volume} · ${issue.issue}`}
                description={issue.highlight}
                meta={issue.year}
                badge="Archive"
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-line bg-white p-8 text-sm leading-7 text-slate-600">
            Issue listings will appear here as volumes are published.
          </div>
        )}
      </Container>
    </section>
  )
}

export default JournalArchivePage
