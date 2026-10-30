import { getJournal, getSeries } from '@/data/registry'
import { query } from '../db'
import type { UploadRow } from '../uploads/service'
import { reference } from './server'

/**
 * The admin view of everything submitted through the editorial forms. Each
 * kind lives in its own table; this flattens them into one list shape.
 */

export type FormKind = 'application' | 'special_issue' | 'book_volume' | 'book_submission'

export const FORM_TABLES: Record<FormKind, { table: string; ownerType: string; prefix: string; label: string }> = {
  application: { table: 'editorial_applications', ownerType: 'editorial_application', prefix: 'ED', label: 'Reviewer and board applications' },
  special_issue: { table: 'editorial_proposals', ownerType: 'editorial_proposal', prefix: 'SI', label: 'Special issue proposals' },
  book_volume: { table: 'editorial_proposals', ownerType: 'editorial_proposal', prefix: 'BP', label: 'Book volume proposals' },
  book_submission: { table: 'book_submissions', ownerType: 'book_submission', prefix: 'BC', label: 'Book chapter submissions' },
}

export const isFormKind = (value: unknown): value is FormKind =>
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(FORM_TABLES, value)

export type FormFile = { id: string; purpose: string; name: string; size: number }

export type FormRecord = {
  kind: FormKind
  id: number
  reference: string
  title: string
  target: string
  /** The journal or series name, for the decision letter. */
  targetTitle: string
  /** Applications only: reviewer or board. */
  role?: string
  submitter: string
  email: string
  status: string
  decisionNote: string | null
  /** When the decision letter was emailed, if it has been. */
  emailedAt: string | null
  createdAt: string
  payload: Record<string, unknown>
  files: FormFile[]
}

type Row = {
  id: number
  kind?: string
  role?: string
  target_slug?: string
  series_slug?: string
  title?: string
  name?: string
  email?: string
  submitter_name?: string
  submitter_email?: string
  corresponding_name?: string
  corresponding_email?: string
  status: string
  decision_note: string | null
  decision_emailed_at?: Date | null
  created_at: Date
  payload: Record<string, unknown> | string
}

const toRecord = (kind: FormKind, r: Row, files: FormFile[]): FormRecord => {
  const target = r.target_slug ?? r.series_slug ?? ''
  const payload = typeof r.payload === 'string' ? (JSON.parse(r.payload) as Record<string, unknown>) : r.payload
  return {
    kind,
    id: r.id,
    reference: reference(FORM_TABLES[kind].prefix, r.id),
    title: r.title ?? (r.role === 'board' ? 'Editorial board application' : 'Reviewer application'),
    target,
    targetTitle: getJournal(target)?.title ?? getSeries(target)?.title ?? target.toUpperCase(),
    role: r.role,
    submitter: r.name ?? r.submitter_name ?? r.corresponding_name ?? '',
    email: r.email ?? r.submitter_email ?? r.corresponding_email ?? '',
    status: r.status,
    decisionNote: r.decision_note,
    emailedAt: r.decision_emailed_at ? new Date(r.decision_emailed_at).toISOString() : null,
    createdAt: new Date(r.created_at).toISOString(),
    payload,
    files,
  }
}

export async function listFormRecords(): Promise<FormRecord[]> {
  const [apps, props, subs, uploads] = await Promise.all([
    query<Row>('SELECT * FROM editorial_applications ORDER BY created_at DESC LIMIT 500'),
    query<Row>('SELECT * FROM editorial_proposals ORDER BY created_at DESC LIMIT 500'),
    query<Row>('SELECT * FROM book_submissions ORDER BY created_at DESC LIMIT 500'),
    query<UploadRow>(
      `SELECT id, purpose, original_name, size_bytes, owner_type, owner_id FROM uploads
       WHERE status = 'attached' AND owner_type IN ('editorial_application', 'editorial_proposal', 'book_submission')`,
    ),
  ])

  const filesFor = (ownerType: string, id: number) =>
    uploads
      .filter((u) => u.owner_type === ownerType && Number(u.owner_id) === id)
      .map((u) => ({ id: u.id, purpose: u.purpose, name: u.original_name, size: Number(u.size_bytes) }))

  return [
    ...apps.map((r) => toRecord('application', r, filesFor('editorial_application', r.id))),
    ...props.map((r) => {
      const kind = r.kind === 'book_volume' ? 'book_volume' : 'special_issue'
      return toRecord(kind, r, filesFor('editorial_proposal', r.id))
    }),
    ...subs.map((r) => toRecord('book_submission', r, filesFor('book_submission', r.id))),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
