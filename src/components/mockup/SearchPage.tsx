'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  applyFacets,
  buildFacets,
  matchesQuery,
  queryTerms,
  sortHits,
  type FacetGroupId,
  type SearchIndex,
  type SearchTab,
  type Selections,
  type SortId,
} from '@/lib/search-core'
import { authorsShort, formatDate } from '@/lib/format'

/**
 * Search.dc.html replicated verbatim (docs/REPLICATION.md). Matching, faceting
 * and sorting come from @/lib/search-core; the presentation is the mockup's
 * markup with its inline styles intact. The mockup's `?scope=` parameter is
 * `?tab=` on this route.
 */

/** Volume/issue/pages and the PDF link are not part of the search index. */
export type ArticleExtras = Record<string, { vol: number; issue: number; pages?: string; pdfHref?: string }>

type Props = { index: SearchIndex; extras: ArticleExtras }

const emptySelections = (): Selections => ({ journal: [], type: [], year: [], access: [] })

const facetOrder: FacetGroupId[] = ['journal', 'type', 'year', 'access']

export function SearchPage({ index, extras }: Props) {
  const router = useRouter()
  const sp = useSearchParams()

  const initialTab = ((): SearchTab => {
    const t = sp.get('tab') ?? sp.get('scope')
    if (t === 'journals') return 'journals'
    if (t === 'guidance' || t === 'pages') return 'guidance'
    return 'articles'
  })()

  const [q, setQ] = useState(sp.get('q') ?? '')
  const [applied, setApplied] = useState(sp.get('q') ?? '')
  const [tab, setTab] = useState<SearchTab>(initialTab)
  const [sort, setSort] = useState<SortId>('relevance')
  // Phones only: the facet list collapses behind a toggle above the results.
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selections, setSelections] = useState<Selections>(() => {
    const base = emptySelections()
    const j = sp.get('journal')
    if (j) base.journal = j.split(',').filter((slug) => index.journals.some((hit) => hit.slug === slug))
    return base
  })

  /* Keep the URL in sync with the applied query, tab and journal filter. */
  useEffect(() => {
    const params = new URLSearchParams()
    if (applied) params.set('q', applied)
    if (tab !== 'articles') params.set('tab', tab)
    if (selections.journal?.length) params.set('journal', selections.journal.join(','))
    const qs = params.toString()
    router.replace(qs ? `/search?${qs}` : '/search', { scroll: false })
  }, [applied, tab, selections.journal, router])

  const toggle = (group: FacetGroupId, value: string) =>
    setSelections((prev) => {
      const current = prev[group] ?? []
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
      return { ...prev, [group]: next }
    })

  const clearAll = () => setSelections(emptySelections())

  const terms = useMemo(() => queryTerms(applied), [applied])

  const matched = useMemo(() => index.articles.filter((a) => matchesQuery(a.haystack, terms)), [index, terms])

  const results = useMemo(
    () => sortHits(applyFacets(matched, selections), sort, applied),
    [matched, selections, sort, applied],
  )

  const facetGroups = useMemo(() => {
    const groups = buildFacets(matched, selections)
    // A selected option must stay visible (and removable) even at zero hits.
    for (const group of groups) {
      for (const value of selections[group.id] ?? []) {
        if (!group.options.some((o) => o.value === value)) {
          const journal = index.journals.find((j) => j.slug === value)
          group.options.push({ value, label: group.id === 'journal' ? (journal?.code ?? value) : value, count: 0 })
        }
      }
    }
    return groups
  }, [matched, selections, index])

  const journalSubject = (slug: string) => index.journals.find((j) => j.slug === slug)

  const chips = facetOrder.flatMap((group) =>
    (selections[group] ?? []).map((value) => ({
      group,
      value,
      label: group === 'journal' ? (journalSubject(value)?.code ?? value) : value,
    })),
  )
  const anyFilter = chips.length > 0

  const journalResults = useMemo(
    () => index.journals.filter((j) => matchesQuery(j.haystack, terms)),
    [index, terms],
  )

  /* The mockup scopes author guidance to one journal's page set — the filtered
     journal when one is selected, the first journal otherwise. */
  const guidanceSlug = selections.journal?.[0] ?? index.journals[0]?.slug
  const pageResults = useMemo(
    () =>
      index.guidance
        .filter((g) => g.journalSlug === guidanceSlug && matchesQuery(g.haystack, terms))
        .slice(0, 22),
    [index, guidanceSlug, terms],
  )

  const tabDef: { key: SearchTab; label: string; n: number }[] = [
    { key: 'articles', label: 'Articles', n: results.length },
    { key: 'journals', label: 'Journals', n: journalResults.length },
    { key: 'guidance', label: 'Author guidance', n: pageResults.length },
  ]

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setApplied(q)
  }

  return (
    <main id="main-content" style={{ maxWidth: 1280, margin: '0 auto', padding: '20px var(--shell-pad) 0' }}>
      <style>{`.sr-title:hover{color:var(--accent,#1D5DA8)!important}
.sr-ftoggle{display:none}
@media (max-width:760px){
.sr-grid{gap:20px!important}
.sr-ftoggle{display:inline-block}
.sr-facets[data-open="false"]{display:none}
}`}</style>
      <nav aria-label="Breadcrumb" style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--muted, #505C68)' }}>
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span style={{ color: 'var(--ink-2, #1F2A36)' }}>Search</span>
      </nav>
      <div style={{ padding: '16px 0 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h1
          style={{
            margin: 0,
            fontFamily: 'var(--font-serif)',
            fontSize: 32,
            fontWeight: 600,
            color: 'var(--ink, #101B27)',
          }}
        >
          {applied ? `Results for “${applied}”` : 'Search all content'}
        </h1>
        <form
          onSubmit={onSubmit}
          role="search"
          style={{
            display: 'flex',
            maxWidth: 760,
            border: '1px solid #6B7682',
            borderRadius: 3,
            overflow: 'hidden',
            height: 44,
          }}
        >
          <input
            aria-label="Search query"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Title, author, keyword or DOI"
            style={{ flex: 1, border: 0, padding: '0 14px', font: 'inherit', fontSize: 15, outline: 'none', minWidth: 0 }}
          />
          <button
            type="submit"
            style={{
              border: 0,
              background: 'var(--accent-dark, #0A685C)',
              color: '#fff',
              padding: '0 22px',
              font: 'inherit',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Search
          </button>
        </form>
      </div>
      <div
        role="tablist"
        aria-label="Result type"
        style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--line, #DCE1E6)', marginTop: 20 }}
      >
        {tabDef.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            style={{
              border: 0,
              background: 'transparent',
              padding: '10px 14px 9px',
              font: 'inherit',
              fontSize: 14,
              cursor: 'pointer',
              color: 'var(--ink, #101B27)',
              fontWeight: tab === t.key ? 600 : 500,
              borderBottom: `3px solid ${tab === t.key ? 'var(--accent, #1D5DA8)' : 'transparent'}`,
            }}
          >
            {t.label} <span style={{ color: 'var(--muted, #505C68)', fontWeight: 400 }}>({t.n})</span>
          </button>
        ))}
      </div>

      {tab === 'articles' ? (
        <div className="sr-grid m-1col" style={{ display: 'grid', gridTemplateColumns: '260px minmax(0,1fr)', gap: 40, paddingTop: 24 }}>
          <aside aria-label="Filters" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                paddingBottom: 10,
                borderBottom: '2px solid var(--accent, #0B7265)',
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 13,
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                  color: 'var(--ink, #101B27)',
                }}
              >
                Refine results
              </h2>
              <span style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
                {anyFilter ? (
                  <button
                    onClick={clearAll}
                    style={{
                      border: 0,
                      background: 'none',
                      color: 'var(--accent, #1D5DA8)',
                      font: 'inherit',
                      fontSize: 13,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Clear all
                  </button>
                ) : null}
                <button
                  type="button"
                  className="sr-ftoggle"
                  aria-expanded={filtersOpen}
                  aria-controls="sr-facets"
                  onClick={() => setFiltersOpen((o) => !o)}
                  style={{
                    border: 0,
                    background: 'none',
                    color: 'var(--accent, #1D5DA8)',
                    font: 'inherit',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {filtersOpen ? 'Hide filters' : 'Show filters'}
                </button>
              </span>
            </div>
            <div id="sr-facets" className="sr-facets" data-open={filtersOpen}>
              {facetGroups.map((f) => (
                <fieldset
                  key={f.id}
                  style={{ border: 0, borderBottom: '1px solid var(--line, #DCE1E6)', margin: 0, padding: '14px 0' }}
                >
                  <legend
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--ink, #101B27)',
                      padding: 0,
                      marginBottom: 8,
                      float: 'left',
                      width: '100%',
                    }}
                  >
                    {f.label}
                  </legend>
                  <div style={{ clear: 'both', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {f.options.map((o) => (
                      <label
                        key={o.value}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: 14,
                          color: 'var(--ink-2, #1F2A36)',
                          padding: '4px 0',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={(selections[f.id] ?? []).includes(o.value)}
                          onChange={() => toggle(f.id, o.value)}
                          style={{ width: 16, height: 16, accentColor: 'var(--accent, #1D5DA8)', margin: 0 }}
                        />
                        <span style={{ flex: 1 }}>
                          {f.id === 'journal'
                            ? `${o.label} · ${journalSubject(o.value)?.subject ?? ''}`
                            : o.label}
                        </span>
                        <span
                          style={{ fontSize: 12, color: 'var(--muted, #505C68)', fontVariantNumeric: 'tabular-nums' }}
                        >
                          {o.count}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          </aside>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 16,
                flexWrap: 'wrap',
                paddingBottom: 12,
                borderBottom: '1px solid var(--line-strong, #B9C1C9)',
              }}
            >
              <span aria-live="polite" style={{ fontSize: 14, color: 'var(--ink-2, #1F2A36)' }}>
                <strong>{results.length}</strong> {results.length === 1 ? 'article' : 'articles'}
              </span>
              <label
                style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-3, #3C4854)' }}
              >
                Sort by
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortId)}
                  style={{
                    font: 'inherit',
                    fontSize: 13,
                    padding: '5px 8px',
                    border: '1px solid var(--line-strong, #B9C1C9)',
                    borderRadius: 3,
                    background: 'var(--surface, #fff)',
                  }}
                >
                  <option value="relevance">Relevance</option>
                  <option value="newest">Newest first</option>
                  <option value="cited">Most cited</option>
                  <option value="read">Most read</option>
                </select>
              </label>
            </div>
            {anyFilter ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '12px 0' }}>
                {chips.map((c) => (
                  <button
                    key={`${c.group}-${c.value}`}
                    onClick={() => toggle(c.group, c.value)}
                    aria-label={`Remove filter ${c.label}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 8px 4px 10px',
                      border: '1px solid var(--accent, #1D5DA8)',
                      background: 'var(--accent-soft, #E8F0FA)',
                      color: 'var(--accent-dark, #174C8A)',
                      borderRadius: 2,
                      font: 'inherit',
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    {c.label}
                    <span aria-hidden="true" style={{ fontSize: 15, lineHeight: 1 }}>
                      ×
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
            {results.map((a) => {
              const href = `/articles/${a.slug}`
              const extra = extras[a.id]
              return (
                <article
                  key={a.id}
                  style={{
                    padding: '20px 0',
                    borderBottom: '1px solid var(--line, #DCE1E6)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 7,
                  }}
                >
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 12, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontWeight: 600,
                        color: 'var(--warm, #B5400F)',
                        textTransform: 'uppercase',
                        letterSpacing: '.05em',
                      }}
                    >
                      {a.type}
                    </span>
                    <span style={{ color: '#6E4600', fontWeight: 500 }}>● Open access</span>
                  </div>
                  <Link
                    href={href}
                    className="sr-title"
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: 19,
                      lineHeight: 1.35,
                      color: 'var(--ink, #101B27)',
                      fontWeight: 600,
                      textWrap: 'pretty',
                    }}
                  >
                    {a.title}
                  </Link>
                  <span style={{ fontSize: 14, color: 'var(--ink-2, #1F2A36)' }}>{authorsShort(a.authors)}</span>
                  <span style={{ fontSize: 13, color: 'var(--muted, #505C68)' }}>
                    <em style={{ color: 'var(--ink-2, #1F2A36)' }}>{a.journalTitle}</em>
                    {extra
                      ? ` · Vol. ${extra.vol}, Issue ${extra.issue}${extra.pages ? `, pp. ${extra.pages}` : ''}`
                      : ''}{' '}
                    · Published {formatDate(a.publishedIso)}
                  </span>
                  <p
                    style={{
                      margin: '2px 0 0',
                      fontSize: 14,
                      lineHeight: 1.55,
                      color: 'var(--ink-3, #3C4854)',
                      maxWidth: '80ch',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {a.abstract}
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      gap: 18,
                      fontSize: 13,
                      fontWeight: 500,
                      marginTop: 4,
                      flexWrap: 'wrap',
                      alignItems: 'center',
                    }}
                  >
                    <Link href={href}>Full text</Link>
                    {extra?.pdfHref ? <a href={extra.pdfHref}>PDF</a> : null}
                    <Link href={`${href}#abstract`}>Abstract</Link>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 400,
                        fontSize: 12,
                        color: 'var(--muted, #505C68)',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      https://doi.org/{a.doi}
                    </span>
                  </div>
                </article>
              )
            })}
            {results.length === 0 ? (
              <div style={{ padding: '40px 0', maxWidth: '62ch', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <h2
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-serif)',
                    fontSize: 22,
                    fontWeight: 600,
                    color: 'var(--ink, #101B27)',
                  }}
                >
                  No articles match your search
                </h2>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--ink-2, #1F2A36)' }}>
                  Check the spelling, use fewer keywords, or remove a filter.
                </p>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.8, color: 'var(--ink-2, #1F2A36)' }}>
                  <li>
                    <button
                      onClick={() => setTab('journals')}
                      style={{
                        border: 0,
                        background: 'none',
                        padding: 0,
                        color: 'var(--accent, #1D5DA8)',
                        font: 'inherit',
                        cursor: 'pointer',
                      }}
                    >
                      See {journalResults.length} matching journals
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setTab('guidance')}
                      style={{
                        border: 0,
                        background: 'none',
                        padding: 0,
                        color: 'var(--accent, #1D5DA8)',
                        font: 'inherit',
                        cursor: 'pointer',
                      }}
                    >
                      See {pageResults.length} matching author-guidance pages
                    </button>
                  </li>
                  <li>
                    <Link href="/authors#cfp">Browse open calls for papers</Link>
                  </li>
                </ul>
              </div>
            ) : (
              <nav
                aria-label="Pagination"
                style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '24px 0', fontSize: 14 }}
              >
                <span style={{ padding: '6px 10px', color: 'var(--muted, #6B7682)' }}>Previous</span>
                <span
                  aria-current="page"
                  style={{ padding: '6px 11px', border: '1px solid #101B27', borderRadius: 2, fontWeight: 600 }}
                >
                  1
                </span>
                <span style={{ padding: '6px 10px', color: 'var(--muted, #6B7682)' }}>Next</span>
                <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--muted, #505C68)' }}>
                  Showing 1–{results.length} of {results.length}
                </span>
              </nav>
            )}
          </div>
        </div>
      ) : null}

      {tab === 'journals' ? (
        <div style={{ paddingTop: 8, maxWidth: 900 }}>
          {journalResults.map((j) => (
            <div
              key={j.slug}
              style={{ display: 'flex', gap: 16, padding: '18px 0', borderBottom: '1px solid var(--line, #DCE1E6)' }}
            >
              <div
                style={{
                  width: 52,
                  height: 70,
                  flexShrink: 0,
                  background: 'var(--brand, #0F2B46)',
                  borderTop: `3px solid ${j.subjectColor}`,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'flex-end',
                  padding: 5,
                  boxSizing: 'border-box',
                  color: '#fff',
                  fontFamily: 'var(--font-serif)',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {j.code}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <Link
                  href={`/journals/${j.slug}`}
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 19,
                    fontWeight: 600,
                    color: 'var(--ink, #101B27)',
                  }}
                >
                  {j.title}
                </Link>
                <span style={{ fontSize: 13, color: 'var(--muted, #505C68)' }}>
                  {j.subject} · ISSN applied for · Open access
                </span>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--ink-3, #3C4854)' }}>{j.scope}</p>
              </div>
            </div>
          ))}
          {journalResults.length === 0 ? (
            <p style={{ padding: '32px 0', fontSize: 15, color: 'var(--ink-2, #1F2A36)' }}>
              No journal titles or scopes match this search. <Link href="/journals">Browse all journals</Link>.
            </p>
          ) : null}
        </div>
      ) : null}

      {tab === 'guidance' ? (
        <div style={{ paddingTop: 8, maxWidth: 900 }}>
          {pageResults.map((p) => (
            <div
              key={`${p.journalSlug}-${p.pageId}`}
              style={{
                padding: '16px 0',
                borderBottom: '1px solid var(--line, #DCE1E6)',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--muted, #505C68)',
                  textTransform: 'uppercase',
                  letterSpacing: '.05em',
                  fontWeight: 600,
                }}
              >
                {p.group}
              </span>
              <Link href={p.href} style={{ fontSize: 17, fontWeight: 600, color: 'var(--ink, #101B27)' }}>
                {p.title}
              </Link>
              <span style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--ink-3, #3C4854)' }}>{p.text}</span>
            </div>
          ))}
          {pageResults.length === 0 ? (
            <p style={{ padding: '32px 0', fontSize: 15, color: 'var(--ink-2, #1F2A36)' }}>
              No author-guidance pages match this search. <Link href="/authors">Go to For Authors</Link>.
            </p>
          ) : null}
        </div>
      ) : null}
    </main>
  )
}
