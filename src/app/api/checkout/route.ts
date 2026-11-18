import { enforceRateLimit, handler, jsonError, jsonOk, readJson } from '@/lib/api'
import { chapterPrice } from '@/lib/cart/pricing'
import { createPaymentOrder, paymentsConfigured } from '@/lib/pay/server'

export const dynamic = 'force-dynamic'

type Item = { id?: unknown; title?: unknown; volumeTitle?: unknown; seriesCode?: unknown }
type Body = { items?: Item[]; buyer?: Record<string, unknown>; method?: unknown }

const ITEM_ID = /^[a-z0-9-]{2,40}\/[a-z0-9-]{1,120}\/\d{1,3}$/
const s = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '')

/**
 * Place order: hands the cart and billing details to the payment Worker and
 * returns the Worker's payment page. Prices come from src/lib/cart/pricing.ts
 * here on the server; the browser's cart holds no prices.
 *
 * With payments not configured, answers with the "coming soon" page so the
 * checkout keeps working exactly as before the Worker existed.
 */
export const POST = handler(async (request) => {
  enforceRateLimit(request, 'checkout', 10)
  if (!paymentsConfigured()) return jsonOk({ ok: true, payUrl: '/checkout/payment' })

  const body = await readJson<Body>(request)
  const items = (Array.isArray(body.items) ? body.items : [])
    .map((i) => ({ id: s(i.id, 170), title: s(i.title, 400), volumeTitle: s(i.volumeTitle, 300), seriesCode: s(i.seriesCode, 20) }))
    .filter((i) => ITEM_ID.test(i.id))
    .map((i) => ({ ...i, priceUsd: chapterPrice(i.id)?.usd ?? null, priceTwd: chapterPrice(i.id)?.twd ?? null }))
  if (items.length === 0) return jsonError('Your cart is empty.', 400)
  const unpriced = items.find((i) => i.priceUsd === null || i.priceTwd === null)
  if (unpriced) return jsonError(`"${unpriced.title || unpriced.id}" is not on sale yet. Remove it from your cart to continue.`, 400)
  if (items.length > 50) return jsonError('At most 50 chapters per order.', 400)

  const b = body.buyer ?? {}
  const buyer = Object.fromEntries(
    ['email', 'phone', 'firstName', 'lastName', 'company', 'street', 'unit', 'city', 'country', 'region', 'postcode'].map((k) => [k, s(b[k], 160)]),
  )

  const r = await createPaymentOrder({ items, buyer, method: body.method === 'paypal' ? 'paypal' : 'card' })
  if (!r.ok) return jsonError(r.error, r.status)
  return jsonOk({ ok: true, orderNo: r.orderNo, payUrl: r.payUrl })
})
