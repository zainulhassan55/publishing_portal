import { NextResponse } from 'next/server'
import { handler } from '@/lib/api'
import { SHOP_BUYER_COOKIE } from '@/lib/shop/buyer-core'

export const dynamic = 'force-dynamic'

/** Ends the shop's Google sign-in. Leaves an OJS sign-in, if any, alone: that has its own sign-out. */
export const POST = handler(async () => {
  const response = NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  response.cookies.set({ name: SHOP_BUYER_COOKIE, value: '', path: '/', maxAge: 0 })
  return response
})
