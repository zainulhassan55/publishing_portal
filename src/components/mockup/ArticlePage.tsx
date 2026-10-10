'use client'

import Link from 'next/link'
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import type { Article, ArticleFigure, ArticleSection } from '@/types/publishing'
import { formatDate, formatNumber } from '@/lib/format'
import { doiUrl } from '@/lib/site'

/**
 * Article.dc.html replicated verbatim (docs/REPLICATION.md). The mockup's
 * hardcoded demo content (authors, body, references…) is sourced from the
 * article record instead, rendered with the mockup's exact markup and inline
 * styles. The design-review scaffolding (theme picker etc.) is not part of
 * this mockup page.
 */

export type ArticleCitations = { bibtex: string; ris: string; endnote: string; plain: string }

export type RelatedArticle = { href: string; title: string; authorLine: string; code: string; date: string }

type Props = {
  article: Article
  journalTitle: string
  journalSlug: string
  citations: ArticleCitations
  related: RelatedArticle[]
}

type CiteFormat = keyof ArticleCitations

/* Mockup body-paragraph style, reused for every serif paragraph. */
const paraStyle: CSSProperties = {
  margin: '0 0 16px',
  fontFamily: 'var(--font-serif)',
  fontSize: 18,
  lineHeight: 1.7,
  color: 'var(--ink-2, #1F2A36)',
  textWrap: 'pretty',
}

const citeButtonStyle: CSSProperties = {
  border: 0,
  background: 'none',
  padding: 0,
  color: 'var(--accent, #1D5DA8)',
  font: 'inherit',
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  cursor: 'pointer',
}

/** "Table 1. Caption…" → bold prefix, as the mockup renders it. */
function TableCaption({ caption }: { caption?: string }) {
  if (!caption) return null
  const m = caption.match(/^(Table \d+\.)\s*(.*)$/)
  return m ? (
    <>
      <strong>{m[1]}</strong> {m[2]}
    </>
  ) : (
    <>{caption}</>
  )
}

export function ArticlePage({ article, journalTitle, journalSlug, citations, related }: Props) {
  const [active, setActive] = useState('highlights')
  const [aff, setAff] = useState(false)
  const [cite, setCite] = useState(false)
  const [fmt, setFmt] = useState<CiteFormat>('bibtex')
  const [copied, setCopied] = useState(false)
  const [plainCopied, setPlainCopied] = useState(false)
  const [shared, setShared] = useState(false)
  const [pop, setPop] = useState<number | null>(null)
  const [lb, setLb] = useState<{ title: string; caption: string } | null>(null)

  useEffect(() => {
    const onScroll = () => {
      const els = Array.from(document.querySelectorAll('[data-sec]'))
      let cur = els[0]?.id ?? ''
      for (const el of els) if (el.getBoundingClientRect().top < 140) cur = el.id
      if (cur) setActive((prev) => (cur !== prev ? cur : prev))
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLb(null)
        setCite(false)
        setPop(null)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  const copyText = (text: string, set: (v: boolean) => void) => {
    try {
      navigator.clipboard.writeText(text)
    } catch {
      /* clipboard unavailable — the button still gives feedback */
    }
    set(true)
    window.setTimeout(() => set(false), 2000)
  }

  const retracted = article.notice?.kind === 'retraction'
  const pdf = !!article.pdfHref
  const refs = article.references ?? []

  /* Journal colour derivations, exactly as the mockup computes them. */
  const jc = 'var(--warm, #C2410C)'
  const jDark = `color-mix(in srgb, ${jc} 60%, #101B27)`
  const jText = `color-mix(in srgb, ${jc} 55%, var(--ink, #101B27))`
  const jTint = `color-mix(in srgb, ${jc} 8%, var(--surface, #fff))`
  const jTintA = `color-mix(in srgb, ${jc} 6%, var(--surface, #fff))`
  const jTintB = `color-mix(in srgb, ${jc} 14%, var(--surface-2, #F5F6F7))`

  const crossColor = retracted ? '#A52A2A' : '#1E6B3A'
  const crossLabel = retracted ? 'Retracted' : 'Current version'

  const jHref = `/journals/${journalSlug}`
  const issueHref = `/journals/${journalSlug}/current-issue`
  const licenseHref = `/journals/${journalSlug}/copyright-licensing`

  const marker = (i: number) => String.fromCharCode(97 + i)
  const authorSup = (ids: string[]) =>
    ids
      .map((id) => {
        const i = article.affiliations.findIndex((a) => a.id === id)
        return i >= 0 ? marker(i) : ''
      })
      .filter(Boolean)
      .join(',')

  const correspondents = article.authors.filter((a) => a.corresponding && a.email)

  const dates = [
    article.receivedIso ? { l: 'Received', v: formatDate(article.receivedIso) } : null,
    article.revisedIso ? { l: 'Revised', v: formatDate(article.revisedIso) } : null,
    article.acceptedIso ? { l: 'Accepted', v: formatDate(article.acceptedIso) } : null,
    { l: 'Published', v: formatDate(article.publishedIso) },
  ].filter((d): d is { l: string; v: string } => d !== null)

  /* Document-order figure/table numbers, so ids match the mockup's fig1/tab1. */
  const figNums = new Map<string, number>()
  const tabNums = new Map<string, number>()
  let figN = 0
  let tabN = 0
  const walk = (s: ArticleSection) => {
    if (s.table) tabNums.set(s.id, ++tabN)
    if (s.figure) figNums.set(s.id, ++figN)
    s.subsections?.forEach(walk)
  }
  article.body?.forEach(walk)

  const toc: { href: string; label: string; id: string }[] = []
  if (article.highlights?.length) toc.push({ id: 'highlights', href: '#highlights', label: 'Highlights' })
  toc.push({ id: 'abstract', href: '#abstract', label: 'Abstract' })
  if (article.keywords.length) toc.push({ id: 'keywords', href: '#keywords', label: 'Keywords' })
  for (const s of article.body ?? []) toc.push({ id: s.id, href: `#${s.id}`, label: `${s.number}  ${s.heading}` })
  if (article.declarations) toc.push({ id: 'declarations', href: '#declarations', label: 'Declarations' })
  if (refs.length) toc.push({ id: 'references', href: '#references', label: 'References' })
  for (let i = 1; i <= figN; i++) toc.push({ id: `fig${i}`, href: `#fig${i}`, label: `Figure ${i}` })
  for (let i = 1; i <= tabN; i++) toc.push({ id: `tab${i}`, href: `#tab${i}`, label: `Table ${i}` })

  const declarations = article.declarations
  const decl: [string, string][] = declarations
    ? (
        [
          ['Funding', declarations.funding],
          ['Competing interests', declarations.competingInterests],
          ['Ethics approval', declarations.ethics],
          ['Consent', declarations.consent],
          ['Data availability', declarations.dataAvailability],
          ['Author contributions', declarations.contributions],
          ['Use of generative AI', declarations.generativeAi],
        ] as [string, string | undefined][]
      ).filter((d): d is [string, string] => !!d[1])
    : []

  const citeTabs: { key: CiteFormat; label: string }[] = [
    { key: 'bibtex', label: 'BibTeX' },
    { key: 'ris', label: 'RIS' },
    { key: 'endnote', label: 'EndNote' },
    { key: 'plain', label: 'Text' },
  ]

  const metrics = article.metrics
    ? [
        { v: formatNumber(article.metrics.views), l: 'Views' },
        { v: formatNumber(article.metrics.downloads), l: 'Downloads' },
        { v: formatNumber(article.metrics.citations), l: 'Citations' },
      ]
    : []

  const scholarHref = (text: string) => `https://scholar.google.com/scholar?q=${encodeURIComponent(text)}`

  /** Inline "[n]" markers become the mockup's citation buttons. */
  const renderParagraph = (text: string, key: number) => {
    const nodes: ReactNode[] = []
    const re = /\[(\d+)\]/g
    let last = 0
    let m: RegExpExecArray | null
    let i = 0
    while ((m = re.exec(text))) {
      const n = Number(m[1])
      if (n < 1 || n > refs.length) continue
      if (m.index > last) nodes.push(text.slice(last, m.index))
      nodes.push(
        <button
          key={`c${i++}`}
          onClick={() => setPop(n)}
          aria-label={`Reference ${n}`}
          style={citeButtonStyle}
        >
          [{n}]
        </button>,
      )
      last = m.index + m[0].length
    }
    if (last < text.length) nodes.push(text.slice(last))
    return (
      <p key={key} style={paraStyle}>
        {nodes}
      </p>
    )
  }

  const renderFigure = (figure: ArticleFigure, n: number) => (
    <figure
      key={`fig${n}`}
      id={`fig${n}`}
      style={{
        margin: '12px 0 28px',
        borderTop: '1px solid var(--line, #DCE1E6)',
        borderBottom: '1px solid var(--line, #DCE1E6)',
        padding: '16px 0',
        scrollMarginTop: 20,
      }}
    >
      <button
        onClick={() => setLb({ title: figure.label, caption: figure.caption })}
        aria-label={`Enlarge ${figure.label}`}
        style={{
          display: 'block',
          width: '100%',
          aspectRatio: '16/9',
          border: '1px solid var(--line, #DCE1E6)',
          borderRadius: 2,
          cursor: 'zoom-in',
          background: `repeating-linear-gradient(135deg, ${jTintA} 0 10px, ${jTintB} 10px 20px)`,
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: 'var(--muted, #505C68)',
        }}
      >
        {figure.alt}
      </button>
      <figcaption style={{ marginTop: 12, fontSize: 14, lineHeight: 1.55, color: 'var(--ink-2, #1F2A36)' }}>
        <strong>{figure.label}.</strong> {figure.caption}
      </figcaption>
      <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 13, fontWeight: 500 }}>
        <button
          onClick={() => setLb({ title: figure.label, caption: figure.caption })}
          style={{
            border: 0,
            background: 'none',
            padding: 0,
            color: 'var(--accent, #1D5DA8)',
            font: 'inherit',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Open in viewer
        </button>
        {figure.src ? <a href={figure.src}>Download high-resolution image</a> : null}
      </div>
    </figure>
  )

  const renderBlocks = (s: ArticleSection): ReactNode => {
    const tabNo = tabNums.get(s.id)
    const figNo = figNums.get(s.id)
    return (
      <>
        {s.paragraphs?.map((p, i) => renderParagraph(p, i))}
        {s.bullets?.length ? (
          <ul style={{ ...paraStyle, paddingLeft: 20 }}>
            {s.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        ) : null}
        {s.equation ? (
          <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0 22px', padding: '12px 0' }}>
            <span
              style={{
                flex: 1,
                textAlign: 'center',
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: 20,
                color: 'var(--ink, #101B27)',
              }}
            >
              {s.equation.tex}
            </span>
            <span style={{ fontSize: 15, color: 'var(--muted, #505C68)' }}>
              ({s.equation.label.replace(/[^0-9]/g, '') || s.equation.label})
            </span>
          </div>
        ) : null}
        {s.table && tabNo ? (
          <div id={`tab${tabNo}`} style={{ margin: '12px 0 28px', scrollMarginTop: 20 }}>
            <p style={{ margin: '0 0 8px', fontSize: 14, lineHeight: 1.5, color: 'var(--ink-2, #1F2A36)' }}>
              <TableCaption caption={s.table.caption} />
            </p>
            <div style={{ overflowX: 'auto', borderTop: `2px solid ${jc}`, borderBottom: `2px solid ${jc}` }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 14,
                  minWidth: 520,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <thead>
                  <tr>
                    {s.table.head.map((h, i) => (
                      <th
                        key={h}
                        scope="col"
                        style={{
                          textAlign: i === 0 ? 'left' : 'right',
                          padding:
                            i === 0 ? '9px 12px 9px 0' : i === s.table!.head.length - 1 ? '9px 0 9px 12px' : '9px 12px',
                          borderBottom: '1px solid var(--line-strong, #B9C1C9)',
                          fontWeight: 600,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {s.table.rows.map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td
                          key={ci}
                          style={{
                            textAlign: ci === 0 ? undefined : 'right',
                            padding:
                              ci === 0 ? '8px 12px 8px 0' : ci === row.length - 1 ? '8px 0 8px 12px' : '8px 12px',
                            ...(ri < s.table!.rows.length - 1
                              ? { borderBottom: '1px solid var(--line-soft, #EEF1F4)' }
                              : {}),
                          }}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
        {s.figure && figNo ? renderFigure(s.figure, figNo) : null}
      </>
    )
  }

  return (
    <>
      <style>{`@keyframes ngiqDrop{from{opacity:0;transform:translateY(-6px) scale(.98)}to{opacity:1;transform:none}}@keyframes ngiqFadeA{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}@keyframes ngiqZoom{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:none}}.art-author-link:hover{color:var(--accent,#1D5DA8)!important}.art-kw:hover{border-color:var(--accent,#1D5DA8)!important;color:var(--accent,#1D5DA8)!important}`}</style>

      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '16px 32px 0' }}>
        <nav
          aria-label="Breadcrumb"
          style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--muted, #505C68)', flexWrap: 'wrap' }}
        >
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href={jHref}>{journalTitle}</Link>
          <span aria-hidden="true">/</span>
          <Link href={issueHref}>
            Volume {article.volume}, Issue {article.issue}
          </Link>
        </nav>
      </div>

      {article.notice ? (
        <div role="alert" style={{ maxWidth: 1320, margin: '16px auto 0', padding: '0 32px' }}>
          <div
            style={{
              border: '1px solid #E3B3B3',
              background: '#FBEAEA',
              borderRadius: 3,
              padding: '14px 18px',
              display: 'flex',
              gap: 14,
              alignItems: 'flex-start',
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                color: '#fff',
                background: '#A52A2A',
                padding: '3px 8px',
                borderRadius: 2,
              }}
            >
              {retracted ? 'Retracted' : 'Corrected'}
            </span>
            <div style={{ fontSize: 14, lineHeight: 1.55, color: '#5C1414' }}>
              This article was {retracted ? 'retracted' : 'corrected'} on {formatDate(article.notice.date)}.{' '}
              {article.notice.reason}{' '}
              {article.notice.href ? (
                <a
                  href={article.notice.href}
                  style={{ color: '#8B1E1E', fontWeight: 600, textDecoration: 'underline' }}
                >
                  Read the {retracted ? 'retraction' : 'correction'} notice
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div
        style={{
          maxWidth: 1320,
          margin: '0 auto',
          padding: '24px 32px 0',
          display: 'flex',
          gap: 40,
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}
      >
        <nav
          aria-label="Article contents"
          style={{
            width: 210,
            flexShrink: 0,
            position: 'sticky',
            top: 16,
            maxHeight: 'calc(100vh - 32px)',
            overflow: 'auto',
          }}
        >
          <span
            style={{
              display: 'block',
              fontSize: 11,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              color: 'var(--muted, #505C68)',
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            Contents
          </span>
          {toc.map((t) => (
            <a
              key={t.id}
              href={t.href}
              style={{
                display: 'block',
                fontSize: 13,
                lineHeight: 1.4,
                padding: '5px 0 5px 12px',
                borderLeft: `2px solid ${t.id === active ? 'var(--warm, #C2410C)' : 'var(--line, #DCE1E6)'}`,
                color: t.id === active ? 'var(--ink, #101B27)' : 'var(--ink-3, #3C4854)',
                fontWeight: t.id === active ? 600 : 400,
                textDecoration: 'none',
              }}
            >
              {t.label}
            </a>
          ))}
        </nav>

        <main id="main-content" style={{ flex: 1, minWidth: 300, maxWidth: 740 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', fontSize: 12 }}>
            <span
              style={{
                fontWeight: 600,
                color: 'var(--warm, #B5400F)',
                textTransform: 'uppercase',
                letterSpacing: '.05em',
                padding: '2px 0',
              }}
            >
              {article.type}
            </span>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 2,
                background: '#FBF1DA',
                color: '#6E4600',
                border: '1px solid #EBD39A',
                fontWeight: 500,
              }}
            >
              Open access
            </span>
            <a
              href="#rights"
              style={{
                padding: '2px 8px',
                borderRadius: 2,
                border: '1px solid var(--line, #DCE1E6)',
                color: 'var(--ink-2, #1F2A36)',
                fontWeight: 500,
              }}
            >
              {article.licence}
            </a>
          </div>
          <p style={{ margin: '14px 0 0', fontSize: 14, color: 'var(--ink-3, #3C4854)' }}>
            <Link href={jHref} style={{ fontStyle: 'italic', fontWeight: 500, color: jText }}>
              {journalTitle}
            </Link>{' '}
            · Volume {article.volume}, Issue {article.issue}
            {article.pages ? `, pp. ${article.pages}` : ''}
          </p>
          <h1
            style={{
              margin: '10px 0 0',
              fontFamily: 'var(--font-serif)',
              fontSize: 34,
              lineHeight: 1.2,
              fontWeight: 600,
              color: 'var(--ink, #101B27)',
              letterSpacing: '-.01em',
              textWrap: 'pretty',
              textDecoration: retracted ? 'line-through' : 'none',
              textDecorationThickness: 1,
            }}
          >
            {article.title}
          </h1>
          <div
            style={{
              marginTop: 16,
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px 14px',
              fontSize: 15,
              color: 'var(--ink, #101B27)',
            }}
          >
            {article.authors.map((au) => (
              <span key={au.name} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
                <Link
                  href={`/search?q=${encodeURIComponent(au.name)}`}
                  className="art-author-link"
                  style={{ color: 'var(--ink, #101B27)', fontWeight: 500 }}
                >
                  {au.name}
                </Link>
                {authorSup(au.affiliationIds) ? (
                  <sup style={{ fontSize: 11, color: 'var(--muted, #505C68)' }}>{authorSup(au.affiliationIds)}</sup>
                ) : null}
                {au.corresponding ? (
                  <span
                    title="Corresponding author"
                    aria-label="Corresponding author"
                    style={{ fontSize: 12, color: 'var(--accent, #1D5DA8)' }}
                  >
                    ✉
                  </span>
                ) : null}
                {au.orcid ? (
                  <a
                    href={`https://orcid.org/${au.orcid}`}
                    aria-label={`ORCID iD for ${au.name}`}
                    rel="noreferrer"
                    target="_blank"
                    style={{
                      display: 'inline-flex',
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: '#5A8A1F',
                      color: '#fff',
                      fontSize: 8,
                      fontWeight: 700,
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none',
                      transform: 'translateY(1px)',
                    }}
                  >
                    iD
                  </a>
                ) : null}
              </span>
            ))}
          </div>
          <button
            onClick={() => setAff((v) => !v)}
            aria-expanded={aff}
            style={{
              marginTop: 10,
              border: 0,
              background: 'none',
              padding: 0,
              color: 'var(--accent, #1D5DA8)',
              font: 'inherit',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {aff ? 'Hide affiliations' : 'Show affiliations and author information'}
          </button>
          {aff ? (
            <ol
              style={{
                listStyle: 'none',
                margin: '10px 0 0',
                padding: '12px 14px',
                background: 'var(--surface-2, #F5F6F7)',
                borderRadius: 3,
                fontSize: 13,
                lineHeight: 1.6,
                color: 'var(--ink-2, #1F2A36)',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              {article.affiliations.map((af, i) => (
                <li key={af.id}>
                  <sup style={{ color: 'var(--muted, #505C68)' }}>{marker(i)}</sup> {af.name}
                  {af.country ? `, ${af.country}` : ''}
                </li>
              ))}
              {correspondents.map((au) => (
                <li key={au.name} style={{ marginTop: 6, color: 'var(--ink-3, #3C4854)' }}>
                  ✉ Corresponding author: <a href={`mailto:${au.email}`}>{au.email}</a>
                </li>
              ))}
            </ol>
          ) : null}
          <dl
            style={{
              margin: '18px 0 0',
              padding: '14px 0',
              borderTop: '1px solid var(--line, #DCE1E6)',
              borderBottom: '1px solid var(--line, #DCE1E6)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px 24px',
              fontSize: 13,
            }}
          >
            {dates.map((d) => (
              <div key={d.l} style={{ display: 'flex', gap: 6 }}>
                <dt style={{ color: 'var(--muted, #505C68)' }}>{d.l}</dt>
                <dd style={{ margin: 0, color: 'var(--ink-2, #1F2A36)' }}>{d.v}</dd>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 6, flexBasis: '100%', alignItems: 'center', flexWrap: 'wrap' }}>
              <dt style={{ color: 'var(--muted, #505C68)' }}>DOI</dt>
              <dd style={{ margin: 0 }}>
                <a
                  href={doiUrl(article.doi)}
                  rel="noreferrer"
                  target="_blank"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
                >
                  https://doi.org/{article.doi}
                </a>
              </dd>
              <span style={{ flex: 1 }}></span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  border: '1px solid var(--line, #DCE1E6)',
                  borderRadius: 2,
                  padding: '2px 8px',
                  fontSize: 12,
                  color: 'var(--ink-2, #1F2A36)',
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: crossColor }}></span>
                CrossMark · {crossLabel}
              </span>
            </div>
          </dl>

          {article.highlights?.length ? (
            <section
              id="highlights"
              data-sec="1"
              style={{
                scrollMarginTop: 20,
                marginTop: 28,
                background: jTint,
                borderLeft: `3px solid ${jc}`,
                borderRadius: 3,
                padding: '16px 20px',
              }}
            >
              <h2
                style={{
                  margin: '0 0 10px',
                  fontSize: 13,
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                  color: 'var(--ink, #101B27)',
                }}
              >
                Highlights
              </h2>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 20,
                  fontFamily: 'var(--font-serif)',
                  fontSize: 17,
                  lineHeight: 1.65,
                  color: 'var(--ink-2, #1F2A36)',
                }}
              >
                {article.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {article.graphicalAbstract ? (
            <section id="graphical" style={{ marginTop: 28 }}>
              <h2
                style={{
                  margin: '0 0 10px',
                  fontSize: 13,
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                  color: 'var(--ink, #101B27)',
                }}
              >
                Graphical abstract
              </h2>
              <button
                onClick={() =>
                  setLb({ title: 'Graphical abstract', caption: article.graphicalAbstract?.caption ?? '' })
                }
                aria-label="Enlarge graphical abstract"
                style={{
                  display: 'block',
                  width: '100%',
                  aspectRatio: '16/7',
                  border: '1px solid var(--line, #DCE1E6)',
                  borderRadius: 2,
                  cursor: 'zoom-in',
                  background: `repeating-linear-gradient(135deg, ${jTintA} 0 10px, ${jTintB} 10px 20px)`,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: 'var(--muted, #505C68)',
                }}
              >
                {article.graphicalAbstract.alt}
              </button>
            </section>
          ) : null}

          <section id="abstract" data-sec="1" style={{ scrollMarginTop: 20, marginTop: 32 }}>
            <h2
              style={{
                margin: '0 0 12px',
                fontFamily: 'var(--font-serif)',
                fontSize: 24,
                fontWeight: 600,
                color: 'var(--ink, #101B27)',
              }}
            >
              Abstract
            </h2>
            <p style={{ ...paraStyle, margin: 0 }}>{article.abstract}</p>
          </section>
          {article.keywords.length ? (
            <section id="keywords" data-sec="1" style={{ scrollMarginTop: 20, marginTop: 24 }}>
              <h2
                style={{
                  margin: '0 0 10px',
                  fontSize: 13,
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                  color: 'var(--ink, #101B27)',
                }}
              >
                Keywords
              </h2>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {article.keywords.map((k) => (
                  <li key={k}>
                    <Link
                      href={`/search?q=${encodeURIComponent(k)}`}
                      className="art-kw"
                      style={{
                        display: 'inline-block',
                        fontSize: 13,
                        padding: '4px 10px',
                        border: '1px solid var(--line-strong, #B9C1C9)',
                        borderRadius: 2,
                        color: 'var(--ink-2, #1F2A36)',
                      }}
                    >
                      {k}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {(article.body ?? []).map((s) => (
            <section key={s.id} id={s.id} data-sec="1" style={{ scrollMarginTop: 20, marginTop: 40 }}>
              <h2
                style={{
                  margin: '0 0 14px',
                  fontFamily: 'var(--font-serif)',
                  fontSize: 24,
                  fontWeight: 600,
                  color: 'var(--ink, #101B27)',
                  display: 'flex',
                  gap: 12,
                }}
              >
                <span style={{ color: jText, fontWeight: 400 }}>{s.number}</span>
                {s.heading}
              </h2>
              {renderBlocks(s)}
              {s.subsections?.map((sub) => (
                <div key={sub.id} id={sub.id} style={{ scrollMarginTop: 20 }}>
                  <h3
                    style={{
                      margin: '24px 0 10px',
                      fontSize: 18,
                      fontWeight: 600,
                      color: 'var(--ink, #101B27)',
                      display: 'flex',
                      gap: 10,
                    }}
                  >
                    <span style={{ color: jText, fontWeight: 400 }}>{sub.number}</span>
                    {sub.heading}
                  </h3>
                  {renderBlocks(sub)}
                </div>
              ))}
            </section>
          ))}

          {decl.length ? (
            <section
              id="declarations"
              data-sec="1"
              style={{ scrollMarginTop: 20, marginTop: 48, borderTop: `2px solid ${jc}`, paddingTop: 20 }}
            >
              <h2
                style={{
                  margin: '0 0 16px',
                  fontFamily: 'var(--font-serif)',
                  fontSize: 24,
                  fontWeight: 600,
                  color: 'var(--ink, #101B27)',
                }}
              >
                Declarations
              </h2>
              <dl style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
                {decl.map(([h, t]) => (
                  <div
                    key={h}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '190px minmax(0,1fr)',
                      gap: 16,
                      padding: '12px 0',
                      borderBottom: '1px solid var(--line, #DCE1E6)',
                    }}
                  >
                    <dt style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink, #101B27)' }}>{h}</dt>
                    <dd style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2, #1F2A36)' }}>{t}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          {article.supplementary?.length ? (
            <section id="supplementary" style={{ marginTop: 36 }}>
              <h2
                style={{
                  margin: '0 0 12px',
                  fontSize: 13,
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                  color: 'var(--ink, #101B27)',
                }}
              >
                Supplementary material
              </h2>
              {article.supplementary.map((f) => (
                <div
                  key={f.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '10px 0',
                    borderBottom: '1px solid var(--line, #DCE1E6)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      padding: '3px 6px',
                      border: '1px solid var(--line-strong, #B9C1C9)',
                      borderRadius: 2,
                      width: 40,
                      textAlign: 'center',
                    }}
                  >
                    {f.kind}
                  </span>
                  <span style={{ flex: 1, fontSize: 14, color: 'var(--ink, #101B27)' }}>{f.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--muted, #505C68)' }}>{f.size}</span>
                  {f.href ? (
                    <a href={f.href} style={{ fontSize: 13, fontWeight: 500 }}>
                      Download
                    </a>
                  ) : null}
                </div>
              ))}
            </section>
          ) : null}

          <section
            id="cite"
            style={{
              marginTop: 36,
              background: jTint,
              borderLeft: `3px solid ${jc}`,
              borderRadius: 3,
              padding: '18px 20px',
            }}
          >
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}
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
                How to cite
              </h2>
              <button
                onClick={() => copyText(citations.plain, setPlainCopied)}
                style={{
                  border: '1px solid var(--line-strong, #B9C1C9)',
                  background: 'var(--surface, #fff)',
                  borderRadius: 3,
                  padding: '5px 10px',
                  font: 'inherit',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {plainCopied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2, #1F2A36)' }}>
              {citations.plain}
            </p>
          </section>

          {refs.length ? (
            <section id="references" data-sec="1" style={{ scrollMarginTop: 20, marginTop: 40 }}>
              <h2
                style={{
                  margin: '0 0 12px',
                  fontFamily: 'var(--font-serif)',
                  fontSize: 24,
                  fontWeight: 600,
                  color: 'var(--ink, #101B27)',
                }}
              >
                References
              </h2>
              <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {refs.map((r, i) => (
                  <li
                    key={r.id}
                    id={`ref${i + 1}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '32px minmax(0,1fr)',
                      gap: 8,
                      padding: '10px 8px',
                      borderBottom: '1px solid var(--line-soft, #EEF1F4)',
                      fontSize: 14,
                      lineHeight: 1.55,
                      background: pop === i + 1 ? '#FFF8E1' : 'transparent',
                      scrollMarginTop: 20,
                    }}
                  >
                    <span style={{ color: 'var(--muted, #505C68)', fontVariantNumeric: 'tabular-nums' }}>
                      {i + 1}.
                    </span>
                    <div>
                      <span style={{ color: 'var(--ink-2, #1F2A36)' }}>{r.text}</span>
                      <div style={{ display: 'flex', gap: 14, marginTop: 4, fontSize: 12, fontWeight: 500 }}>
                        {r.doi ? (
                          <a href={doiUrl(r.doi)} rel="noreferrer" target="_blank">
                            Crossref
                          </a>
                        ) : null}
                        <a href={scholarHref(r.text)} rel="noreferrer" target="_blank">
                          Google Scholar
                        </a>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {related.length ? (
            <section style={{ marginTop: 40 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 13,
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                  color: 'var(--ink, #101B27)',
                  paddingBottom: 10,
                  borderBottom: `2px solid ${jc}`,
                }}
              >
                Related articles
              </h2>
              {related.map((r) => (
                <div
                  key={r.href}
                  style={{
                    padding: '14px 0',
                    borderBottom: '1px solid var(--line, #DCE1E6)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <Link
                    href={r.href}
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: 16,
                      fontWeight: 600,
                      color: 'var(--ink, #101B27)',
                      lineHeight: 1.4,
                    }}
                  >
                    {r.title}
                  </Link>
                  <span style={{ fontSize: 13, color: 'var(--muted, #505C68)' }}>
                    {r.authorLine} · <em>{r.code}</em> · {r.date}
                  </span>
                </div>
              ))}
            </section>
          ) : null}
        </main>

        <aside
          aria-label="Article actions"
          style={{
            width: 250,
            flexShrink: 0,
            position: 'sticky',
            top: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {pdf ? (
            <>
              <a
                href={article.pdfHref}
                style={{
                  background: jDark,
                  color: '#fff',
                  padding: '10px 14px',
                  borderRadius: 3,
                  fontSize: 14,
                  fontWeight: 500,
                  textAlign: 'center',
                  textDecoration: 'none',
                }}
              >
                View PDF
              </a>
              <a
                href={article.pdfHref}
                download
                style={{
                  border: '1px solid var(--line-strong, #B9C1C9)',
                  color: 'var(--ink, #101B27)',
                  padding: '9px 14px',
                  borderRadius: 3,
                  fontSize: 14,
                  fontWeight: 500,
                  textAlign: 'center',
                  textDecoration: 'none',
                }}
              >
                Download PDF
              </a>
            </>
          ) : (
            <div
              style={{
                border: '1px solid var(--line, #DCE1E6)',
                background: 'var(--surface-2, #F5F6F7)',
                borderRadius: 3,
                padding: '12px 14px',
                fontSize: 13,
                lineHeight: 1.5,
                color: 'var(--ink-2, #1F2A36)',
              }}
            >
              The PDF for this article is being prepared. The full text above is the version of record.
            </div>
          )}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setCite((v) => !v)}
              aria-expanded={cite}
              aria-haspopup="dialog"
              style={{
                width: '100%',
                border: '1px solid var(--line-strong, #B9C1C9)',
                background: 'var(--surface, #fff)',
                color: 'var(--ink, #101B27)',
                padding: '9px 14px',
                borderRadius: 3,
                font: 'inherit',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              Cite this article
              <span aria-hidden="true" style={{ fontSize: 10, color: 'var(--muted, #505C68)' }}>
                ▼
              </span>
            </button>
            {cite ? (
              <div
                role="dialog"
                aria-label="Export citation"
                style={{
                  transformOrigin: 'top right',
                  animation: 'ngiqDrop .22s ease both',
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 4px)',
                  width: 340,
                  background: 'var(--surface, #fff)',
                  border: '1px solid var(--line-strong, #B9C1C9)',
                  borderRadius: 3,
                  boxShadow: '0 8px 24px rgba(16,27,39,.12)',
                  zIndex: 20,
                  padding: 14,
                }}
              >
                <div
                  role="tablist"
                  style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--line, #DCE1E6)', marginBottom: 10 }}
                >
                  {citeTabs.map((ct) => (
                    <button
                      key={ct.key}
                      role="tab"
                      aria-selected={fmt === ct.key}
                      onClick={() => {
                        setFmt(ct.key)
                        setCopied(false)
                      }}
                      style={{
                        border: 0,
                        background: 'none',
                        padding: '6px 8px',
                        font: 'inherit',
                        fontSize: 13,
                        cursor: 'pointer',
                        fontWeight: fmt === ct.key ? 600 : 400,
                        borderBottom: `2px solid ${fmt === ct.key ? 'var(--accent, #1D5DA8)' : 'transparent'}`,
                        color: 'var(--ink, #101B27)',
                      }}
                    >
                      {ct.label}
                    </button>
                  ))}
                </div>
                <pre
                  style={{
                    margin: 0,
                    maxHeight: 180,
                    overflow: 'auto',
                    background: 'var(--surface-2, #F5F6F7)',
                    padding: 10,
                    borderRadius: 2,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {citations[fmt]}
                </pre>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button
                    onClick={() => copyText(citations[fmt], setCopied)}
                    style={{
                      flex: 1,
                      border: 0,
                      background: jDark,
                      color: '#fff',
                      borderRadius: 3,
                      padding: 8,
                      font: 'inherit',
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    {copied ? 'Copied to clipboard' : 'Copy citation'}
                  </button>
                  <button
                    onClick={() => setCite((v) => !v)}
                    style={{
                      border: '1px solid var(--line-strong, #B9C1C9)',
                      background: 'var(--surface, #fff)',
                      borderRadius: 3,
                      padding: '8px 12px',
                      font: 'inherit',
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    Close
                  </button>
                </div>
                <span aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>
                  {copied ? 'Citation copied to clipboard' : ''}
                </span>
              </div>
            ) : null}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button
              onClick={() => copyText(window.location.href, setShared)}
              style={{
                border: '1px solid var(--line-strong, #B9C1C9)',
                background: 'var(--surface, #fff)',
                padding: 8,
                borderRadius: 3,
                font: 'inherit',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {shared ? 'Link copied' : 'Share'}
            </button>
            <button
              onClick={() => window.print()}
              style={{
                border: '1px solid var(--line-strong, #B9C1C9)',
                background: 'var(--surface, #fff)',
                padding: 8,
                borderRadius: 3,
                font: 'inherit',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Print
            </button>
          </div>
          <Link id="rights" href={licenseHref} style={{ fontSize: 13, padding: '4px 0' }}>
            Rights and permissions
          </Link>
          {metrics.length ? (
            <div style={{ borderTop: '1px solid var(--line, #DCE1E6)', paddingTop: 14, marginTop: 4 }}>
              <span
                style={{
                  display: 'block',
                  fontSize: 11,
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                  color: 'var(--muted, #505C68)',
                  fontWeight: 600,
                  marginBottom: 10,
                }}
              >
                Metrics
              </span>
              <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {metrics.map((m) => (
                  <div key={m.l} style={{ display: 'flex', flexDirection: 'column' }}>
                    <dd
                      style={{
                        margin: 0,
                        fontFamily: 'var(--font-serif)',
                        fontSize: 20,
                        fontWeight: 600,
                        color: jText,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {m.v}
                    </dd>
                    <dt style={{ fontSize: 12, color: 'var(--muted, #505C68)', order: 2 }}>{m.l}</dt>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
          <div
            style={{
              borderTop: '1px solid var(--line, #DCE1E6)',
              paddingTop: 14,
              marginTop: 4,
              fontSize: 13,
              lineHeight: 1.5,
              color: 'var(--ink-3, #3C4854)',
            }}
          >
            This article is licensed under <Link href={licenseHref}>CC BY 4.0</Link>. You may share and adapt it
            with attribution.
          </div>
        </aside>
      </div>

      {pop !== null && refs[pop - 1] ? (
        <div
          role="dialog"
          aria-label="Reference"
          style={{
            position: 'fixed',
            left: '50%',
            bottom: 24,
            transform: 'translateX(-50%)',
            width: 'min(560px, calc(100vw - 32px))',
            background: 'var(--surface, #fff)',
            border: '1px solid var(--line-strong, #B9C1C9)',
            borderRadius: 3,
            boxShadow: '0 8px 24px rgba(16,27,39,.16)',
            padding: '16px 18px',
            zIndex: 40,
            fontSize: 14,
            lineHeight: 1.55,
          }}
        >
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}
          >
            <strong>Reference {pop}</strong>
            <button
              onClick={() => setPop(null)}
              aria-label="Close"
              style={{
                border: 0,
                background: 'none',
                fontSize: 18,
                cursor: 'pointer',
                color: 'var(--ink-3, #3C4854)',
              }}
            >
              ×
            </button>
          </div>
          <p style={{ margin: '0 0 10px' }}>{refs[pop - 1].text}</p>
          <div style={{ display: 'flex', gap: 16, fontSize: 13, fontWeight: 500 }}>
            <a href={`#ref${pop}`} onClick={() => setPop(null)}>
              Go to reference list
            </a>
            {refs[pop - 1].doi ? (
              <a href={doiUrl(refs[pop - 1].doi!)} rel="noreferrer" target="_blank">
                Crossref
              </a>
            ) : null}
            <a href={scholarHref(refs[pop - 1].text)} rel="noreferrer" target="_blank">
              Google Scholar
            </a>
          </div>
        </div>
      ) : null}
      {lb ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Figure viewer"
          style={{
            animation: 'ngiqFadeA .25s ease both',
            position: 'fixed',
            inset: 0,
            background: 'rgba(10,18,27,.86)',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            padding: 24,
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: '#fff',
              marginBottom: 12,
            }}
          >
            <span style={{ fontSize: 14 }}>{lb.title}</span>
            <button
              onClick={() => setLb(null)}
              style={{
                border: '1px solid #6F88A1',
                background: 'transparent',
                color: '#fff',
                borderRadius: 3,
                padding: '6px 12px',
                font: 'inherit',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Close (Esc)
            </button>
          </div>
          <div
            style={{
              animation: 'ngiqZoom .4s cubic-bezier(.2,.7,.2,1) both',
              flex: 1,
              background: `repeating-linear-gradient(135deg, ${jTintA} 0 10px, ${jTintB} 10px 20px)`,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              color: 'var(--muted, #505C68)',
            }}
          >
            {lb.title} — full resolution
          </div>
          <p style={{ color: '#E3E9EF', fontSize: 14, lineHeight: 1.55, maxWidth: '80ch', margin: '12px 0 0' }}>
            {lb.caption}
          </p>
        </div>
      ) : null}
    </>
  )
}
