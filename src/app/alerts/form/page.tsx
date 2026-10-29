import type { Metadata } from 'next'
import { AlertsForm } from '@/components/forms/AlertsForm'
import { FormPage, formPageRobots } from '@/components/forms/FormPage'
import { requireMemberPage } from '@/lib/auth/require'
import { withSharing } from '@/lib/metadata'

export const metadata: Metadata = withSharing({ title: 'Email alerts', robots: formPageRobots })

export default async function AlertsFormPage() {
  const user = await requireMemberPage('/alerts/form')
  return (
    <FormPage
      trail={[{ label: 'For authors', href: '/authors' }]}
      kicker="Email alerts"
      title="Subscribe to email alerts"
      intro="Receive new tables of contents and calls for papers. We send a confirmation link first, and every alert has a one-click unsubscribe."
      back={{ label: 'author hub', href: '/authors#alerts' }}
      user={user}
    >
      <AlertsForm initialEmail={user.email} />
    </FormPage>
  )
}
