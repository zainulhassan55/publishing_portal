import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getNews } from '@/data/content'
import { formatDate } from '@/lib/format'

export function generateStaticParams() {
  return getNews().map((item) => ({ slug: item.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const item = getNews().find((n) => n.slug === slug)
  if (!item) return { title: 'Announcement not found' }

  return {
    title: item.title,
    description: item.body?.[0]?.slice(0, 160) ?? item.title,
    alternates: { canonical: `/news/${item.slug}` },
    openGraph: { type: 'article', title: item.title, publishedTime: item.dateIso },
  }
}

export default async function NewsItemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const item = getNews().find((n) => n.slug === slug)

  if (!item) notFound()

  return (
    <div id="main-content" style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 32px 0' }}>
      <nav aria-label="Breadcrumb" style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--muted,#505C68)', flexWrap: 'wrap' }}>
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/news">News</Link>
        <span aria-hidden="true">/</span>
        <span style={{ color: 'var(--ink-2,#1F2A36)' }}>{item.title}</span>
      </nav>

      <article style={{ maxWidth: 720, padding: '24px 0 0' }}>
        <span style={{ fontSize: 12, color: 'var(--muted,#505C68)' }}>
          <span style={{ fontWeight: 600, color: 'var(--warm,#B5400F)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{item.type}</span>
          {' · '}
          <time dateTime={item.dateIso}>{formatDate(item.dateIso)}</time>
        </span>
        <h1 style={{ margin: '8px 0 24px', fontFamily: 'var(--font-serif)', fontSize: 34, lineHeight: 1.18, fontWeight: 600, color: 'var(--ink,#101B27)', letterSpacing: '-.01em' }}>{item.title}</h1>

        {(item.body ?? []).map((paragraph, i) => (
          <p key={i} style={{ margin: '0 0 16px', fontSize: 17, lineHeight: 1.7, color: 'var(--ink-2,#1F2A36)', maxWidth: '70ch', textWrap: 'pretty' }}>
            {paragraph}
          </p>
        ))}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 32, borderTop: '1px solid var(--line,#DCE1E6)', paddingTop: 20 }}>
          <Link href="/news" style={{ border: '1px solid var(--line-strong,#B9C1C9)', color: 'var(--ink,#101B27)', padding: '9px 18px', borderRadius: 3, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>All announcements</Link>
          <Link href="/journals" style={{ border: '1px solid var(--line-strong,#B9C1C9)', color: 'var(--ink,#101B27)', padding: '9px 18px', borderRadius: 3, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Browse journals</Link>
        </div>
      </article>
    </div>
  )
}
