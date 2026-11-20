import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DeleteOrder, PrintReceiptButton } from '@/components/admin/OrderActions'
import { StatusChip } from '@/components/admin/OrdersTable'
import { requireAdminPage } from '@/lib/admin/guard'
import { formatTwd, formatUsd, isBookItemId } from '@/lib/cart/pricing'
import { amountText, taipei } from '@/lib/pay/display'
import { listPaymentOrders, orderAmount, paymentsConfigured } from '@/lib/pay/server'
import { siteName } from '@/lib/site'

export const dynamic = 'force-dynamic'

const box = { border: '1px solid var(--line,#DCE1E6)', borderRadius: 4, padding: '16px 20px', background: 'var(--surface,#fff)' } as const
const h2 = { margin: '0 0 12px', fontSize: 17, fontWeight: 700, color: 'var(--ink,#101B27)' } as const
const dl = { margin: 0, display: 'grid', gridTemplateColumns: 'max-content minmax(0,1fr)', gap: '7px 18px', fontSize: 14.5 } as const
const dt = { fontWeight: 600, color: 'var(--ink-3,#3C4854)' } as const
const dd = { margin: 0, color: 'var(--ink,#101B27)', overflowWrap: 'anywhere' } as const
const rcCell = { padding: '7px 8px', borderBottom: '1px solid #DCE1E6', fontSize: 14, verticalAlign: 'top' } as const

function Facts({ rows }: { rows: [string, React.ReactNode][] }) {
  const shown = rows.filter(([, v]) => v !== null && v !== undefined && v !== '')
  return (
    <dl style={dl}>
      {shown.map(([k, v]) => (
        <div key={k} style={{ display: 'contents' }}>
          <dt style={dt}>{k}</dt>
          <dd style={dd}>{v}</dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * One chapter order: who bought what, the billing address, the payment, a
 * printable receipt, and deletion. Read from the payment Worker's ledger.
 *
 * The receipt is a payment receipt, not a Taiwan uniform invoice (統一發票):
 * e-invoices need the ezPay integration, which is not built yet.
 */
export default async function AdminOrderPage({ params }: { params: Promise<{ orderNo: string }> }) {
  const { csrfToken } = await requireAdminPage()
  const { orderNo } = await params
  if (!paymentsConfigured() || !process.env.PAY_ADMIN_TOKEN) notFound()
  const o = (await listPaymentOrders()).find((x) => x.orderNo === decodeURIComponent(orderNo))
  if (!o) notFound()

  const b = o.billing
  const amt = orderAmount(o)
  const paid = o.status === 'paid'
  const twd = amt.currency === 'TWD'
  const price = (i: (typeof o.items)[number]) => (twd ? (i.priceTwd != null ? formatTwd(i.priceTwd) : '') : i.priceUsd != null ? formatUsd(i.priceUsd) : '')
  const address = b ? [b.street, b.unit, [b.city, b.region, b.postcode].filter(Boolean).join(', '), b.country].filter(Boolean) : [o.country]

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Printing shows only the receipt, without the admin panel around it. */}
      <style>{`@media print{body *{visibility:hidden!important}.order-receipt,.order-receipt *{visibility:visible!important}.order-receipt{position:absolute;left:0;top:0;width:100%;border:0!important;padding:0!important}.no-print{display:none!important}}`}</style>
      <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 12 }}>
        <Link href="/admin/orders">← All orders</Link>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, margin: 0 }}>Order {o.orderNo}</h1>
        <StatusChip status={o.status} />
      </div>

      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
        <div style={box}>
          <h2 style={h2}>Buyer and billing</h2>
          <Facts
            rows={[
              ['Name', o.name],
              ['Email', o.email],
              ['Account', o.account ? `${o.account}${o.accountEmail && o.accountEmail !== o.email ? ` (${o.accountEmail})` : ''}` : 'Not signed in (older order)'],
              ['Phone', b?.phone],
              ['Organisation', b?.company ?? o.company],
              ['Address', address.length ? address.map((l) => <div key={l}>{l}</div>) : null],
            ]}
          />
        </div>
        <div style={box}>
          <h2 style={h2}>Payment</h2>
          <Facts
            rows={[
              ['Status', <StatusChip key="s" status={o.status} />],
              ['Amount', <strong key="a">{amountText(o)}</strong>],
              ['Order total', `${formatUsd(o.totalUsd)}${o.totalTwd ? ` · ${formatTwd(o.totalTwd)}` : ''}`],
              ['Paid through', o.gateway ? `${o.gateway === 'newebpay' ? 'NewebPay' : 'PayPal'}${o.paymentType ? ` (${o.paymentType})` : ''}` : null],
              ['Transaction no.', o.tradeNo],
              ['PayPal payer', o.payerEmail],
              ['Created', `${taipei(o.createdAt)} (Taipei)`],
              ['Paid at', o.payTime ? `${taipei(o.payTime)} (Taipei)` : null],
              ['Refused because', o.failReason],
              ['Problem', o.anomaly],
              ['Confirmation email', paid ? (o.emailSent ? `Sent ${taipei(o.emailSent)}` : `Not sent${o.emailError ? `: ${o.emailError}` : ''}`) : null],
            ]}
          />
        </div>
      </div>

      <div className="order-receipt" style={{ ...box, maxWidth: 760 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700 }}>{paid ? 'Payment receipt' : 'Order summary'}</div>
            <div style={{ fontSize: 13.5, color: '#505C68' }}>{siteName} · contact@nextgeniqpress.com · www.nextgeniqpress.com</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 13.5 }}>
            <div>
              Order <strong>{o.orderNo}</strong>
            </div>
            <div>{paid && o.payTime ? `Paid ${taipei(o.payTime)} (Taipei)` : `Created ${taipei(o.createdAt)} (Taipei)`}</div>
          </div>
        </div>
        <div style={{ margin: '16px 0', fontSize: 14, lineHeight: 1.5 }}>
          <div style={{ fontWeight: 700 }}>Billed to</div>
          <div>{o.name}</div>
          {b?.company ? <div>{b.company}</div> : null}
          {address.map((l) => (
            <div key={l}>{l}</div>
          ))}
          <div>{o.email}</div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...rcCell, textAlign: 'left' }}>Item</th>
              <th style={{ ...rcCell, textAlign: 'right' }}>Price ({twd ? 'NT$' : 'US$'})</th>
            </tr>
          </thead>
          <tbody>
            {o.items.map((i) => (
              <tr key={i.id}>
                <td style={rcCell}>
                  <strong>{isBookItemId(i.id) ? 'Full e-book (PDF)' : `Chapter ${i.id.split('/').pop()} (PDF)`}</strong> · {i.title}
                  {i.volumeTitle && i.volumeTitle !== i.title ? <div style={{ fontSize: 12.5, color: '#505C68' }}>{i.volumeTitle} ({i.seriesCode})</div> : <span style={{ color: '#505C68' }}> ({i.seriesCode})</span>}
                </td>
                <td style={{ ...rcCell, textAlign: 'right', whiteSpace: 'nowrap' }}>{price(i)}</td>
              </tr>
            ))}
            <tr>
              <td style={{ ...rcCell, fontWeight: 700, borderBottom: 0 }}>Total {paid ? 'paid' : 'due'}</td>
              <td style={{ ...rcCell, fontWeight: 700, textAlign: 'right', borderBottom: 0, whiteSpace: 'nowrap' }}>{twd ? formatTwd(amt.amount) : formatUsd(amt.amount)}</td>
            </tr>
          </tbody>
        </table>
        <div style={{ marginTop: 14, fontSize: 12.5, color: '#505C68', lineHeight: 1.5 }}>
          {paid ? `Paid through ${o.gateway === 'newebpay' ? 'NewebPay' : 'PayPal'}${o.tradeNo ? `, transaction ${o.tradeNo}` : ''}. ` : 'Not paid. '}
          This is a payment receipt, not a Taiwan uniform invoice (統一發票).
        </div>
      </div>

      <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-start' }}>
        <PrintReceiptButton />
        <DeleteOrder orderNo={o.orderNo} paid={paid} csrfToken={csrfToken} />
      </div>
    </section>
  )
}
