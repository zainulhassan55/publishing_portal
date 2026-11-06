import Link from 'next/link'
import { JournalMasthead } from '@/components/mockup/JournalMasthead'
import { volumeDateLine, volumeEditorLine } from '@/data/registry'
import type { Publication } from '@/lib/publication'
import { mastheadFor } from '@/lib/publication'
import { doiUrl } from '@/lib/site'
import type { Series, SeriesVolume } from '@/types/publishing'
import { VolumeTabs } from './VolumeTabs'

const body = { margin: '0 0 14px', fontSize: 16, lineHeight: 1.7, color: 'var(--ink-2,#1F2A36)' } as const
const label = { margin: '0 0 8px', fontSize: 16, fontWeight: 600, color: 'var(--ink,#101B27)' } as const
const pending = { margin: '0 0 14px', fontSize: 15, lineHeight: 1.6, color: 'var(--muted,#505C68)', fontStyle: 'italic' } as const
const fact = { margin: '0 0 4px', fontSize: 14, color: 'var(--ink-3,#3C4854)' } as const
const tba = { color: 'var(--muted,#505C68)', fontStyle: 'italic' } as const
const list = { margin: '0 0 18px', paddingLeft: 22, listStyle: 'disc', fontSize: 16, lineHeight: 1.8, color: 'var(--ink-2,#1F2A36)' } as const

/** The page of a volume announced in a series' data file (`Series.volumes`). */
export function AnnouncedVolumePage({ series, pub, volume: v }: { series: Series; pub: Publication; volume: SeriesVolume }) {
  const hasDescription = v.description.length > 0 || v.contents.length > 0 || v.readership !== null
  const seriesHome = `/series/${series.slug}`

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
      <p style={label}>Table of Contents:</p>
      {v.contents.length ? (
        <ul style={list}>
          {v.contents.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      ) : (
        <p style={pending}>Coming soon.</p>
      )}
      {v.readership ? (
        <p style={body}>
          <strong style={{ color: 'var(--ink,#101B27)' }}>Readership:</strong> {v.readership}
        </p>
      ) : null}
    </>
  ) : (
    <p style={pending}>The book description, table of contents and readership will be published here soon.</p>
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
      <style>{`@media (max-width:640px){.av-head{flex-direction:column!important}.av-ids{margin:0!important}.av-cover{width:140px!important}.av-h1{font-size:25px!important}}`}</style>
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
                Volume {v.number} · {v.publishedDate ? 'Published' : 'Forthcoming'}
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
              <p style={{ ...fact, margin: 0 }}>Edited by: {volumeEditorLine(v.editors)}</p>
            </div>
            <dl className="av-ids" style={{ margin: '0 0 0 auto', flex: '0 0 auto', alignSelf: 'flex-start', border: '2px solid var(--ink,#101B27)', borderRadius: 2, padding: '12px 16px', display: 'grid', gridTemplateColumns: 'max-content max-content', gap: '6px 14px', fontSize: 14 }}>
              <dt style={{ fontWeight: 600, color: 'var(--ink,#101B27)' }}>ISBN</dt>
              <dd style={{ margin: 0, color: 'var(--ink-2,#1F2A36)' }}>{v.isbn ?? <span style={tba}>To be assigned</span>}</dd>
            </dl>
          </div>

          <VolumeTabs
            tabs={[
              { id: 'description', label: 'Description', panel: description },
              { id: 'authors', label: 'Authors', panel: authors },
            ]}
          />

          {/* Outside the tabs, so both stay visible on Description and Authors. */}
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
