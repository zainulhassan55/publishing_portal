import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SectionToc } from '@/components/nav/SectionToc'
import { getPolicy, policies } from '@/data/policies'
import { formatDate } from '@/lib/format'
import type { ContentTable } from '@/types/content'

export function generateStaticParams() {
  return policies.map((policy) => ({ slug: policy.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const policy = getPolicy(slug)
  if (!policy) return { title: 'Policy not found' }

  return {
    title: policy.title,
    description: policy.summary,
    alternates: { canonical: `/policies/${policy.slug}` },
  }
}

const sectionId = (index: number) => `s${index + 1}`

/** The numbered-section table from JournalStaticPage. */
function BlockTable({ table }: { table: ContentTable }) {
  return (
    <div style={{ overflowX: 'auto', margin: '4px 0 24px', borderTop: '2px solid #101B27' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 520 }}>
        {table.caption ? (
          <caption style={{ captionSide: 'bottom', textAlign: 'left', padding: '10px 0 0', fontSize: 13, color: 'var(--muted,#505C68)', lineHeight: 1.5 }}>{table.caption}</caption>
        ) : null}
        <thead>
          <tr>
            {table.head.map((h) => (
              <th key={h} scope="col" style={{ textAlign: 'left', padding: '10px 12px 10px 0', fontSize: 12, color: 'var(--muted,#505C68)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', borderBottom: '1px solid var(--line-strong,#B9C1C9)' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} style={{ padding: '11px 12px 11px 0', borderBottom: '1px solid var(--line,#DCE1E6)', verticalAlign: 'top', lineHeight: 1.45 }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const policy = getPolicy(slug)

  if (!policy) notFound()

  const toc = policy.blocks.map((block, i) => ({ id: sectionId(i), label: block.title }))
  const others = policies.filter((other) => other.slug !== policy.slug && other.group === policy.group)

  return (
    <>
      <style>{`.pol-other:hover{color:var(--accent,#1D5DA8)}`}</style>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 32px 0' }}>
        <nav aria-label="Breadcrumb" style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--muted,#505C68)', flexWrap: 'wrap' }}>
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/policies">Policies</Link>
          <span aria-hidden="true">/</span>
          <span style={{ color: 'var(--ink-2,#1F2A36)' }}>{policy.title}</span>
        </nav>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 32px 0', display: 'flex', gap: 56, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <article id="main-content" style={{ flex: 1, minWidth: 300, maxWidth: 720 }}>
          <span style={{ fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted,#505C68)', fontWeight: 500 }}>{policy.group}</span>
          <h1 style={{ margin: '6px 0 10px', fontFamily: 'var(--font-serif)', fontSize: 36, lineHeight: 1.15, fontWeight: 600, color: 'var(--ink,#101B27)', letterSpacing: '-.01em' }}>{policy.title}</h1>
          <p style={{ margin: '0 0 10px', fontSize: 17, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)', maxWidth: '68ch' }}>{policy.intro ?? policy.summary}</p>
          <p style={{ margin: '0 0 28px', fontSize: 13, color: 'var(--muted,#505C68)' }}>
            Last updated <time dateTime={policy.updatedIso}>{formatDate(policy.updatedIso)}</time>.
            {policy.intro ? null : ' This policy applies to every NextGenIQ Press journal and series.'}
          </p>

          {policy.blocks.map((block, i) => (
            <section key={block.title} id={sectionId(i)} data-sec="1" style={{ scrollMarginTop: 24, paddingBottom: 12 }}>
              <h2 style={{ margin: '0 0 14px', fontFamily: 'var(--font-serif)', fontSize: 24, lineHeight: 1.25, fontWeight: 600, color: 'var(--ink,#101B27)', display: 'flex', gap: 12 }}>
                <span aria-hidden="true" style={{ color: 'var(--muted,#6B7682)', fontWeight: 400 }}>{i + 1}</span>
                {block.title}
              </h2>

              {block.paragraphs?.map((paragraph, k) => (
                <p key={k} style={{ margin: '0 0 16px', fontSize: 17, lineHeight: 1.7, color: 'var(--ink-2,#1F2A36)', textWrap: 'pretty' }}>
                  {paragraph}
                </p>
              ))}

              {block.bullets ? (
                <ul style={{ margin: '0 0 20px', paddingLeft: 22, fontSize: 17, lineHeight: 1.7, color: 'var(--ink-2,#1F2A36)' }}>
                  {block.bullets.map((li) => (
                    <li key={li} style={{ paddingLeft: 4, marginBottom: 4 }}>{li}</li>
                  ))}
                </ul>
              ) : null}

              {block.table ? <BlockTable table={block.table} /> : null}

              {block.subsections?.map((sub) => (
                <div key={sub.title} style={{ margin: '0 0 8px' }}>
                  <h3 style={{ margin: '8px 0 10px', fontSize: 18, fontWeight: 600, color: 'var(--ink,#101B27)' }}>{sub.title}</h3>
                  {sub.paragraphs?.map((paragraph, k) => (
                    <p key={k} style={{ margin: '0 0 16px', fontSize: 17, lineHeight: 1.7, color: 'var(--ink-2,#1F2A36)' }}>
                      {paragraph}
                    </p>
                  ))}
                  {sub.bullets ? (
                    <ul style={{ margin: '0 0 20px', paddingLeft: 22, fontSize: 17, lineHeight: 1.7, color: 'var(--ink-2,#1F2A36)' }}>
                      {sub.bullets.map((li) => (
                        <li key={li} style={{ paddingLeft: 4, marginBottom: 4 }}>{li}</li>
                      ))}
                    </ul>
                  ) : null}
                  {sub.table ? <BlockTable table={sub.table} /> : null}
                </div>
              ))}
            </section>
          ))}

          <nav aria-label="Other policies" style={{ marginTop: 40, borderTop: '1px solid var(--line,#DCE1E6)', paddingTop: 20 }}>
            <span style={{ display: 'block', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted,#505C68)', fontWeight: 600, marginBottom: 8 }}>More in {policy.group.toLowerCase()}</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,260px),1fr))', columnGap: 32 }}>
              {others.map((other) => (
                <Link key={other.slug} href={`/policies/${other.slug}`} className="pol-other" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--line,#DCE1E6)', fontSize: 14, color: 'var(--ink,#101B27)', textDecoration: 'none' }}>
                  {other.title}
                  <span aria-hidden="true" style={{ color: 'var(--muted,#6B7682)' }}>→</span>
                </Link>
              ))}
            </div>
          </nav>
        </article>

        <aside style={{ width: 220, flexShrink: 0, position: 'sticky', top: 16, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {toc.length > 1 ? <SectionToc entries={toc} /> : null}
          <div style={{ border: '1px solid var(--line,#DCE1E6)', borderRadius: 3, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Need to ask about this?</span>
            <span style={{ fontSize: 13, color: 'var(--ink-3,#3C4854)', lineHeight: 1.5 }}>Email contact@nextgeniqpress.com or use the contact form.</span>
            <Link href="/contact" style={{ background: 'var(--accent,#1D5DA8)', color: '#fff', padding: '9px 12px', borderRadius: 3, fontSize: 14, fontWeight: 500, textAlign: 'center', textDecoration: 'none' }}>Contact the editorial office</Link>
          </div>
        </aside>
      </div>
    </>
  )
}
