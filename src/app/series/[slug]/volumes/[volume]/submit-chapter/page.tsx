import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FormLauncher } from '@/components/forms/FormLauncher'
import { JournalMasthead } from '@/components/mockup/JournalMasthead'
import { contributorLine } from '@/components/series/SeriesPageView'
import { getSeries } from '@/data/registry'
import { volumeWithOpenCall } from '@/lib/books/volumes'
import { formatDate } from '@/lib/format'
import { getPublication, mastheadFor } from '@/lib/publication'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ slug: string; volume: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, volume } = await params
  const series = getSeries(slug)
  const v = series ? await volumeWithOpenCall(slug, volume) : undefined
  if (!series || !v) return { title: 'Call for chapters' }
  return { title: `Call for chapters: ${v.title} — ${series.code}`, alternates: { canonical: `/series/${slug}/volumes/${v.slug}/submit-chapter` } }
}

/** The call for chapters for one volume, and the submission form. A closed call is a 404. */
export default async function SubmitChapterPage({ params }: Params) {
  const { slug, volume } = await params
  const series = getSeries(slug)
  const pub = getPublication('series', slug)
  const v = series ? await volumeWithOpenCall(slug, volume) : undefined
  if (!series || !pub || !v) notFound()

  return (
    <>
      <JournalMasthead {...mastheadFor(pub, 'Contributors')} />
      <div id="main-content" style={{ maxWidth: 820, margin: '0 auto', padding: '32px var(--shell-pad) 0' }}>
        <span style={{ fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted,#505C68)', fontWeight: 500 }}>Call for chapters</span>
        <h1 style={{ margin: '6px 0 8px', fontFamily: 'var(--font-serif)', fontSize: 32, lineHeight: 1.2, fontWeight: 600 }}>{v.title}</h1>
        <p style={{ margin: '0 0 4px', fontSize: 15, color: 'var(--ink-2,#1F2A36)' }}>{contributorLine(v)}</p>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--muted,#505C68)' }}>
          {series.title}
          {v.cfpDeadline ? ` · Submission deadline ${formatDate(v.cfpDeadline)}` : ''}
        </p>
        {(v.cfpText ?? v.abstract ?? '').split(/\n{2,}/).filter(Boolean).map((p) => (
          <p key={p} style={{ margin: '0 0 14px', fontSize: 17, lineHeight: 1.7, color: 'var(--ink-2,#1F2A36)', whiteSpace: 'pre-line' }}>
            {p}
          </p>
        ))}
        <p style={{ margin: '0 0 28px', fontSize: 14, color: 'var(--ink-3,#3C4854)' }}>
          Read the <Link href={`/series/${slug}/author-editor-guidelines`}>author and editor guidelines</Link> and the{' '}
          <Link href={`/series/${slug}/peer-review-ethics`}>peer review and ethics</Link> policy before submitting.
        </p>
        <FormLauncher
          id="submit"
          href={`/series/${slug}/volumes/${v.slug}/submit-chapter/form`}
          title="Submit your chapter"
          description="The form asks for the chapter title, authors and corresponding author, abstract, keywords and declarations, and an anonymised manuscript with a separate title page."
        />
      </div>
    </>
  )
}
