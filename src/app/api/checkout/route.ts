import { enforceRateLimit, handler, jsonError, jsonOk, readJson } from '@/lib/api'
import { captchaGate } from '@/lib/captcha'
import { countryName, normalizeCheckout, validateCheckout } from '@/lib/cart/checkout-fields'
import { isBookItemId, itemPrice, volumeKeyOf } from '@/lib/cart/pricing'
import { createPaymentOrder, paymentsConfigured } from '@/lib/pay/server'
import { orderAccount, requireBuyer } from '@/lib/shop/buyer'
import { ValidationError } from '@/lib/validate'

export const dynamic = 'force-dynamic'

type Item = { id?: unknown; title?: unknown; volumeTitle?: unknown; seriesCode?: unknown }
type Body = { items?: Item[]; buyer?: Record<string, unknown>; method?: unknown; captchaToken?: unknown }

/** chapterItemId() `<series>/<volume>/<n>` or bookItemId() `<series>/<volume>/book`. */
const ITEM_ID = /^[a-z0-9-]{2,40}\/[a-z0-9-]{1,120}\/(\d{1,3}|book)$/
const s = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '')

/**
 * Place order: hands the cart and billing details to the payment Worker and
 * returns the Worker's payment page. Prices come from src/lib/cart/pricing.ts
 * here on the server; the browser's cart holds no prices.
 *
 * Buyers must be signed in (publisher, November 2026): the /checkout page sends
 * a signed-out visitor to sign-in, and this route refuses the request, which is
 * the actual enforcement. Either an OJS account or the shop's Google sign-in
 * will do (src/lib/shop/buyer.ts); the order records which one placed it.
 *
 * Billing details are checked with the same rules as the form
 * (src/lib/cart/checkout-fields.ts); any problem is a 422 with field errors,
 * which the form shows next to the fields without clearing them.
 *
 * A Cloudflare Turnstile token is required (src/lib/captcha.ts), checked last,
 * after the cart and the billing details, so a reader correcting a field does
 * not have to repeat the check. Skipped when no Turnstile secret is configured.
 *
 * With payments not configured, answers with the "coming soon" page so the
 * checkout keeps working exactly as before the Worker existed.
 */
export const POST = handler(async (request) => {
  enforceRateLimit(request, 'checkout', 10)
  const who = await requireBuyer()
  if (who instanceof Response) return who
  if (!paymentsConfigured()) return jsonOk({ ok: true, payUrl: '/checkout/payment' })

  const body = await readJson<Body>(request)
  const parsed = (Array.isArray(body.items) ? body.items : [])
    .map((i) => ({ id: s(i.id, 170), title: s(i.title, 400), volumeTitle: s(i.volumeTitle, 300), seriesCode: s(i.seriesCode, 20) }))
    .filter((i) => ITEM_ID.test(i.id))
  // A whole book already includes its chapters: never charge for both.
  const books = new Set(parsed.filter((i) => isBookItemId(i.id)).map((i) => volumeKeyOf(i.id)))
  const items = parsed
    .filter((i) => isBookItemId(i.id) || !books.has(volumeKeyOf(i.id)))
    .map((i) => ({ ...i, priceUsd: itemPrice(i.id)?.usd ?? null, priceTwd: itemPrice(i.id)?.twd ?? null }))
  if (items.length === 0) return jsonError('Your cart is empty.', 400)
  const unpriced = items.find((i) => i.priceUsd === null || i.priceTwd === null)
  if (unpriced) return jsonError(`"${unpriced.title || unpriced.id}" is not on sale yet. Remove it from your cart to continue.`, 400)
  if (items.length > 50) return jsonError('At most 50 items per order.', 400)

  const fields = normalizeCheckout(body.buyer ?? {})
  const problems = validateCheckout(fields)
  if (problems.length) throw new ValidationError(problems)
  // The Worker, emails and admin views show the country by name; keep the code beside it.
  const buyer = { ...fields, country: countryName(fields.country), countryCode: fields.country }

  const blocked = await captchaGate(request, body.captchaToken, 'checkout')
  if (blocked) return blocked

  const r = await createPaymentOrder({
    items,
    buyer,
    method: body.method === 'paypal' ? 'paypal' : 'card',
    account: orderAccount(who),
  })
  if (!r.ok) return jsonError(r.error, r.status)
  return jsonOk({ ok: true, orderNo: r.orderNo, payUrl: r.payUrl })
})
