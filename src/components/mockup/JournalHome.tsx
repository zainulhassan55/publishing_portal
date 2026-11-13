import Image from 'next/image'
import Link from 'next/link'
import type { Affiliation } from '@/types/content'
import { JournalMasthead, type JournalMastheadProps, type MastheadGroup } from './JournalMasthead'

export type HomeArticle = {
  id: string
  href: string
  type: string
  title: string
  authorLine: string
  meta: string
  /** Access badge beside the type. Omitted means "Open access" (journal articles); null shows none. */
  access?: string | null
  /** Book volumes: cover thumbnail beside the entry. */
  image?: string
  /** Book volumes: "Volume 1", bold before the meta line; also sets the author line and ISBN bold. */
  lead?: string
  /** Book volumes: the ISBN, or null for "To be assigned". */
  isbn?: string | null
}

export type HomeEditor = { name: string; affiliation: string }

export type JournalHomeProps = {
  masthead: JournalMastheadProps
  topics: string[]
  aimsHref: string
  /** "Latest articles" for a journal, "Published volumes" for a series. */
  listTitle: string
  listHref: string
  items: HomeArticle[]
  /** The publisher's wording for an empty list; null leaves the section out until there is something to list. */
  emptyText: string | null
  editorsLabel: string
  editors: HomeEditor[]
  editorsNote?: string
  /** Centres the publication is run with, shown with their logos at the top of the sidebar. */
  affiliations?: Affiliation[]
  boardHref: string
  cta: { title: string; text: string; label: string; href: string; secondary: { label: string; href: string } }
  groups: MastheadGroup[]
}

const h2 = { margin: 0, fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, color: 'var(--ink,#101B27)' } as const
const head = { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, borderBottom: '2px solid var(--accent,#0B7265)', paddingBottom: 10 } as const

/** Home page of a journal or a book series. */
/** Editors shown in the sidebar before linking out to the full board. */
const PREVIEW_EDITORS = 2

export function JournalHome({ masthead, topics, aimsHref, listTitle, listHref, items, emptyText, editorsLabel, editors, editorsNote, affiliations, boardHref, cta, groups }: JournalHomeProps) {
  const label = masthead.kind === 'journal' ? 'Journal information' : 'Series information'

  return (
    <>
      <JournalMasthead {...masthead} />
      <div id="main-content" style={{ maxWidth: 1280, margin: '0 auto', padding: '40px var(--shell-pad) 0', display: 'flex', flexWrap: 'wrap', gap: 56, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 48, minWidth: 0, flex: '1 1 560px' }}>
          <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={head}>
              <h2 style={h2}>Aims and scope</h2>
              <Link href={aimsHref} style={{ fontSize: 14 }}>
                Full aims and scope
              </Link>
            </div>
            <p style={{ margin: 0, fontSize: 15, color: 'var(--ink-3,#3C4854)' }}>Topics include, but are not limited to:</p>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,240px),1fr))', gap: '0 24px', borderTop: '1px solid var(--line,#DCE1E6)' }}>
              {topics.map((t) => (
                <li key={t} style={{ display: 'flex', gap: 10, alignItems: 'baseline', padding: '9px 0', borderBottom: '1px solid var(--line,#DCE1E6)', fontSize: 15, lineHeight: 1.45, color: 'var(--ink-2,#1F2A36)' }}>
                  <span aria-hidden="true" style={{ width: 6, height: 6, flexShrink: 0, borderRadius: '50%', background: 'var(--accent,#0B7265)', transform: 'translateY(-2px)' }}></span>
                  {t}
                </li>
              ))}
            </ul>
          </section>

          {items.length > 0 || emptyText !== null ? (
          <section>
            <div style={head}>
              <h2 style={h2}>{listTitle}</h2>
              <Link href={listHref} style={{ fontSize: 14 }}>
                View all
              </Link>
            </div>
            {items.map((a) => (
              <article key={a.id} style={{ padding: '18px 0', borderBottom: '1px solid var(--line,#DCE1E6)', display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                {a.image ? (
                  // The title link carries the name; this duplicate link is hidden from keyboards and screen readers.
                  <Link href={a.href} tabIndex={-1} aria-hidden="true" style={{ flex: '0 0 auto', display: 'block', width: 84 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.image} alt="" width={84} height={126} loading="lazy" style={{ display: 'block', width: '100%', height: 'auto', border: '1px solid var(--line,#DCE1E6)', borderRadius: 2 }} />
                  </Link>
                ) : null}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 10, fontSize: 12 }}>
                  <span style={{ fontWeight: 600, color: 'var(--warm,#B5400F)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{a.type}</span>
                  {a.access === null ? null : <span style={{ color: '#6E4600', fontWeight: 500 }}>● {a.access ?? 'Open access'}</span>}
                </div>
                <Link href={a.href} style={{ fontFamily: 'var(--font-serif)', fontSize: 18, lineHeight: 1.35, color: 'var(--ink,#101B27)', fontWeight: 600 }}>
                  {a.title}
                </Link>
                <span style={{ fontSize: 14, fontWeight: a.lead ? 700 : undefined }}>{a.authorLine}</span>
                <span style={{ fontSize: 13, color: 'var(--muted,#505C68)' }}>
                  {a.lead ? (
                    <>
                      <strong style={{ fontWeight: 700, color: 'var(--ink-2,#1F2A36)' }}>{a.lead}</strong>
                      {a.meta ? ' · ' : ''}
                    </>
                  ) : null}
                  {a.meta}
                </span>
                {a.isbn !== undefined ? (
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2,#1F2A36)' }}>
                    ISBN: {a.isbn ?? <span style={{ fontWeight: 400, fontStyle: 'italic', color: 'var(--muted,#505C68)' }}>To be assigned</span>}
                  </span>
                ) : null}
                </div>
              </article>
            ))}
            {items.length === 0 ? (
              <p style={{ margin: '16px 0 0', fontSize: 15, lineHeight: 1.65, color: 'var(--ink-3,#3C4854)', maxWidth: '68ch' }}>{emptyText}</p>
            ) : null}
          </section>
          ) : null}
        </div>

        <aside className="m-full" style={{ display: 'flex', flexDirection: 'column', gap: 32, flex: '1 1 300px', maxWidth: 360 }}>
          {affiliations?.length ? (
            <section aria-labelledby="aff-h" style={{ border: '1px solid var(--line,#DCE1E6)', borderRadius: 3, padding: '16px 18px 18px', background: 'var(--surface,#fff)' }}>
              <h2 id="aff-h" style={{ margin: '0 0 12px', fontSize: 13, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600, color: 'var(--ink-3,#3C4854)' }}>
                In association with
              </h2>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
                {affiliations.map((a) => {
                  const body = (
                    <>
                      <Image src={a.logo} alt="" width={Math.round((96 * a.logoSize[0]) / a.logoSize[1])} height={96} style={{ height: 96, width: 'auto', maxWidth: '100%' }} />
                      <span style={{ fontSize: 14, lineHeight: 1.4, fontWeight: 600, color: 'var(--ink,#101B27)' }}>{a.name}</span>
                      {a.detail ? <span style={{ fontSize: 13, lineHeight: 1.4, color: 'var(--ink-3,#3C4854)' }}>{a.detail}</span> : null}
                    </>
                  )
                  const style = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center', textDecoration: 'none' } as const
                  return (
                    <li key={a.name}>
                      {a.href ? (
                        <a href={a.href} target="_blank" rel="noopener noreferrer" style={style}>
                          {body}
                        </a>
                      ) : (
                        <div style={style}>{body}</div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          ) : null}
          <section aria-labelledby="board-h" style={{ background: 'var(--accent-tint,#F3F9F8)', border: '1px solid var(--accent-soft,#CDF0E7)', borderTop: '4px solid var(--accent,#0B7265)', borderRadius: 3, padding: '16px 18px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, paddingBottom: 8 }}>
              <h2 id="board-h" style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, color: 'var(--ink,#101B27)' }}>{editorsLabel}</h2>
              {editors.length <= PREVIEW_EDITORS ? (
                <Link href={boardHref} style={{ fontSize: 13, fontWeight: 500 }}>
                  Full board
                </Link>
              ) : null}
            </div>
            {editors.slice(0, PREVIEW_EDITORS).map((e) => (
              <div key={e.name} style={{ padding: '9px 0', borderTop: '1px solid var(--accent-soft,#CDF0E7)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink,#101B27)' }}>{e.name}</span>
                <span style={{ fontSize: 12.5, lineHeight: 1.45, color: 'var(--ink-3,#3C4854)' }}>{e.affiliation}</span>
              </div>
            ))}
            {editors.length > PREVIEW_EDITORS ? (
              <Link href={boardHref} style={{ display: 'block', paddingTop: 10, borderTop: '1px solid var(--accent-soft,#CDF0E7)', fontSize: 13.5, fontWeight: 600 }}>
                Full list of editors ({editors.length}) →
              </Link>
            ) : null}
            {editorsNote ? <p style={{ margin: '10px 0 0', fontSize: 13, lineHeight: 1.55, color: 'var(--ink-3,#3C4854)' }}>{editorsNote}</p> : null}
          </section>
          <div style={{ border: '1px solid var(--line,#DCE1E6)', borderRadius: 3, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--ink,#101B27)' }}>{cta.title}</h2>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--ink-3,#3C4854)' }}>{cta.text}</p>
            <Link href={cta.href} style={{ background: 'var(--accent,#1D5DA8)', color: '#fff', padding: '10px 16px', borderRadius: 3, fontSize: 14, fontWeight: 500, textAlign: 'center', textDecoration: 'none' }}>
              {cta.label}
            </Link>
            <Link href={cta.secondary.href} style={{ fontSize: 13, textAlign: 'center' }}>
              {cta.secondary.label}
            </Link>
          </div>
          <nav aria-label={label}>
            <h2 style={{ margin: 0, fontSize: 13, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink,#101B27)', paddingBottom: 10, borderBottom: '2px solid var(--accent,#0B7265)' }}>{label}</h2>
            {groups.map((g) => (
              <div key={g.group} style={{ padding: '12px 0', borderBottom: '1px solid var(--line,#DCE1E6)' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3,#3C4854)' }}>{g.group}</span>
                <ul style={{ listStyle: 'none', margin: '6px 0 0', padding: 0, display: 'flex', flexWrap: 'wrap', gap: '4px 14px' }}>
                  {g.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} style={{ fontSize: 13 }}>
                        {l.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>
      </div>
    </>
  )
}
