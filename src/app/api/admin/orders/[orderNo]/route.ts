import { handler, jsonError, jsonOk } from '@/lib/api'
import { recordAudit } from '@/lib/admin/audit'
import { requireAdminApi } from '@/lib/admin/guard'
import { deletePaymentOrder, listPaymentOrders, orderAmount, paymentsConfigured } from '@/lib/pay/server'

export const dynamic = 'force-dynamic'

type Body = { confirm?: unknown; paidConfirmed?: unknown; reason?: unknown }

/**
 * Deletes a chapter order from the payment Worker's ledger.
 *
 * Two confirmations, both checked here and again in the Worker: the order
 * number typed back, and for a paid order an explicit "I understand this is a
 * paid order". The Worker keeps a tombstone with the amounts, and this route
 * writes the deletion, with the order as it was, to the admin audit log, so a
 * removed sale can always be accounted for.
 */
export const DELETE = handler(async (request) => {
  const auth = await requireAdminApi(request, { mutating: true })
  if (!auth.ok) return auth.response
  if (!paymentsConfigured() || !process.env.PAY_ADMIN_TOKEN) return jsonError('unavailable', 503, { message: 'Payments are not configured on this server.' })

  const orderNo = decodeURIComponent(new URL(request.url).pathname.split('/').filter(Boolean).pop() ?? '')
  if (!/^[\w-]{1,30}$/.test(orderNo)) return jsonError('validation', 422, { errors: [{ field: 'orderNo', message: 'Unknown order' }] })

  let body: Body = {}
  try {
    body = (await request.json()) as Body
  } catch {
    // An empty body fails the confirmation below.
  }
  if (body.confirm !== orderNo) return jsonError('validation', 422, { errors: [{ field: 'confirm', message: 'Type the order number exactly to confirm.' }] })
  const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 500) : ''

  const order = (await listPaymentOrders()).find((o) => o.orderNo === orderNo)
  if (!order) return jsonError('not-found', 404, { message: 'Order not found. It may already have been deleted.' })
  if (order.status === 'paid' && body.paidConfirmed !== true) {
    return jsonError('validation', 422, { errors: [{ field: 'paidConfirmed', message: 'This order is paid. Tick the box to confirm deleting a paid order.' }] })
  }

  const user = auth.context.user
  const r = await deletePaymentOrder(orderNo, { paidConfirmed: body.paidConfirmed === true, by: `${user.fullName || user.userName} (${user.userName})` })
  if (!r.ok) return jsonError('payment-service', r.status === 409 ? 409 : 502, { message: r.error })

  const amt = orderAmount(order)
  await recordAudit({
    actor: user,
    action: 'order.deleted',
    targetType: 'chapter_order',
    targetId: orderNo,
    before: { status: order.status, buyer: order.email, amount: `${amt.currency} ${amt.amount}`, gateway: order.gateway, tradeNo: order.tradeNo, items: order.items.map((i) => i.id).join(', ') },
    after: null,
    note: reason || null,
    request,
  })
  return jsonOk({ ok: true })
})
