/**
 * Loads .env.local for the standalone scripts.
 *
 * Next.js reads .env.local automatically, but `node scripts/*.ts` does not —
 * so every script invocation needed its variables prefixed on the command line,
 * which is easy to forget and produces a confusing "not set" error for config
 * that is in fact sitting in the file next to it.
 *
 * Real environment variables always win: an explicit prefix or a systemd
 * EnvironmentFile must override whatever is in .env.local, or production would
 * silently inherit a developer's settings.
 */
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

export function loadLocalEnv(): void {
  // Snapshot the VALUES, not just the key names: loadEnvFile overwrites in
  // place, so reading them back afterwards would return what the file set and
  // restore nothing.
  const real = new Map(Object.entries(process.env))

  for (const name of ['.env.local', '.env']) {
    const path = join(repoRoot, name)
    if (!existsSync(path)) continue

    try {
      process.loadEnvFile(path)
    } catch {
      // A malformed or unreadable file must not stop the script — the caller
      // reports missing configuration far more usefully than a parse error.
      continue
    }
  }

  for (const [key, value] of real) {
    if (value !== undefined) process.env[key] = value
  }
}
