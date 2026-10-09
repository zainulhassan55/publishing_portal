import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SignInPage } from '@/components/mockup/SignInPage'

export const metadata: Metadata = {
  title: 'Sign in',
  description:
    'Sign in to NextGenIQ Press to submit a manuscript, resume a draft, respond to review invitations and track editorial decisions.',
  alternates: { canonical: '/sign-in' },
  // An account route has nothing to index and must never appear in results.
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    // SignInPage reads ?next= with useSearchParams, which needs a boundary
    // for the route itself to stay statically rendered.
    <Suspense fallback={null}>
      <SignInPage />
    </Suspense>
  )
}
