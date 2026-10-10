/**
 * Applies SQL migrations in filename order, recording each in
 * `schema_migrations` so re-running is a no-op.
 *
 * Statements are split on semicolons at end of line, which is sufficient for
 * DDL. If a migration ever needs a stored routine with internal semicolons,
 * apply it by hand and insert the ledger row — do not make this splitter
 * cleverer than it needs to be.
 *
 * ## The bug this previously had, because it is an easy one to reintroduce
 *
 * Comment lines are stripped from each chunk *line by line*. The earlier
 * version tested whether the whole chunk started with `--` and discarded it if
 * so — which silently dropped every `CREATE TABLE` that had an explanatory
 * comment above it. On a schema where most tables are commented, that applied
 * one table out of six, recorded the migration as done, and exited 0. The
 * result was a database missing most of its tables and a ledger insisting the
 * schema was current.
 *
 * Hence the guard below: a `.sql` file that yields **zero** statements is an
 * error, not a no-op. A migration that parses to nothing is always a parser
 * fault, never an empty migration anyone meant to write.
 *
 * Caveat accepted: a `--` sequence inside a string literal would be stripped
 * too. That has not come up in DDL and the alternative is a real SQL parser.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import mysql from 'mysql2/promise'
import { loadLocalEnv } from './env.ts'

loadLocalEnv()

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

  // Order matters: strip comments FIRST, then split.
  //
  // Splitting first means a semicolon inside a comment — "…on mutating API
  // calls;" is a perfectly natural thing to write — cuts a CREATE TABLE in
  // half and the migration dies with a syntax error pointing at the truncation
  // rather than at the comment that caused it.
  const withoutComments = sql
    .split('\n')
    .filter((line) => !/^\s*--/.test(line))
    .join('\n')

  const statements = withoutComments
    .split(/;\s*$/m)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  if (statements.length === 0) {
    console.error(`\n${file} parsed to zero statements. Refusing to record it as applied.`)
    console.error('That is a splitter fault, not an empty migration. Fix it before continuing —')
    console.error('recording it would leave the schema incomplete and the ledger claiming otherwise.')
    await connection.end()
    process.exit(1)
  }

  for (const statement of statements) {
    await connection.query(statement)
  }

  await connection.execute('INSERT INTO schema_migrations (name) VALUES (?)', [file])
  console.log(`apply ${file} (${statements.length} statements)`)
  count += 1
}

await connection.end()
console.log(count === 0 ? 'Schema already up to date.' : `Applied ${count} migration(s).`)
