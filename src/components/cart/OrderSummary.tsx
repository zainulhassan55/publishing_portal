import Link from 'next/link'
import type { ReactNode } from 'react'
import { formatTwd, formatUsdShort, type Money } from '@/lib/cart/pricing'

const row = { display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 15, color: 'var(--ink-2,#1F2A36)' } as const
const amount = { margin: 0, textAlign: 'right' } as const
const twd = { display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--muted,#505C68)' } as const

/** An amount in both currencies: US$ on top, NT$ beneath. */
function Both({ m, bold }: { m: Money; bold?: boolean }) {
  return (
    <dd style={{ ...amount, fontWeight: bold ? 700 : 400 }}>
      {formatUsdShort(m.usd)}
      <span style={twd}>{formatTwd(m.twd)}</span>
    </dd>
  )
}

/**
 * Right-hand order summary on /cart and /checkout: totals in US$ and NT$, the
 * main action, and help links. Both are fixed list prices (src/lib/cart/pricing.ts):
 * a card payment through NewebPay charges the NT$ total, PayPal the US$ total.
 */
export function OrderSummary({ subtotal, children }: { subtotal: Money; children: ReactNode }) {
  const zero = { usd: 0, twd: 0 }
  return (
    <aside aria-label="Order summary" className="co-summary" style={{ flex: '0 0 320px', position: 'sticky', top: 16, alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 10, padding: '18px 20px', border: '1px solid var(--line,#DCE1E6)', borderRadius: 4, background: 'var(--surface-3,#FAFBFB)' }}>
        <div style={row}>
          <dt style={{ fontWeight: 600 }}>Subtotal</dt>
          <Both m={subtotal} bold />
        </div>
        <div style={row}>
          <dt>Shipping <span style={{ fontSize: 13, color: 'var(--muted,#505C68)' }}>(e-book)</span></dt>
          <Both m={zero} />
        </div>
        <div style={row}>
          <dt>Taxes</dt>
          <Both m={zero} />
        </div>
        <div style={{ ...row, borderTop: '1px solid var(--line,#DCE1E6)', paddingTop: 10, fontSize: 17 }}>
          <dt style={{ fontWeight: 700 }}>Total</dt>
          <Both m={subtotal} bold />
        </div>
        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--muted,#505C68)' }}>
          Card payments (NewebPay) are charged in NT$; PayPal payments in US$.
        </p>
      </dl>
      {children}
      <div style={{ borderTop: '1px solid var(--line,#DCE1E6)', paddingTop: 14, textAlign: 'center', fontSize: 14, lineHeight: 1.7, color: 'var(--ink-3,#3C4854)' }}>
        <p style={{ margin: '0 0 6px' }}>
          Questions about an order? <Link href="/contact">Contact us</Link>
        </p>
        <p style={{ margin: 0 }}>
          <Link href="/policies/terms">Terms of use</Link> · <Link href="/policies/privacy">Privacy</Link>
        </p>
      </div>
    </aside>
  )
}
