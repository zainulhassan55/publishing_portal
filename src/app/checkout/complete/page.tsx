import type { Metadata } from 'next'
import Link from 'next/link'
import { ClearCartOnPaid } from '@/components/cart/ClearCartOnPaid'
import { ShopShell } from '@/components/cart/ShopShell'
import { formatTwd, formatUsd, isBookItemId } from '@/lib/cart/pricing'
import { getPaymentStatus, type PaidState } from '@/lib/pay/server'

export const metadata: Metadata = { title: 'Order status', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

const COPY: Record<PaidState | 'unknown', { title: string; tone: string; text: string }> = {
  success: { title: 'Thank you — your payment has been received.', tone: '#14532d', text: 'A confirmation has been emailed to you. Your chapter downloads will be sent to the same address.' },
  pending: { title: 'Payment code issued — not yet paid.', tone: '#7a5a12', text: 'Please complete the payment before the deadline shown on the payment page. Your order is confirmed by email once it clears.' },
  open: { title: 'We have not received your payment yet.', tone: '#44506a', text: 'If you left the payment page, nothing was charged. Your cart is still saved.' },
  fail: { title: 'The payment was not completed.', tone: '#7f1d1d', text: 'No charge was made. You can try again from your cart.' },
  unknown: { title: 'We could not load this order.', tone: '#44506a', text: 'If you have just paid, please check your email for the confirmation, or contact us.' },
}

/**
 * Where the payment Worker sends the reader after PayPal or NewebPay: the order
 * number and its signed token come in the query string, and the status is read
 * from the Worker server-side, so the page never trusts the `s` hint alone.
 */
/** "Full e-book", "2 chapters", "Full e-book + 1 chapter": what an order contains. */
function itemsLine(ids: string[]): string {
  const books = ids.filter(isBookItemId).length
  const chapters = ids.length - books
  const parts = [
    books ? (books === 1 ? 'Full e-book' : `${books} full e-books`) : '',
    chapters ? `${chapters} chapter${chapters === 1 ? '' : 's'}` : '',
  ].filter(Boolean)
  return parts.join(' + ')
}

export default async function CheckoutCompletePage({ searchParams }: { searchParams: Promise<{ o?: string; t?: string }> }) {
  const { o = '', t = '' } = await searchParams
  const status = await getPaymentStatus(o, t)
  const c = COPY[status?.state ?? 'unknown']

  return (
    <ShopShell crumb="Order status" title="Order status">
      {status?.state === 'success' ? <ClearCartOnPaid itemIds={status.itemIds} /> : null}
      <div style={{ maxWidth: '62ch', padding: '24px 0', borderTop: '1px solid var(--line,#DCE1E6)', fontSize: 16, lineHeight: 1.65, color: 'var(--ink-2,#1F2A36)' }}>
        <p style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 600, color: c.tone }}>{c.title}</p>
        <p style={{ margin: '0 0 16px' }}>{c.text}</p>
        {status ? (
          <p style={{ margin: '0 0 22px', fontSize: 15 }}>
            Order <strong>{status.orderNo}</strong> · {itemsLine(status.itemIds)} · <strong>{status.gateway === 'newebpay' && status.totalTwd ? formatTwd(status.totalTwd) : formatUsd(status.totalUsd)}</strong>
            {status.email ? <> · {status.email}</> : null}
          </p>
        ) : null}
        <Link href={status?.state === 'success' ? '/series' : '/cart'} style={{ display: 'inline-block', border: '1px solid var(--accent,#0C8375)', color: 'var(--accent-dark,#0A685C)', padding: '10px 18px', borderRadius: 3, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
          {status?.state === 'success' ? 'Browse more books' : 'Back to cart'}
        </Link>
        <p style={{ marginTop: 18, fontSize: 14 }}>
          Questions about an order? <Link href="/contact">Contact us</Link>
        </p>
      </div>
    </ShopShell>
  )
}
