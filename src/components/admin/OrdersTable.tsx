'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { isBookItemId } from '@/lib/cart/pricing'
import { amountText, taipei } from '@/lib/pay/display'
import type { OrderSummary } from '@/lib/pay/server'

const cell = { padding: '9px 10px', borderBottom: '1px solid var(--line,#DCE1E6)', verticalAlign: 'top', fontSize: 13.5 } as const
const muted = { color: 'var(--muted,#505C68)', fontSize: 12.5 } as const
const control = { font: 'inherit', fontSize: 14, padding: '8px 10px', border: '1px solid var(--line-strong,#B9C1C9)', borderRadius: 3, background: 'var(--surface,#fff)' } as const

/** A comparable amount for sorting: NT$, converting US$ at the list prices' ≈ 33. */
const sortAmount = (o: OrderSummary) => o.paidTwd ?? (o.paidUsd ? o.paidUsd * 33 : (o.totalTwd ?? o.totalUsd * 33))

type SortKey = 'created' | 'paid' | 'buyer' | 'amount' | 'status'
const STATUS_GROUPS = [
  ['all', 'All'],
  ['paid', 'Paid'],
  ['created', 'Not paid yet'],
  ['failed', 'Failed'],
  ['other', 'Other'],
] as const

const STATUS_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  paid: { bg: '#E8F6EE', fg: '#14532D', label: 'Paid' },
  created: { bg: '#EEF1F6', fg: '#44506A', label: 'Not paid yet' },
  failed: { bg: '#FDECEC', fg: '#7F1D1D', label: 'Failed' },
  'pending-payment': { bg: '#FFF8E6', fg: '#7A5A12', label: 'Awaiting ATM/store payment' },
  'amount-mismatch': { bg: '#FDECEC', fg: '#7F1D1D', label: 'Amount mismatch' },
}

export function StatusChip({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? { bg: '#EEF1F6', fg: '#44506A', label: status }
  return <span style={{ background: s.bg, color: s.fg, padding: '2px 9px', borderRadius: 12, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{s.label}</span>
}

const csvCell = (v: unknown) => {
  const t = v == null ? '' : String(v)
  return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
}

/**
 * The order list: search, a status filter, sortable columns, and a CSV of
 * exactly what is shown. Each order number opens its page (billing, payment,
 * receipt, delete).
 */
export function OrdersTable({ orders }: { orders: OrderSummary[] }) {
  const [q, setQ] = useState('')
  const [group, setGroup] = useState<(typeof STATUS_GROUPS)[number][0]>('all')
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: 'created', desc: true })

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const rows = orders.filter((o) => {
      if (group !== 'all' && (group === 'other' ? ['paid', 'created', 'failed'].includes(o.status) : o.status !== group)) return false
      if (!needle) return true
      return [o.orderNo, o.name, o.email, o.account, o.tradeNo, o.country, o.company, ...o.items.map((i) => i.title)].some((v) => String(v ?? '').toLowerCase().includes(needle))
    })
    const value = (o: OrderSummary): string | number => {
      switch (sort.key) {
        case 'created':
          return o.createdAt || ''
        case 'paid':
          return o.payTime || ''
        case 'buyer':
          return o.name.toLowerCase()
        case 'amount':
          return sortAmount(o)
        case 'status':
          return o.status
      }
    }
    return [...rows].sort((a, b) => {
      const x = value(a)
      const y = value(b)
      const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))
      return sort.desc ? -c : c
    })
  }, [orders, q, group, sort])

  const header = (key: SortKey, label: string) => {
    const active = sort.key === key
    return (
      <th aria-sort={active ? (sort.desc ? 'descending' : 'ascending') : 'none'} style={{ ...cell, textAlign: 'left', ...muted, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
        <button
          type="button"
          onClick={() => setSort({ key, desc: active ? !sort.desc : key !== 'buyer' && key !== 'status' })}
          style={{ border: 0, background: 'none', padding: 0, font: 'inherit', color: active ? 'var(--ink,#101B27)' : 'inherit', fontWeight: active ? 700 : 600, cursor: 'pointer', textTransform: 'uppercase' }}
        >
          {label} {active ? (sort.desc ? '▼' : '▲') : '↕'}
        </button>
      </th>
    )
  }

  const downloadCsv = () => {
    const cols = ['orderNo', 'status', 'createdAt', 'payTime', 'gateway', 'paymentType', 'amount', 'tradeNo', 'name', 'email', 'account', 'company', 'phone', 'street', 'unit', 'city', 'region', 'postcode', 'country', 'items']
    const lines = [cols.join(',')].concat(
      shown.map((o) =>
        [
          o.orderNo, o.status, taipei(o.createdAt), taipei(o.payTime), o.gateway, o.paymentType, amountText(o), o.tradeNo, o.name, o.email, o.account,
          o.billing?.company ?? o.company, o.billing?.phone, o.billing?.street, o.billing?.unit, o.billing?.city, o.billing?.region, o.billing?.postcode, o.billing?.country ?? o.country,
          o.items.map((i) => `${i.seriesCode} ${isBookItemId(i.id) ? 'Full e-book' : 'Ch. ' + i.id.split('/').pop()}: ${i.title}`).join(' | '),
        ].map(csvCell).join(','),
      ),
    )
    const url = URL.createObjectURL(new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `chapter-orders-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', margin: '14px 0' }}>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order, buyer, email, chapter…" aria-label="Search orders" style={{ ...control, flex: '1 1 260px', minWidth: 0 }} />
        <select value={group} onChange={(e) => setGroup(e.target.value as typeof group)} aria-label="Filter by status" style={control}>
          {STATUS_GROUPS.map(([v, label]) => (
            <option key={v} value={v}>
              {label} ({v === 'all' ? orders.length : orders.filter((o) => (v === 'other' ? !['paid', 'created', 'failed'].includes(o.status) : o.status === v)).length})
            </option>
          ))}
        </select>
        <button type="button" onClick={downloadCsv} disabled={!shown.length} style={{ ...control, cursor: 'pointer', fontWeight: 600 }}>
          Download CSV ({shown.length})
        </button>
      </div>
      {shown.length ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {header('created', 'Order')}
                {header('buyer', 'Buyer')}
                <th style={{ ...cell, textAlign: 'left', ...muted, textTransform: 'uppercase' }}>Items</th>
                {header('amount', 'Amount')}
                {header('status', 'Status')}
                {header('paid', 'Paid at')}
              </tr>
            </thead>
            <tbody>
              {shown.map((o) => (
                <tr key={o.orderNo}>
                  <td style={cell}>
                    <Link href={`/admin/orders/${encodeURIComponent(o.orderNo)}`} style={{ fontWeight: 700 }}>
                      {o.orderNo}
                    </Link>
                    <br />
                    <span style={muted}>{taipei(o.createdAt)}</span>
                  </td>
                  <td style={cell}>
                    {o.name}
                    <br />
                    <span style={muted}>
                      {o.email}
                      {o.account ? ` · ${o.account}` : ''}
                    </span>
                  </td>
                  <td style={cell}>
                    {o.items.map((i) => (
                      <div key={i.id}>
                        {i.seriesCode} · {isBookItemId(i.id) ? <strong>Full e-book: </strong> : `Ch. ${i.id.split('/').pop()}: `}
                        {i.title || i.id}
                      </div>
                    ))}
                  </td>
                  <td style={{ ...cell, whiteSpace: 'nowrap' }}>
                    {o.status === 'paid' ? <strong>{amountText(o)}</strong> : amountText(o)}
                    {o.gateway ? <><br /><span style={muted}>{o.gateway === 'newebpay' ? 'NewebPay' : 'PayPal'}</span></> : null}
                  </td>
                  <td style={cell}>
                    <StatusChip status={o.status} />
                    {o.failReason ? <><br /><span style={{ ...muted, color: '#7f1d1d' }}>{o.failReason}</span></> : null}
                    {o.status === 'paid' && !o.emailSent ? <><br /><span style={{ ...muted, color: '#7a5a12' }}>email not sent</span></> : null}
                  </td>
                  <td style={{ ...cell, whiteSpace: 'nowrap' }}>{taipei(o.payTime) || <span style={muted}>—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p style={muted}>{orders.length ? 'No orders match.' : 'No orders yet.'}</p>
      )}
    </div>
  )
}
