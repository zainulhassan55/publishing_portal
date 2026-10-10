import type { Metadata } from 'next'
import Link from 'next/link'
import { ContactForm } from '@/components/contact/ContactForm'
import { journals } from '@/data/registry'
import { journalCode } from '@/data/registry'
import { editorialEmail } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Contact the editorial office',
  description:
    'Reach the NextGenIQ Press editorial office about a submission, a policy, a special issue proposal or a technical problem. We reply within two working days.',
  alternates: { canonical: '/contact' },
}

const asides = [
  {
    h: 'Checking a submission?',
    p: 'Your dashboard shows the current stage and the next expected action, which is usually faster than asking us. Quote your submission reference if you do write.',
  },
  {
    h: 'Reporting a concern',
    p: 'Concerns about a published article — data integrity, authorship, undisclosed interests — are handled confidentially under the COPE flowcharts. Say so in your message and it is routed to an editor who was not involved in the original decision.',
  },
]

export default function ContactPage() {
  const journalOptions = journals.map((journal) => ({
    slug: journal.slug,
    label: `${journalCode(journal)} — ${journal.title}`,
  }))

  return (
    <div id="main-content" style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 32px 0' }}>
      <nav aria-label="Breadcrumb" style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--muted,#505C68)' }}>
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span style={{ color: 'var(--ink-2,#1F2A36)' }}>Contact</span>
      </nav>

      <div style={{ padding: '20px 0 24px', borderBottom: '1px solid var(--line,#DCE1E6)' }}>
        <span style={{ display: 'block', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted,#505C68)', fontWeight: 600 }}>Contact</span>
        <h1 style={{ margin: '6px 0 10px', fontFamily: 'var(--font-serif)', fontSize: 36, lineHeight: 1.15, fontWeight: 600, color: 'var(--ink,#101B27)', letterSpacing: '-.01em' }}>Contact the editorial office</h1>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)', maxWidth: '68ch' }}>
          We handle queries about submissions in progress, policies, special-issue proposals and editorial board
          applications. We reply within two working days.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 56, alignItems: 'flex-start', flexWrap: 'wrap', padding: '32px 0 0' }}>
        <div style={{ flex: 1, minWidth: 300, maxWidth: 720 }}>
          <ContactForm journals={journalOptions} />
        </div>

        <aside style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ border: '1px solid var(--line,#DCE1E6)', borderRadius: 3, background: 'var(--surface,#fff)', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Email directly</h2>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)' }}>
              If you would rather use your own mail client, write to{' '}
              <a href={`mailto:${editorialEmail}`} style={{ fontWeight: 500 }}>{editorialEmail}</a>.
            </p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--muted,#505C68)' }}>Office hours: Monday to Friday, 09:00–17:00 UTC.</p>
          </div>

          {asides.map((a) => (
            <div key={a.h} style={{ border: '1px solid var(--line,#DCE1E6)', borderRadius: 3, background: 'var(--surface,#fff)', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--ink,#101B27)' }}>{a.h}</h2>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)' }}>{a.p}</p>
            </div>
          ))}
        </aside>
      </div>
    </div>
  )
}
