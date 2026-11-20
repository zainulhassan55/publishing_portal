'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { CSRF_HEADER } from '@/lib/auth/csrf'

/** "Print receipt": prints only the receipt block on the page (see the print styles there). */
export function PrintReceiptButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      style={{ font: 'inherit', fontSize: 14.5, fontWeight: 600, padding: '9px 16px', border: '1px solid var(--accent,#0C8375)', color: 'var(--accent-dark,#0A685C)', background: 'var(--surface,#fff)', borderRadius: 3, cursor: 'pointer' }}
    >
      Print / save receipt as PDF
    </button>
  )
}

/**
 * Deleting an order, with two confirmations: the order number typed back,
 * and for a paid order an explicit tick. The server checks both again, keeps
 * a record of the order's amounts, and logs the deletion under Activity.
 */
export function DeleteOrder({ orderNo, paid, csrfToken }: { orderNo: string; paid: boolean; csrfToken: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const [paidOk, setPaidOk] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const ready = typed.trim() === orderNo && (!paid || paidOk) && !busy

  const remove = async () => {
    if (!ready) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderNo)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', [CSRF_HEADER]: csrfToken },
        body: JSON.stringify({ confirm: typed.trim(), paidConfirmed: paid ? paidOk : false, reason }),
      })
      const data = (await res.json().catch(() => ({}))) as { message?: string; errors?: { message: string }[] }
      if (!res.ok) throw new Error(data.errors?.[0]?.message || data.message || `Delete failed (${res.status}).`)
      router.push(`/admin/orders?deleted=${encodeURIComponent(orderNo)}`)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed.')
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} style={{ font: 'inherit', fontSize: 14, padding: '8px 14px', border: '1px solid #B42318', color: '#B42318', background: 'var(--surface,#fff)', borderRadius: 3, cursor: 'pointer' }}>
        Delete this order…
      </button>
    )
  }

  return (
    <div style={{ border: '1px solid #F3B1B1', background: '#FDF4F4', borderRadius: 4, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 560 }}>
      <strong style={{ color: '#7F1D1D' }}>Delete order {orderNo}?</strong>
      <span style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--ink-2,#1F2A36)' }}>
        This removes the order from the list. It cannot be undone. {paid ? 'The money is not refunded by deleting: refund it in the NewebPay or PayPal back office first if needed.' : ''}
      </span>
      {paid ? (
        <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 14, color: '#7F1D1D', fontWeight: 600 }}>
          <input type="checkbox" checked={paidOk} onChange={(e) => setPaidOk(e.target.checked)} style={{ marginTop: 3 }} />
          I understand this is a PAID order and its record will be removed from the dashboard.
        </label>
      ) : null}
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 600 }}>
        Reason (kept in the activity log)
        <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} placeholder="e.g. test order" style={{ font: 'inherit', fontSize: 14, padding: '8px 10px', border: '1px solid var(--line-strong,#B9C1C9)', borderRadius: 3 }} />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 600 }}>
        Type the order number <code>{orderNo}</code> to confirm
        <input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" spellCheck={false} style={{ font: 'inherit', fontSize: 14, padding: '8px 10px', border: '1px solid var(--line-strong,#B9C1C9)', borderRadius: 3 }} />
      </label>
      {error ? <span role="alert" style={{ color: '#7F1D1D', fontSize: 13.5 }}>{error}</span> : null}
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" onClick={remove} disabled={!ready} style={{ font: 'inherit', fontSize: 14, fontWeight: 600, padding: '9px 16px', border: 0, borderRadius: 3, background: '#B42318', color: '#fff', cursor: ready ? 'pointer' : 'not-allowed', opacity: ready ? 1 : 0.45 }}>
          {busy ? 'Deleting…' : 'Delete permanently'}
        </button>
        <button type="button" onClick={() => { setOpen(false); setTyped(''); setPaidOk(false); setError('') }} style={{ font: 'inherit', fontSize: 14, padding: '9px 16px', border: '1px solid var(--line-strong,#B9C1C9)', borderRadius: 3, background: 'var(--surface,#fff)', cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}
