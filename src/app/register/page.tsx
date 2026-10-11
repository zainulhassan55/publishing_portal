import type { Metadata } from 'next'
import { RegisterPage } from '@/components/mockup/RegisterPage'
import { journalCode, journals } from '@/data/registry'

export const metadata: Metadata = {
  title: 'Create an account',
  description:
    'Create a NextGenIQ Press account to submit manuscripts, track editorial decisions and accept review invitations across every journal.',
  alternates: { canonical: '/register' },
  // An account form has nothing to index, and a crawler following it would
  // only find a sign-up it cannot complete.
  robots: { index: false, follow: true },
}

/**
 * Server wrapper. The journal list is passed in rather than fetched client
 * side: it is static content, and the titles are what OJS matches its
 * enrolment checkboxes on, so they must come from the same registry the rest
 * of the site renders from.
 */
export default function Register() {
  return (
    <RegisterPage
      journals={journals.map((journal) => ({
        slug: journal.slug,
        code: journalCode(journal),
        title: journal.title,
      }))}
    />
  )
}
