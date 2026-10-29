import type { Metadata } from 'next'
import Link from 'next/link'
import { journalCode, journals } from '@/data/registry'
import { ojsHandoffUrl, ojsSubmitUrl } from '@/lib/ojs/config'
import { withSharing } from '@/lib/metadata'

export const metadata: Metadata = withSharing({
  title: 'Submit a manuscript',
  description:
    'Choose the NextGenIQ Press journal that fits your work and start your submission in the editorial system, where drafts save automatically and you can resume at any time.',
  alternates: { canonical: '/submit' },
})

/**
 * Journal picker — the whole submission itself happens in OJS.
 *
 * This replaces the portal's seven-step submission wizard. The wizard
 * collected metadata and wrote it into OJS over the API, but OJS then walked
 * the author through its own wizard anyway (file upload has no API in OJS
 * 3.5), so the author met two forms either way — and abandoned portal drafts
 * accumulated beside OJS's own incomplete submissions. One form is honest:
 * OJS's, which autosaves and lets an author resume from the dashboard here.
 *
 * Every link goes through the OJSSID hand-off, so a signed-in author lands in
 * the wizard already authenticated. Signed out, OJS asks them to sign in or
 * register and then continues to the wizard itself.
 *
 * The hand-off also refuses to forward an account OJS would turn away: a
 * Reader-only account (what the portal's register page produces until the
 * journals permit Author self-registration) is sent back to the dashboard
 * with an explanation instead of to OJS's "The current role does not have
 * access to this operation" page. See src/lib/auth/ojs-access.ts.
 */
export default function Submit() {
  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px var(--shell-pad) 100px' }}>
      <nav aria-label="Breadcrumb" style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--muted,#505C68)' }}>
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span style={{ color: 'var(--ink-2,#1F2A36)' }}>Submit a manuscript</span>
      </nav>

      <h1 style={{ margin: '18px 0 10px', fontSize: 30, lineHeight: 1.2, color: 'var(--ink,#101B27)' }}>
        Submit a manuscript
      </h1>
      <p style={{ margin: '0 0 8px', fontSize: 15, lineHeight: 1.65, color: 'var(--ink-3,#3C4854)', maxWidth: 720 }}>
        Choose the journal that fits your work. Submission happens in the editorial system, which saves your progress
        automatically — you can leave at any point and resume from{' '}
        <Link href="/dashboard">your dashboard</Link>.
      </p>
      <p style={{ margin: '0 0 28px', fontSize: 14, lineHeight: 1.65, color: 'var(--muted,#505C68)', maxWidth: 720 }}>
        Before you start, check the <Link href="/authors">author guidelines</Link> for manuscript types, formatting and
        the submission checklist. If you are signed in here, you will arrive in the editorial system already signed in.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: 16 }}>
        {journals.map((journal) => (
          <section
            key={journal.slug}
            style={{
              background: 'var(--surface,#fff)',
              border: '1px solid var(--line,#DCE1E6)',
              borderRadius: 4,
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.04em', color: 'var(--accent,#1D5DA8)' }}>
              {journalCode(journal)}
            </div>
            <h2 style={{ margin: 0, fontSize: 17, lineHeight: 1.35, color: 'var(--ink,#101B27)' }}>{journal.title}</h2>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: 'var(--muted,#505C68)', flexGrow: 1 }}>
              {journal.tagline ?? journal.area}
            </p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <a
                href={ojsHandoffUrl(ojsSubmitUrl(journal.slug))}
                style={{
                  background: 'var(--accent,#1D5DA8)',
                  color: '#fff',
                  padding: '8px 14px',
                  borderRadius: 3,
                  fontSize: 13,
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                Start submission
              </a>
              <Link href={`/journals/${journal.slug}`} style={{ fontSize: 13, color: 'var(--accent,#1D5DA8)' }}>
                About this journal
              </Link>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
