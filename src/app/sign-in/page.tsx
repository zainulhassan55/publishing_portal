import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SignInPage } from '@/components/mockup/SignInPage'
import { withSharing } from '@/lib/metadata'

export const metadata: Metadata = withSharing({
  title: 'Sign in',
  description:
    'Sign in to NextGenIQ Press to submit a manuscript, resume a draft, respond to review invitations and track editorial decisions.',
  alternates: { canonical: '/sign-in' },
  // An account route has nothing to index and must never appear in results.
  robots: { index: false, follow: false },
})

/**
 * In-portal credential sign-in is off until the OJS login relay is built and
 * verified (`npm run spike` check 3). While it is off the page leads with the
 * link out to OJS instead of a form that can only fail.
 *
 * Read here rather than in the client component because the flag is a server
 * concern — it must not become NEXT_PUBLIC_, which would make it a build-time
 * constant baked into the bundle.
 */
const nativeSignIn = process.env.PORTAL_NATIVE_SIGNIN === '1'

export default function Page() {
  return (
    // SignInPage reads ?next= with useSearchParams, which needs a boundary
    // for the route itself to stay statically rendered.
    <Suspense fallback={null}>
      <SignInPage nativeSignIn={nativeSignIn} />
    </Suspense>
  )
}
