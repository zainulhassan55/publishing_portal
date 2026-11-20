import { requireAdminPage } from '@/lib/admin/guard'
import { formatTwd, formatUsd, isBookItemId } from '@/lib/cart/pricing'
import { listPaymentOrders, paymentsConfigured, type OrderSummary } from '@/lib/pay/server'

export const dynamic = 'force-dynamic'

const cell = { padding: '9px 10px', borderBottom: '1px solid var(--line,#DCE1E6)', verticalAlign: 'top', fontSize: 13.5 } as const
const muted = { color: 'var(--muted,#505C68)', fontSize: 12.5 } as const
const taipei = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() + 8 * 3600e3).toISOString().replace('T', ' ').slice(0, 16) : '')

/**
 * Chapter orders, read from the payment Worker (workers/chapter-pay).
 *
 * The Worker's KV ledger is the record of payments; this page is a window onto
 * it inside the panel the editors already use. The Worker also has its own
 * standalone /admin (and CSV) for when the portal itself is down.
 */
export default async function AdminOrdersPage() {
  await requireAdminPage()

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
      {error ? (
        <p role="alert" style={{ color: '#7f1d1d' }}>{error}</p>
      ) : (
        <p style={muted}>
          {orders.length} orders · {paid.length} paid · {formatUsd(receivedUsd)} via PayPal + {formatTwd(receivedTwd)} via NewebPay received · times are Taipei (UTC+8)
        </p>
      )}
      {orders.length ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Order', 'Buyer', 'Chapters', 'Amount', 'Status', 'Email'].map((h) => <th key={h} style={{ ...cell, textAlign: 'left', ...muted, textTransform: 'uppercase' }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.orderNo}>
                  <td style={cell}><strong>{o.orderNo}</strong><br /><span style={muted}>{taipei(o.createdAt)}</span></td>
                  <td style={cell}>{o.name}<br /><span style={muted}>{o.email}{o.account ? ` · account ${o.account}` : ''}{o.country ? ` · ${o.country}` : ''}</span></td>
                  <td style={cell}>{o.items.map((i) => <div key={i.id}>{i.seriesCode} · {isBookItemId(i.id) ? <strong>Full e-book: </strong> : null}{i.title || i.id}</div>)}</td>
                  <td style={cell}>
                    {o.paidTwd ? <strong>{formatTwd(o.paidTwd)}</strong> : o.paidUsd ? <strong>{formatUsd(o.paidUsd)}</strong> : formatUsd(o.totalUsd)}
                    {!o.paidTwd && !o.paidUsd && o.totalTwd ? <><br /><span style={muted}>{formatTwd(o.totalTwd)}</span></> : null}
                  </td>
                  <td style={cell}>
                    {o.status}
                    {o.payTime ? <><br /><span style={muted}>{taipei(o.payTime)} · {o.gateway}</span></> : null}
                    {o.anomaly ? <><br /><span style={{ ...muted, color: '#7f1d1d' }}>{o.anomaly}</span></> : null}
                    {o.failReason ? <><br /><span style={{ ...muted, color: '#7f1d1d' }}>{o.failReason}</span></> : null}
                  </td>
                  <td style={cell}>{o.emailSent ? 'sent' : o.status === 'paid' ? <span style={{ color: '#7a5a12' }}>pending</span> : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}
