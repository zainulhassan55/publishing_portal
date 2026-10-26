import type { Metadata } from 'next'
import Link from 'next/link'
import { FormLauncher } from '@/components/forms/FormLauncher'
import { editorialEmail } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Contact the editorial office',
  description:
    'Send a message to the NextGenIQ Press editorial office about a submission, a policy, a proposal or a technical problem.',
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
  return (
    <div id="main-content" style={{ maxWidth: 1280, margin: '0 auto', padding: '20px var(--shell-pad) 0' }}>
      <nav aria-label="Breadcrumb" style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--muted,#505C68)' }}>
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span style={{ color: 'var(--ink-2,#1F2A36)' }}>Contact</span>
      </nav>

      <div style={{ padding: '20px 0 24px', borderBottom: '1px solid var(--line,#DCE1E6)' }}>
        <span style={{ display: 'block', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted,#505C68)', fontWeight: 600 }}>Contact</span>
        <h1 style={{ margin: '6px 0 10px', fontFamily: 'var(--font-serif)', fontSize: 36, lineHeight: 1.15, fontWeight: 600, color: 'var(--ink,#101B27)', letterSpacing: '-.01em' }}>Contact the editorial office</h1>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)', maxWidth: '68ch' }}>
          Write to us about submissions, policies, special issue or book proposals, editorial board applications, or
          anything else. Your message goes to the editorial office by email, and you receive a copy with a reference
          number.
        </p>
      </div>

      <div className="m-col" style={{ display: 'flex', gap: '32px 56px', alignItems: 'flex-start', flexWrap: 'wrap', padding: '32px 0 0' }}>
        <div style={{ flex: 1, minWidth: 300, maxWidth: 720 }}>
          <FormLauncher
            id="message"
            href="/contact/form"
            title="Send us a message"
            description="Tell us which journal or book series it concerns, choose a topic, and write your message. Quote your submission reference if you have one."
          />
        </div>

        <aside className="m-full" style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ border: '1px solid var(--line,#DCE1E6)', borderRadius: 3, background: 'var(--surface,#fff)', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Email directly</h2>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)' }}>
              If you would rather use your own mail client, write to{' '}
              <a href={`mailto:${editorialEmail}`} style={{ fontWeight: 500 }}>{editorialEmail}</a>.
            </p>
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
