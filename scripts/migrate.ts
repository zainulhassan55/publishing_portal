/**
 * Applies SQL migrations in filename order, recording each in
 * `schema_migrations` so re-running is a no-op.
 *
 * Statements are split on semicolons at end of line, which is sufficient for
 * DDL. If a migration ever needs a stored routine with internal semicolons,
 * apply it by hand and insert the ledger row — do not make this splitter
 * cleverer than it needs to be.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import mysql from 'mysql2/promise'

const here = dirname(fileURLToPath(import.meta.url))
const migrationsDir = join(here, '..', 'migrations')

const url = process.env.PORTAL_DATABASE_URL
if (!url) {
  console.error('PORTAL_DATABASE_URL is not set.')
  process.exit(1)
}

const connection = await mysql.createConnection({ uri: url, multipleStatements: false })

await connection.query(
  `CREATE TABLE IF NOT EXISTS schema_migrations (
     name VARCHAR(190) NOT NULL,
     applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
     PRIMARY KEY (name)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
)

const [appliedRows] = await connection.query<mysql.RowDataPacket[]>('SELECT name FROM schema_migrations')
const applied = new Set(appliedRows.map((row) => row.name as string))

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort()

let count = 0

for (const file of files) {
  if (applied.has(file)) {
    console.log(`skip  ${file}`)
    continue
  }

  const sql = readFileSync(join(migrationsDir, file), 'utf8')
  const statements = sql
    .split(/;\s*$/m)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !/^--/.test(s.replace(/\n/g, '')))

  for (const statement of statements) {
    await connection.query(statement)
  }

  await connection.execute('INSERT INTO schema_migrations (name) VALUES (?)', [file])
  console.log(`apply ${file} (${statements.length} statements)`)
  count += 1
}

await connection.end()
console.log(count === 0 ? 'Schema already up to date.' : `Applied ${count} migration(s).`)
