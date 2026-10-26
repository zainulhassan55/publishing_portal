import type { Metadata } from 'next'
import { ContactForm } from '@/components/contact/ContactForm'
import { FormPage, formPageRobots } from '@/components/forms/FormPage'
import { publicationOptions } from '@/data/registry'
import { requireMemberPage } from '@/lib/auth/require'

export const metadata: Metadata = { title: 'Message the editorial office', robots: formPageRobots }

export default async function ContactFormPage() {
  const user = await requireMemberPage('/contact/form')
  const journalOptions = publicationOptions().map((o) => ({ slug: o.value, label: o.label }))

  return (
    <FormPage
      trail={[{ label: 'Contact', href: '/contact' }]}
      kicker="Contact"
      title="Message the editorial office"
      intro="Your message goes to the editorial office by email, and you receive a copy with a reference number."
      back={{ label: 'contact page', href: '/contact' }}
      user={user}
    >
      <ContactForm journals={journalOptions} />
    </FormPage>
  )
}
