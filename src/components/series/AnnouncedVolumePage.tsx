import Link from 'next/link'
import { JournalMasthead } from '@/components/mockup/JournalMasthead'
import type { ReactNode } from 'react'
import { volumeAccessLabel, volumeDateLine, volumeEditorLine, volumeStatusLine } from '@/data/registry'
import type { Publication } from '@/lib/publication'
import { mastheadFor } from '@/lib/publication'
import { doiUrl, siteName } from '@/lib/site'
import type { Series, SeriesVolume } from '@/types/publishing'

const body = { margin: '0 0 14px', fontSize: 16, lineHeight: 1.7, color: 'var(--ink-2,#1F2A36)' } as const
const label = { margin: '0 0 8px', fontSize: 16, fontWeight: 600, color: 'var(--ink,#101B27)' } as const
const pending = { margin: '0 0 14px', fontSize: 15, lineHeight: 1.6, color: 'var(--muted,#505C68)', fontStyle: 'italic' } as const
const fact = { margin: '0 0 4px', fontSize: 14, color: 'var(--ink-3,#3C4854)' } as const
const tba = { color: 'var(--muted,#505C68)', fontStyle: 'italic' } as const
// ISBNs and contributor names are set bold wherever a volume is shown (publisher, November 2026).
const strong = { fontWeight: 700, color: 'var(--ink,#101B27)' } as const
const list = { margin: '0 0 18px', paddingLeft: 22, listStyle: 'disc', fontSize: 16, lineHeight: 1.8, color: 'var(--ink-2,#1F2A36)' } as const

/**
 * One collapsible section of the volume page ("Bibliographic Information",
 * "Table of Contents", …), modelled on publishers' book pages. A native
 * <details>: no JavaScript, keyboard and screen-reader friendly, and the
 * content stays in the server-rendered HTML for search engines.
 */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="av-sec" style={{ borderBottom: '1px solid var(--line,#DCE1E6)' }}>
      <summary style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '20px 4px', cursor: 'pointer', listStyle: 'none', fontSize: 20, fontWeight: 600, color: 'var(--ink,#101B27)' }}>
        <span>{title}</span>
        <span className="av-chev" aria-hidden="true" style={{ flex: '0 0 auto', width: 11, height: 11, borderRight: '2px solid var(--ink-3,#3C4854)', borderBottom: '2px solid var(--ink-3,#3C4854)', transform: 'rotate(45deg)', marginRight: 6, transition: 'transform .15s' }} />
      </summary>
      <div style={{ padding: '0 4px 24px' }}>{children}</div>
    </details>
  )
}

/** The page of a volume announced in a series' data file (`Series.volumes`). */
export function AnnouncedVolumePage({ series, pub, volume: v }: { series: Series; pub: Publication; volume: SeriesVolume }) {
  const hasDescription = v.description.length > 0 || v.readership !== null || Boolean(v.coverage)
  const seriesHome = `/series/${series.slug}`
  const authored = v.contributorRole === 'authors'

  const bibliographic: [string, ReactNode][] = [
    ['Series', `${series.title} (${series.code})`],
    ['Volume', String(v.number)],
    [authored ? 'Authors' : 'Editors', <strong key="by" style={strong}>{volumeEditorLine(v.editors)}</strong>],
    ['Publisher', siteName],
    ['Format', 'E-book (PDF)'],
    ...(v.pages ? ([['Pages', String(v.pages)]] as [string, ReactNode][]) : []),
    ['ISBN', v.isbn ? <strong key="isbn" style={strong}>{v.isbn}</strong> : <span style={tba}>To be assigned</span>],
    ...(v.doi ? ([['DOI', <a key="doi" href={doiUrl(v.doi)}>{doiUrl(v.doi)}</a>]] as [string, ReactNode][]) : []),
    [v.publishedDate ? 'Date of publication' : 'Expected date of publication', v.publishedDate ?? v.expectedDate],
    ...(volumeAccessLabel(v) ? ([['Access', v.access === 'open' ? 'Open access · CC BY 4.0' : 'Subscription access']] as [string, ReactNode][]) : []),
  ]

  const contents = v.contents.length ? (
    <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
      {v.contents.map((c, i) => (
        <li key={c} style={{ display: 'grid', gridTemplateColumns: '92px minmax(0,1fr)', gap: 12, padding: '12px 0', borderTop: i ? '1px solid var(--line,#DCE1E6)' : 'none', fontSize: 16, lineHeight: 1.55, color: 'var(--ink-2,#1F2A36)' }}>
          <span style={{ fontWeight: 600, color: 'var(--ink,#101B27)' }}>Chapter {i + 1}</span>
          <span>{c}</span>
        </li>
      ))}
    </ol>
  ) : (
    <p style={{ ...pending, margin: 0 }}>Coming soon.</p>
  )

  const description = hasDescription ? (
    <>
      {v.description.map((p) => (
        <p key={p} style={body}>
          {p}
        </p>
      ))}
      {v.coverage ? (
        <>
          <p style={label}>Coverage:</p>
          <p style={body}>{v.coverage.intro}</p>
          <ul style={list}>
            {v.coverage.topics.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </>
      ) : null}
      {v.keywords?.length ? (
        <p style={body}>
          <strong style={{ color: 'var(--ink,#101B27)' }}>Keywords:</strong> {v.keywords.join(', ')}
        </p>
      ) : null}
      {v.readership ? (
        <p style={body}>
          <strong style={{ color: 'var(--ink,#101B27)' }}>Readership:</strong> {v.readership}
        </p>
      ) : null}
    </>
  ) : (
    <p style={{ ...pending, margin: 0 }}>The book description and readership will be published here soon.</p>
  )

  const authors = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {v.editors.map((e) => (
        <div key={e.name} style={{ paddingBottom: 18, borderBottom: '1px solid var(--line,#DCE1E6)' }}>
          <p style={{ margin: '0 0 2px', fontFamily: 'var(--font-serif)', fontSize: 19, fontWeight: 600, color: 'var(--ink,#101B27)' }}>{e.name}</p>
          <p style={{ margin: '0 0 10px', fontSize: 14, fontStyle: 'italic', color: 'var(--muted,#505C68)' }}>{e.affiliation}</p>
          {e.biography?.length ? (
            e.biography.map((p, i) => (
              <p key={i} style={i === e.biography!.length - 1 ? { ...body, margin: 0 } : body}>
                {p}
              </p>
            ))
          ) : (
            <p style={{ ...pending, margin: 0 }}>Biography to follow.</p>
          )}
        </div>
      ))}
    </div>
  )

  return (
    <>
      <style>{`.av-sec>summary::-webkit-details-marker{display:none}.av-sec>summary:hover>span:first-child{color:var(--accent,#0C8375)}.av-sec>summary:focus-visible{outline:2px solid var(--accent,#0C8375);outline-offset:2px}.av-sec[open]>summary>.av-chev{transform:rotate(-135deg)!important}@media (max-width:640px){.av-head{flex-direction:column!important}.av-ids{margin:0!important}.av-cover{width:140px!important}.av-h1{font-size:25px!important}.av-sec>summary{font-size:18px!important}.av-sec ol>li{grid-template-columns:1fr!important;gap:2px!important}}`}</style>
      <JournalMasthead {...mastheadFor(pub, 'Volumes')} />
      <div id="main-content" style={{ maxWidth: 1280, margin: '0 auto', padding: '32px var(--shell-pad) 48px' }}>
        <article style={{ maxWidth: 960 }}>
          <div className="av-head" style={{ display: 'flex', gap: 28, alignItems: 'flex-start', padding: 24, border: '1px solid var(--line,#DCE1E6)', borderRadius: 4, background: 'var(--surface,#fff)', marginBottom: 32 }}>
            {/* The series cover stands in until the volume has its own. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="av-cover"
              src={v.cover ?? series.profile.tile}
              alt={v.cover ? `Cover of ${v.title}` : `Cover of ${series.title}`}
              width={v.cover ? 600 : 150}
              height={v.cover ? 888 : 200}
              style={{ width: 150, height: 'auto', aspectRatio: v.cover ? undefined : '3 / 4', objectFit: 'cover', flex: '0 0 auto', border: '1px solid var(--line,#DCE1E6)', borderRadius: 2 }}
            />
            <div style={{ minWidth: 0 }}>
              <Link href={`/series/${series.slug}`} style={{ fontSize: 16, fontWeight: 600, color: 'var(--accent,#0C8375)', textDecoration: 'none' }}>
                {series.title}
              </Link>
              <p style={{ margin: '6px 0 0', fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--warm,#C2410C)', fontWeight: 600 }}>
                Volume {v.number} · {volumeStatusLine(v)}
              </p>
              <h1 className="av-h1" style={{ margin: '8px 0 14px', fontFamily: 'var(--font-serif)', fontSize: 30, lineHeight: 1.25, fontWeight: 600, color: 'var(--ink,#101B27)', textWrap: 'balance' }}>
                {v.title}
              </h1>
              {/* No DOI placeholder for now; the line appears once a DOI is filled in. */}
              {v.doi ? (
                <p style={fact}>
                  DOI:{' '}
                  <a href={doiUrl(v.doi)} style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                    {doiUrl(v.doi)}
                  </a>
                </p>
              ) : null}
              <p style={fact}>{volumeDateLine(v)}</p>
              {v.pages ? <p style={fact}>Pages: {v.pages}</p> : null}
              <p style={fact}>Format: E-book</p>
              {/* Access line only once the publisher has confirmed the model (see SeriesVolume.access). */}
              {v.access === 'open' ? <p style={fact}>Access: Open access · CC BY 4.0</p> : null}
              {v.access === 'subscription' ? (
                <p style={fact}>
                  Access: Subscription access (<Link href={`/series/${series.slug}/open-access-fees`}>terms</Link>)
                </p>
              ) : null}
              <p style={{ ...fact, margin: 0 }}>
                {v.contributorRole === 'authors' ? 'Authors' : 'Edited by'}: <strong style={strong}>{volumeEditorLine(v.editors)}</strong>
              </p>
            </div>
            <dl className="av-ids" style={{ margin: '0 0 0 auto', flex: '0 0 auto', alignSelf: 'flex-start', border: '2px solid var(--ink,#101B27)', borderRadius: 2, padding: '12px 16px', display: 'grid', gridTemplateColumns: 'max-content max-content', gap: '6px 14px', fontSize: 14 }}>
              <dt style={{ fontWeight: 700, color: 'var(--ink,#101B27)' }}>ISBN</dt>
              <dd style={{ margin: 0, color: 'var(--ink-2,#1F2A36)' }}>{v.isbn ? <strong style={strong}>{v.isbn}</strong> : <span style={tba}>To be assigned</span>}</dd>
            </dl>
          </div>

          <div style={{ borderTop: '1px solid var(--line,#DCE1E6)' }}>
            <Section title="Bibliographic Information">
              <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'max-content minmax(0,1fr)', gap: '10px 24px', fontSize: 15 }}>
                {bibliographic.map(([k, val]) => (
                  <div key={k} style={{ display: 'contents' }}>
                    <dt style={{ fontWeight: 600, color: 'var(--ink,#101B27)' }}>{k}</dt>
                    <dd style={{ margin: 0, color: 'var(--ink-2,#1F2A36)', overflowWrap: 'anywhere' }}>{val}</dd>
                  </div>
                ))}
              </dl>
            </Section>
            <Section title="Description & Coverage">{description}</Section>
            <Section title="Table of Contents">{contents}</Section>
            <Section title={authored ? 'Author Bios' : 'Editor Bios'}>{authors}</Section>
          </div>

          {/* Below the sections, so both stay visible whichever sections are open. */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 28 }}>
            <Link
              href={seriesHome}
              style={{ display: 'inline-block', background: 'var(--accent,#0C8375)', color: 'var(--surface,#fff)', border: '1px solid var(--accent,#0C8375)', padding: '10px 18px', borderRadius: 3, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}
            >
              Propose a volume
            </Link>
            <Link
              href={`/series/${series.slug}/volumes`}
              style={{ display: 'inline-block', background: 'var(--surface,#fff)', color: 'var(--ink,#101B27)', border: '1px solid var(--line-strong,#B9C1C9)', padding: '10px 18px', borderRadius: 3, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}
            >
              All {series.code} volumes
            </Link>
          </div>
        </article>
      </div>
    </>
  )
}
