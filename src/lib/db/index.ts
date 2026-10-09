import mysql from 'mysql2/promise'

/**
 * Portal database access.
 *
 * Deliberately mysql2 with prepared statements rather than an ORM. The portal
 * owns six small tables with straightforward CRUD, so an ORM would add a
 * dependency, a migration toolchain and a query-builder abstraction for no
 * benefit — and the one ORM candidate carried an open SQL-injection advisory.
 *
 * This connects to a separate `portal` database in the MySQL instance OJS
 * already runs on, with its own user and grants. It must never read or write
 * OJS's tables: OJS is the system of record for users, submissions, reviews and
 * issues, and a second writer into its schema is how data corruption starts.
 */

let pool: mysql.Pool | null = null

export const databaseConfigured = Boolean(process.env.PORTAL_DATABASE_URL)

export function getPool(): mysql.Pool {
  if (!process.env.PORTAL_DATABASE_URL) {
    throw new Error('PORTAL_DATABASE_URL is not set')
  }

  if (!pool) {
    pool = mysql.createPool({
      uri: process.env.PORTAL_DATABASE_URL,
      waitForConnections: true,
      connectionLimit: 8,
      queueLimit: 0,
      // Values come back as JS types rather than strings, so callers do not
      // each have to remember to coerce.
      dateStrings: false,
      timezone: 'Z',
    })
  }

  return pool
}

export type QueryParam = string | number | boolean | null | Date

/** Parameterised query. The only way SQL is issued — no string interpolation. */
export async function query<T = Record<string, unknown>>(sql: string, params: QueryParam[] = []): Promise<T[]> {
  const [rows] = await getPool().execute(sql, params)
  return rows as T[]
}

export async function insert(sql: string, params: QueryParam[] = []): Promise<number> {
  const [result] = await getPool().execute(sql, params)
  return (result as mysql.ResultSetHeader).insertId
}

export async function execute(sql: string, params: QueryParam[] = []): Promise<number> {
  const [result] = await getPool().execute(sql, params)
  return (result as mysql.ResultSetHeader).affectedRows
}

/**
 * Health probe for the readiness endpoint. Returns a reason instead of throwing
 * so the probe can report *why* the database is unavailable.
 */
export async function pingDatabase(): Promise<{ ok: boolean; reason?: string }> {
  if (!databaseConfigured) return { ok: false, reason: 'not-configured' }
  try {
    await query('SELECT 1')
    return { ok: true }
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : 'unknown' }
  }
}

export async function closePool() {
  if (pool) {
    await pool.end()
    pool = null
  }
}
