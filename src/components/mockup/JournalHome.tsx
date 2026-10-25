import Link from 'next/link'
import { JournalMasthead, type JournalMastheadProps, type MastheadGroup } from './JournalMasthead'

export type HomeArticle = {
  id: string
  href: string
  type: string
  title: string
  authorLine: string
  meta: string
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
  boardHref: string
  cta: { title: string; text: string; label: string; href: string; secondary: { label: string; href: string } }
  groups: MastheadGroup[]
}

const h2 = { margin: 0, fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, color: 'var(--ink,#101B27)' } as const
const head = { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, borderBottom: '2px solid var(--accent,#0B7265)', paddingBottom: 10 } as const

/** Home page of a journal or a book series. */
export function JournalHome({ masthead, topics, aimsHref, listTitle, listHref, items, emptyText, editorsLabel, editors, editorsNote, boardHref, cta, groups }: JournalHomeProps) {
  const label = masthead.kind === 'journal' ? 'Journal information' : 'Series information'

  return (
    <>
      <JournalMasthead {...masthead} />
      <div id="main-content" style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 32px 0', display: 'flex', flexWrap: 'wrap', gap: 56, alignItems: 'flex-start' }}>
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
              <article key={a.id} style={{ padding: '18px 0', borderBottom: '1px solid var(--line,#DCE1E6)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', gap: 10, fontSize: 12 }}>
                  <span style={{ fontWeight: 600, color: 'var(--warm,#B5400F)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{a.type}</span>
                  <span style={{ color: '#6E4600', fontWeight: 500 }}>● Open access</span>
                </div>
                <Link href={a.href} style={{ fontFamily: 'var(--font-serif)', fontSize: 18, lineHeight: 1.35, color: 'var(--ink,#101B27)', fontWeight: 600 }}>
                  {a.title}
                </Link>
                <span style={{ fontSize: 14 }}>{a.authorLine}</span>
                <span style={{ fontSize: 13, color: 'var(--muted,#505C68)' }}>{a.meta}</span>
              </article>
            ))}
            {items.length === 0 ? (
              <p style={{ margin: '16px 0 0', fontSize: 15, lineHeight: 1.65, color: 'var(--ink-3,#3C4854)', maxWidth: '68ch' }}>{emptyText}</p>
            ) : null}
          </section>
          ) : null}
        </div>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 32, flex: '1 1 300px', maxWidth: 360 }}>
          <section aria-labelledby="board-h" style={{ background: 'var(--accent-tint,#F3F9F8)', border: '1px solid var(--accent-soft,#CDF0E7)', borderTop: '4px solid var(--accent,#0B7265)', borderRadius: 3, padding: '16px 18px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, paddingBottom: 8 }}>
              <h2 id="board-h" style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, color: 'var(--ink,#101B27)' }}>{editorsLabel}</h2>
              <Link href={boardHref} style={{ fontSize: 13, fontWeight: 500 }}>
                Full board
              </Link>
            </div>
            {editors.map((e) => (
              <div key={e.name} style={{ padding: '9px 0', borderTop: '1px solid var(--accent-soft,#CDF0E7)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink,#101B27)' }}>{e.name}</span>
                <span style={{ fontSize: 12.5, lineHeight: 1.45, color: 'var(--ink-3,#3C4854)' }}>{e.affiliation}</span>
              </div>
            ))}
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
