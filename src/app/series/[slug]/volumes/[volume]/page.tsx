import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PdfViewer } from '@/components/article/PdfViewer'
import { JournalMasthead } from '@/components/mockup/JournalMasthead'
import { contributorLine } from '@/components/series/SeriesPageView'
import { JsonLd } from '@/components/seo/JsonLd'
import { getSeries } from '@/data/registry'
import { volumeCitationMeta, volumeJsonLd, volumeUrl } from '@/lib/books/meta'
import { callIsOpen, publishedVolume } from '@/lib/books/volumes'
import { clampText, formatDate } from '@/lib/format'
import { VOLUME_FORMATS } from '@/lib/forms/options'
import { getPublication, mastheadFor } from '@/lib/publication'
import { doiUrl } from '@/lib/site'

/** Rendered on request and cached; the admin volume screen purges it on every change. */
export const revalidate = 3600

type Params = { params: Promise<{ slug: string; volume: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, volume } = await params
  const series = getSeries(slug)
  const v = series ? await publishedVolume(slug, volume) : undefined
  if (!series || !v) return {}
  const title = v.subtitle ? `${v.title}: ${v.subtitle}` : v.title
  return {
    title: `${title} — ${series.code}`,
    description: clampText(v.abstract ?? `${title}, a volume in ${series.title}.`),
    alternates: { canonical: volumeUrl(v) },
    openGraph: { type: 'book', title, url: volumeUrl(v) },
    other: volumeCitationMeta(v, series),
  }
}

const dt = { fontSize: 13, color: 'var(--muted,#505C68)' } as const
const dd = { margin: 0, fontSize: 14, color: 'var(--ink-2,#1F2A36)', overflowWrap: 'anywhere' as const }
const h2 = { margin: '0 0 12px', fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, color: 'var(--ink,#101B27)', borderBottom: '2px solid var(--accent,#0B7265)', paddingBottom: 8 } as const

export default async function VolumePage({ params }: Params) {
  const { slug, volume } = await params
  const series = getSeries(slug)
  const pub = getPublication('series', slug)
  const v = series ? await publishedVolume(slug, volume) : undefined
  if (!series || !pub || !v) notFound()

  const base = volumeUrl(v)
  const title = v.subtitle ? `${v.title}: ${v.subtitle}` : v.title
  const format = VOLUME_FORMATS.find((f) => f.value === v.format)?.label ?? 'Volume'
  const facts: [string, string][] = [
    ['Format', format],
    ...(v.volumeNumber ? ([['Volume', String(v.volumeNumber)]] as [string, string][]) : []),
    ...(v.publishedAt ? ([['Published', formatDate(v.publishedAt)]] as [string, string][]) : []),
    ...(v.isbnOnline ? ([['ISBN (online)', v.isbnOnline]] as [string, string][]) : []),
    ...(v.isbnPrint ? ([['ISBN (print)', v.isbnPrint]] as [string, string][]) : []),
    ...(v.pages ? ([['Pages', String(v.pages)]] as [string, string][]) : []),
    ['Licence', v.licence],
  ]

  return (
    <>
      <JsonLd data={volumeJsonLd(v, series)} />
      <style>{`@media (max-width:760px){.vol-aside{position:static!important}.vol-h1{font-size:27px!important}}`}</style>
      <JournalMasthead {...mastheadFor(pub, 'Volumes')} />
      <div id="main-content" style={{ maxWidth: 1280, margin: '0 auto', padding: '32px var(--shell-pad) 0', display: 'flex', gap: 48, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <article style={{ flex: '1 1 600px', minWidth: 0, maxWidth: 820 }}>
          <span style={{ fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--warm,#B5400F)', fontWeight: 600 }}>
            {format} · Open access
          </span>
          <h1 className="vol-h1" style={{ margin: '8px 0 10px', fontFamily: 'var(--font-serif)', fontSize: 34, lineHeight: 1.2, fontWeight: 600, color: 'var(--ink,#101B27)', textWrap: 'balance' }}>{title}</h1>
          <p style={{ margin: '0 0 6px', fontSize: 16, color: 'var(--ink-2,#1F2A36)' }}>{contributorLine(v)}</p>
          <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--muted,#505C68)' }}>
            {series.title}
            {v.doi ? (
              <>
                {' · '}
                <a href={doiUrl(v.doi)} style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                  doi.org/{v.doi}
                </a>
              </>
            ) : null}
          </p>

          {v.abstract ? (
            <section style={{ marginBottom: 32 }}>
              <h2 style={h2}>Abstract</h2>
              {v.abstract.split(/\n{2,}/).map((p) => (
                <p key={p} style={{ margin: '0 0 14px', fontSize: 17, lineHeight: 1.7, color: 'var(--ink-2,#1F2A36)' }}>
                  {p}
                </p>
              ))}
              {v.keywords.length ? <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-3,#3C4854)' }}>Keywords: {v.keywords.join(', ')}</p> : null}
            </section>
          ) : null}

          {v.chapters.length ? (
            <section style={{ marginBottom: 32 }}>
              <h2 style={h2}>Chapters</h2>
              <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {v.chapters.map((c) => (
                  <li key={c.id} style={{ padding: '14px 0', borderBottom: '1px solid var(--line,#DCE1E6)', display: 'grid', gridTemplateColumns: '36px minmax(0,1fr)', gap: 12 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted,#505C68)', paddingTop: 3 }}>{c.seq}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600, lineHeight: 1.35 }}>{c.title}</span>
                      <span style={{ fontSize: 14, color: 'var(--ink-3,#3C4854)' }}>{c.authors.map((a) => a.name).join(', ')}</span>
                      <span style={{ fontSize: 13, color: 'var(--muted,#505C68)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {c.pageRange ? <span>pp. {c.pageRange}</span> : null}
                        {c.doi ? <a href={doiUrl(c.doi)}>doi.org/{c.doi}</a> : null}
                        {c.pdfUploadId ? <a href={`${base}/chapters/${c.seq}/pdf`}>Chapter PDF</a> : null}
                      </span>
                      {c.abstract ? (
                        <details style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2,#1F2A36)' }}>
                          <summary style={{ cursor: 'pointer', color: 'var(--accent,#1D5DA8)' }}>Abstract</summary>
                          <p style={{ margin: '6px 0 0' }}>{c.abstract}</p>
                        </details>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {v.pdfUploadId ? (
            <section style={{ marginBottom: 32 }}>
              <h2 style={h2}>Read the volume</h2>
              <PdfViewer src={`${base}/pdf`} downloadHref={`${base}/pdf?download=1`} title={title} />
            </section>
          ) : null}
        </article>

        <aside className="vol-aside m-full" style={{ flex: '0 1 300px', display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 16 }}>
          {v.pdfUploadId ? (
            <a href={`${base}/pdf?download=1`} style={{ background: 'var(--accent,#1D5DA8)', color: '#fff', padding: '11px 16px', borderRadius: 3, fontSize: 15, fontWeight: 500, textAlign: 'center', textDecoration: 'none' }}>
              Download PDF
            </a>
          ) : null}
          {v.coverUploadId ? (
            // A cover from the publications bucket, relayed by the portal; next/image cannot optimise a route response here.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`${base}/cover`} alt={`Cover of ${title}`} style={{ width: '100%', maxWidth: 260, border: '1px solid var(--line,#DCE1E6)', borderRadius: 2 }} />
          ) : null}
          <dl style={{ margin: 0, border: '1px solid var(--line,#DCE1E6)', borderRadius: 3, padding: 16, display: 'grid', gridTemplateColumns: 'max-content minmax(0,1fr)', gap: '8px 14px' }}>
            {facts.map(([k, val]) => (
              <div key={k} style={{ display: 'contents' }}>
                <dt style={dt}>{k}</dt>
                <dd style={dd}>{val}</dd>
              </div>
            ))}
          </dl>
          <div style={{ border: '1px solid var(--line,#DCE1E6)', borderRadius: 3, padding: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Contributors</span>
            {v.contributors.map((c) => (
              <span key={c.name} style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--ink-3,#3C4854)' }}>
                <strong style={{ color: 'var(--ink,#101B27)' }}>{c.name}</strong>
                {c.role === 'editor' ? ' (editor)' : ''}
                {c.affiliation ? `, ${c.affiliation}` : ''}
              </span>
            ))}
          </div>
          {callIsOpen(v) ? (
            <Link href={`${base}/submit-chapter`} style={{ fontSize: 14, fontWeight: 500 }}>
              This volume is accepting chapters →
            </Link>
          ) : null}
          <Link href={`/series/${slug}/volumes`} style={{ fontSize: 14 }}>
            All {series.code} volumes
          </Link>
        </aside>
      </div>
    </>
  )
}
