/**
 * The portal's side of chapter payments.
 *
 * Payments run in a separate Cloudflare Worker (workers/chapter-pay), built on
 * the TAIIS conference payment engine: it holds the gateway keys, receives the
 * NewebPay and PayPal callbacks, and keeps the order ledger in KV. The portal
 * only talks to it server-to-server, so gateway secrets never reach the VPS
 * and the browser never needs a CSP exception for the Worker's origin.
 *
 * Unconfigured (PAY_API_URL unset) means payments are off: checkout keeps
 * landing on the "coming soon" page and the admin orders page says so.
 *
 * Server-only: reads PAY_PORTAL_SECRET and PAY_ADMIN_TOKEN. Never import it
 * from a client component.
 */

export type PaidState = 'success' | 'pending' | 'open' | 'fail'

export type OrderStatus = {
  ok: true
  state: PaidState
  orderNo: string
  totalUsd: number
  /** Absent on orders created before NT$ prices (November 2026). */
  totalTwd?: number
  paidAt: string
  gateway: string
  itemIds: string[]
  email: string
  emailSent: boolean
}

export type OrderSummary = {
  orderNo: string
  status: string
  createdAt: string
  payTime: string | null
  gateway: string | null
  totalUsd: number
  totalTwd: number | null
  paidUsd: number | null
  paidTwd: number | null
  tradeNo: string | null
  email: string
  name: string
  /** OJS user name of the signed-in buyer; null on orders placed before sign-in was required. */
  account?: string | null
  country: string
  company: string | null
  items: { id: string; title: string; seriesCode: string }[]
  emailSent: string | null
  anomaly: string | null
}

const base = () => (process.env.PAY_API_URL || '').trim().replace(/\/+$/, '')

export const paymentsConfigured = () => !!base() && !!process.env.PAY_PORTAL_SECRET?.trim()

/** Create the order in the Worker; returns where to send the reader to pay. */
export async function createPaymentOrder(body: object): Promise<{ ok: true; orderNo: string; payUrl: string } | { ok: false; error: string; status: number }> {
  const res = await fetch(`${base()}/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.PAY_PORTAL_SECRET!.trim()}` },
    body: JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  })
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; orderNo?: string; payUrl?: string }
  if (!res.ok || !data.ok || !data.payUrl || !data.orderNo) return { ok: false, error: data.error || 'The payment service did not accept the order.', status: res.status >= 400 && res.status < 500 ? 400 : 502 }
  return { ok: true, orderNo: data.orderNo, payUrl: data.payUrl }
}

/** Order status for the "payment complete" page; null when unknown or unreachable. */
export async function getPaymentStatus(orderNo: string, token: string): Promise<OrderStatus | null> {
  if (!base() || !/^[\w-]{1,30}$/.test(orderNo) || !/^[0-9a-f]{1,64}$/.test(token)) return null
  try {
    const res = await fetch(`${base()}/status/${encodeURIComponent(orderNo)}?t=${encodeURIComponent(token)}`, { cache: 'no-store', signal: AbortSignal.timeout(10_000) })
    const data = (await res.json()) as OrderStatus | { ok: false }
    return data.ok ? data : null
  } catch {
    return null
  }
}

/** Every order, newest first, for /admin/orders. Throws when the Worker cannot be read. */
export async function listPaymentOrders(): Promise<OrderSummary[]> {
  const res = await fetch(`${base()}/admin/orders.json`, {
    headers: { Authorization: `Bearer ${(process.env.PAY_ADMIN_TOKEN || '').trim()}` },
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) throw new Error(`payment service answered ${res.status}`)
  const data = (await res.json()) as { orders?: OrderSummary[] }
  return data.orders ?? []
}
