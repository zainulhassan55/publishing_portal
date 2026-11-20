/**
 * Display helpers for chapter orders, shared by the admin list (a client
 * component) and the order page (a server component). Kept out of both so the
 * server page never has to call into a 'use client' module.
 */
import { formatTwd, formatUsd } from '../cart/pricing.ts'
import type { OrderSummary } from './server.ts'

/** Taipei time, "2026-11-20 12:30". */
export const taipei = (iso: string | null | undefined) => (iso ? new Date(new Date(iso).getTime() + 8 * 3600e3).toISOString().replace('T', ' ').slice(0, 16) : '')

/** The amount actually paid, or the order total if unpaid, as text. */
export function amountText(o: Pick<OrderSummary, 'paidTwd' | 'paidUsd' | 'totalUsd' | 'totalTwd'>): string {
  if (o.paidTwd) return formatTwd(o.paidTwd)
  if (o.paidUsd) return formatUsd(o.paidUsd)
  return formatUsd(o.totalUsd) + (o.totalTwd ? ` · ${formatTwd(o.totalTwd)}` : '')
}
