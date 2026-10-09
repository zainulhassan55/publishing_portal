import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()

  return NextResponse.json(
    { user: session.user },
    {
      headers: {
        // Identity must never be cached by a CDN or the browser; a shared cache
        // here would serve one reader's session to another.
        'Cache-Control': 'no-store, private',
      },
    },
  )
}
