import { NextResponse } from 'next/server'
import { publicBaseUrl } from '@/lib/api'
import { execute } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** Double opt-in confirmation. Redirects to a human-readable page either way. */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token')
  const base = publicBaseUrl(request)

  if (!token) {
    return NextResponse.redirect(new URL('/alerts?status=invalid', base))
  }

  try {
    const rows = await execute(
      'UPDATE alert_signups SET verified_at = NOW() WHERE verify_token = ? AND verified_at IS NULL',
      [token],
    )
    // Zero rows means the token is unknown or already used. Both are reported
    // the same way so the endpoint cannot be used to probe for valid tokens.
    return NextResponse.redirect(new URL(`/alerts?status=${rows > 0 ? 'confirmed' : 'already'}`, base))
  } catch {
    return NextResponse.redirect(new URL('/alerts?status=error', base))
  }
}
