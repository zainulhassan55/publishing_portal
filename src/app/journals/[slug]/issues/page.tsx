import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { JournalMasthead } from '@/components/mockup/JournalMasthead'
import { currentIssue, getArticles, issueArchive } from '@/data/content'
import { getJournal, journalCode, journalMenuGroups, journalSlugs } from '@/data/registry'
import { subjectFor } from '@/data/subjects'
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
  const journal = getJournal(slug)
  if (!journal) notFound()

  const code = journalCode(journal)
  const subject = subjectFor(slug)
  const own = (await getArticles()).filter((a) => a.journalSlug === slug)

  const masthead = {
    j: { slug, code, title: journal.title, subject: subject.label, color: subject.color },
    tab: 'Content',
    groups: journalMenuGroups(slug).map((g) => ({
      group: g.label,
      links: g.items.map((item) => ({ title: item.label, href: item.href })),
    })),
    articlesPublished: own.length,
    downloads: own.reduce((n, a) => n + (a.metrics?.downloads ?? 0), 0),
  }

  const current = currentIssue(slug)
  const fixtures = issueArchive(slug)
  const rows =
    fixtures.length > 0
      ? fixtures.map((i) => {
          const count = i.sections.reduce((n, s) => n + s.articleIds.length, 0)
          return {
            label: `Issue ${i.number} · ${i.publishedIso ? formatMonthYear(i.publishedIso) : i.year}`,
            meta: `${count} ${count === 1 ? 'article' : 'articles'}`,
            current: i === current,
          }
        })
      : [
          {
            label: 'Issue 2 · June 2026',
            meta: `${own.length} ${own.length === 1 ? 'article' : 'articles'}`,
            current: true,
          },
        ]

  const cur = { bar: 'var(--accent,#1D5DA8)', bg: 'var(--surface-2,#F5F6F7)', weight: 600 }
  const oth = { bar: 'var(--line,#DCE1E6)', bg: 'transparent', weight: 400 }

  return (
    <>
      <JournalMasthead {...masthead} />
      <div id="main-content" style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 32px 0' }}>
        <section id="archive" style={{ maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 13, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink,#101B27)', paddingBottom: 10, borderBottom: '2px solid var(--accent,#0B7265)' }}>Issue archive</h1>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, color: 'var(--ink,#101B27)', padding: '8px 0' }}>2026</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-3,#3C4854)', padding: '4px 0 8px' }}>Volume 1</span>
            {rows.map((i) => {
              const st = i.current ? cur : oth
              return (
                <div key={i.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 12px', borderLeft: `2px solid ${st.bar}`, background: st.bg, fontSize: 14 }}>
                  <span style={{ color: 'var(--ink,#101B27)', fontWeight: st.weight }}>{i.label}</span>
                  <span style={{ color: 'var(--muted,#505C68)', fontSize: 13 }}>{i.meta}</span>
                </div>
              )
            })}
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 13, lineHeight: 1.5, color: 'var(--muted,#505C68)' }}>Earlier volumes are listed here by year once published.</p>
          <Link href={`/journals/${slug}/current-issue`} style={{ fontSize: 14, fontWeight: 500 }}>
            View the current issue
          </Link>
        </section>
      </div>
    </>
  )
}
