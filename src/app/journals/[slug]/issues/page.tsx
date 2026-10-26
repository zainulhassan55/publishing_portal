import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { JournalMasthead } from '@/components/mockup/JournalMasthead'
import { currentIssue, issueArchive } from '@/data/content'
import { getJournal, journalCode, journalSlugs } from '@/data/registry'
import { getPublication, mastheadFor } from '@/lib/publication'
import { formatMonthYear } from '@/lib/format'

export function generateStaticParams() {
  return journalSlugs.map((slug) => ({ slug }))
}

/**
 * Refreshed on the server rather than fixed at build. Published papers reach
 * this page through the scheduled harvest and the admin show/hide gate, both of
 * which purge the page cache (src/lib/articles/purge.ts); the hour here is the
 * safety net for when that purge is missed, not the normal delay.
 */
export const revalidate = 3600
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const journal = getJournal(slug)
  if (!journal) return {}

  const code = journalCode(journal)
  return {
    title: `Issue archive — ${code}`,
    description: `All published volumes and issues of ${journal.title}, newest first.`,
    alternates: { canonical: `/journals/${slug}/issues` },
  }
}

export default async function JournalIssuesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const pub = getPublication('journal', slug)
  if (!pub) notFound()

  const current = currentIssue(slug)
  const issues = issueArchive(slug)
  // Nothing published yet: there is no archive to show.
  if (issues.length === 0) redirect(`/journals/${slug}`)
  const masthead = mastheadFor(pub, 'home')

  // Volumes newest first, each with its issues in the order issueArchive gives.
  const volumes = [...new Set(issues.map((i) => i.volume))].map((volume) => {
    const inVolume = issues.filter((i) => i.volume === volume)
    return {
      volume,
      year: inVolume[0].year,
      rows: inVolume.map((i) => {
        const count = i.sections.reduce((n, s) => n + s.articleIds.length, 0)
        return {
          label: `Issue ${i.number} · ${i.publishedIso ? formatMonthYear(i.publishedIso) : i.year}`,
          meta: `${count} ${count === 1 ? 'article' : 'articles'}`,
          current: i === current,
        }
      }),
    }
  })

  const cur = { bar: 'var(--accent,#1D5DA8)', bg: 'var(--surface-2,#F5F6F7)', weight: 600 }
  const oth = { bar: 'var(--line,#DCE1E6)', bg: 'transparent', weight: 400 }

  return (
    <>
      <JournalMasthead {...masthead} />
      <div id="main-content" style={{ maxWidth: 1280, margin: '0 auto', padding: '40px var(--shell-pad) 0' }}>
        <section id="archive" style={{ maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 13, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink,#101B27)', paddingBottom: 10, borderBottom: '2px solid var(--accent,#0B7265)' }}>Issue archive</h1>
          {volumes.map((v) => (
            <div key={v.volume} style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, color: 'var(--ink,#101B27)', padding: '8px 0' }}>{v.year}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-3,#3C4854)', padding: '4px 0 8px' }}>Volume {v.volume}</span>
              {v.rows.map((i) => {
                const st = i.current ? cur : oth
                return (
                  <div key={i.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 12px', borderLeft: `2px solid ${st.bar}`, background: st.bg, fontSize: 14 }}>
                    <span style={{ color: 'var(--ink,#101B27)', fontWeight: st.weight }}>{i.label}</span>
                    <span style={{ color: 'var(--muted,#505C68)', fontSize: 13 }}>{i.meta}</span>
                  </div>
                )
              })}
            </div>
          ))}
          <Link href={`/journals/${slug}/current-issue`} style={{ fontSize: 14, fontWeight: 500 }}>
            View the current issue
          </Link>
        </section>
      </div>
    </>
  )
}
