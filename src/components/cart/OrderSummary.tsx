import Link from 'next/link'
import type { ReactNode } from 'react'
import { formatUsdShort } from '@/lib/cart/pricing'

const row = { display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 15, color: 'var(--ink-2,#1F2A36)' } as const

/** Right-hand order summary on /cart and /checkout: totals, the main action, and help links. */
export function OrderSummary({ subtotal, children }: { subtotal: number; children: ReactNode }) {
  return (
    <aside aria-label="Order summary" className="co-summary" style={{ flex: '0 0 320px', position: 'sticky', top: 16, alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 10, padding: '18px 20px', border: '1px solid var(--line,#DCE1E6)', borderRadius: 4, background: 'var(--surface-3,#FAFBFB)' }}>
        <div style={row}>
          <dt style={{ fontWeight: 600 }}>Subtotal</dt>
          <dd style={{ margin: 0, fontWeight: 600 }}>{formatUsdShort(subtotal)}</dd>
        </div>
        <div style={row}>
          <dt>Shipping <span style={{ fontSize: 13, color: 'var(--muted,#505C68)' }}>(e-book)</span></dt>
          <dd style={{ margin: 0 }}>{formatUsdShort(0)}</dd>
        </div>
        <div style={row}>
          <dt>Taxes</dt>
          <dd style={{ margin: 0 }}>{formatUsdShort(0)}</dd>
        </div>
        <div style={{ ...row, borderTop: '1px solid var(--line,#DCE1E6)', paddingTop: 10, fontSize: 17 }}>
          <dt style={{ fontWeight: 700 }}>Total</dt>
          <dd style={{ margin: 0, fontWeight: 700 }}>{formatUsdShort(subtotal)}</dd>
        </div>
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
