import { OrdersTable } from '@/components/admin/OrdersTable'
import { requireAdminPage } from '@/lib/admin/guard'
import { formatTwd, formatUsd } from '@/lib/cart/pricing'
import { listPaymentOrders, paymentsConfigured, type OrderSummary } from '@/lib/pay/server'

export const dynamic = 'force-dynamic'

const muted = { color: 'var(--muted,#505C68)', fontSize: 13 } as const

/**
 * Chapter orders, read from the payment Worker (workers/chapter-pay).
 *
 * The Worker's KV ledger is the record of payments; this page is a window onto
 * it inside the panel the editors already use: a searchable, sortable list
 * (OrdersTable), and a page per order with billing, payment, a printable
 * receipt and deletion. The Worker also has its own standalone /admin (and
 * CSV) for when the portal itself is down.
 */
export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  await requireAdminPage()
  const { deleted } = await searchParams

  let orders: OrderSummary[] = []
  let error = ''
  if (!paymentsConfigured() || !process.env.PAY_ADMIN_TOKEN) error = 'Payments are not configured: set PAY_API_URL, PAY_PORTAL_SECRET and PAY_ADMIN_TOKEN on the server.'
  else {
    try {
      orders = await listPaymentOrders()
    } catch (e) {
      error = `Could not read orders from the payment service (${e instanceof Error ? e.message : 'unknown error'}).`
    }
  }
  const paid = orders.filter((o) => o.status === 'paid')
  const receivedUsd = paid.reduce((sum, o) => sum + Number(o.paidUsd ?? 0), 0)
  const receivedTwd = paid.reduce((sum, o) => sum + Number(o.paidTwd ?? 0), 0)

  return (
    <section>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, margin: '8px 0 6px' }}>Chapter orders</h1>
      {deleted && /^[\w-]{1,30}$/.test(deleted) ? (
        <p role="status" style={{ background: '#E8F6EE', color: '#14532D', padding: '10px 14px', borderRadius: 4, fontSize: 14 }}>
          Order <strong>{deleted}</strong> was deleted. The deletion is recorded under Admin → Activity.
        </p>
      ) : null}
      {error ? (
        <p role="alert" style={{ color: '#7f1d1d' }}>{error}</p>
      ) : (
        <>
          <p style={muted}>
            {orders.length} orders · {paid.length} paid · received {formatTwd(receivedTwd)} via NewebPay and {formatUsd(receivedUsd)} via PayPal · times are Taipei (UTC+8)
          </p>
          <OrdersTable orders={orders} />
        </>
      )}
    </section>
  )
}
