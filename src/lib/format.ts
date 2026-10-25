/**
 * Display formatting. Dates are stored as ISO 8601 everywhere and formatted
 * only at render time, so sorting and comparison never depend on a localised
 * string. `en-GB` is fixed deliberately: the formatted output appears in
 * statically generated HTML, so it must not vary with the server's locale.
 */

const longDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
const shortDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const monthYear = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' })

const parse = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00Z`)

export const formatDate = (iso: string | undefined | null) => (iso ? longDate.format(parse(iso)) : '')
export const formatDateShort = (iso: string | undefined | null) => (iso ? shortDate.format(parse(iso)) : '')
export const formatMonthYear = (iso: string | undefined | null) => (iso ? monthYear.format(parse(iso)) : '')

const numberFormat = new Intl.NumberFormat('en-GB')
export const formatNumber = (n: number) => numberFormat.format(n)

/**
 * Whole days from `fromIso` (default: today) until `iso`. Negative once past.
 * Both sides are normalised to UTC midnight so the result never flips with the
 * time of day.
 */
export function daysUntil(iso: string, fromIso?: string): number {
  const target = parse(iso).getTime()
  const from = fromIso ? parse(fromIso).getTime() : Date.parse(new Date().toISOString().slice(0, 10))
  return Math.round((target - from) / 86_400_000)
}

export type DeadlineState = 'open' | 'closing-soon' | 'closed'

/** Closing soon is the final 30 days, matching the urgency badge in the UI. */
export function deadlineState(iso: string, fromIso?: string): DeadlineState {
  const days = daysUntil(iso, fromIso)
  if (days < 0) return 'closed'
  if (days <= 30) return 'closing-soon'
  return 'open'
}

export const deadlineLabel = (iso: string, fromIso?: string): string => {
  const days = daysUntil(iso, fromIso)
  if (days < 0) return 'Closed'
  if (days === 0) return 'Closes today'
  if (days === 1) return '1 day left'
  return `${days} days left`
}

/**
 * Author list for cards and search results. Beyond four names the list is
 * truncated, because a six-author line wraps to three rows and buries the
 * journal name beneath it.
 */
export function authorsShort(names: string[], max = 4): string {
  if (names.length === 0) return ''
  if (names.length <= max) return names.join(', ')
  return `${names.slice(0, max - 1).join(', ')} + ${names.length - (max - 1)} more`
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

export const wordCount = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0)

export const pluralise = (n: number, singular: string, plural = `${singular}s`) =>
  `${formatNumber(n)} ${n === 1 ? singular : plural}`

/** Formats bytes for the upload list in the submission wizard. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const volumeIssueLabel = (volume: number, issue: number) => `Volume ${volume}, Issue ${issue}`

/** "Okafor et al." — for the citation line and the related-articles rail. */
export function citationAuthor(names: string[]): string {
  if (names.length === 0) return ''
  const family = names[0].split(/\s+/).pop() ?? names[0]
  return names.length === 1 ? family : `${family} et al.`
}

/** Trims to a whole word so a meta description never ends mid-term. */
export function clampText(text: string, max = 155): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:]$/, '')}…`
}
