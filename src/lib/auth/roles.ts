/**
 * The pure parts of the session model: types, OJS role ids, and the cookie
 * name. No imports, deliberately.
 *
 * This is split out of `session.ts` so the OJS login parsers can be unit-tested
 * under `node --test` without dragging in `next/headers` or the MySQL driver.
 * Tests are the only thing standing between an OJS markup change and a user who
 * cannot sign in, so they must be cheap to run.
 */

export type SessionUser = {
  id: number
  userName: string
  fullName: string
  givenName?: string
  familyName?: string
  email: string
  orcid?: string
  affiliation?: string
  /** Lowercased OJS role names, e.g. ['author', 'reviewer']. */
  roles: string[]
}

export type Session = { user: SessionUser | null; reason?: string }

/** The OJS 3.x session cookie. Name is configurable in config.inc.php. */
export const OJS_SESSION_COOKIE = process.env.OJS_SESSION_COOKIE || 'OJSSID'

/**
 * OJS role ids — the only place these numbers are written down.
 *
 * OJS 3.5 reports them in the `currentUser` bootstrap blob on any authenticated
 * page, so they are available at sign-in without a separate API lookup.
 */
export const ROLE_NAMES: Record<number, string> = {
  1: 'site-admin',
  16: 'manager',
  17: 'editor',
  65536: 'author',
  4096: 'reviewer',
  8192: 'assistant',
  1048576: 'reader',
  2097152: 'subscription-manager',
}

export const hasRole = (session: Session, role: string) => session.user?.roles.includes(role) ?? false

/**
 * How a role is written for a reader.
 *
 * The raw names are OJS's internal slugs and leak its vocabulary — "manager"
 * on its own reads like a job title rather than a journal role, and
 * "site-admin" is not a phrase anyone outside the software uses.
 */
export const ROLE_LABELS: Record<string, string> = {
  'site-admin': 'Site administrator',
  manager: 'Journal manager',
  editor: 'Editor',
  assistant: 'Editorial assistant',
  author: 'Author',
  reviewer: 'Reviewer',
  reader: 'Reader',
  'subscription-manager': 'Subscription manager',
}

export const roleLabel = (role: string) => ROLE_LABELS[role] ?? role

/**
 * Roles that can act on other people's manuscripts.
 *
 * There is no "publisher" role in OJS. Running the press — creating journals,
 * appointing editors, site-wide settings — is `site-admin`, and running one
 * journal is `manager`. Anyone looking for a publisher workspace wants one of
 * those two.
 */
export const EDITORIAL_ROLES = ['site-admin', 'manager', 'editor', 'assistant']

export const hasEditorialRole = (roles: string[] | undefined) =>
  (roles ?? []).some((role) => EDITORIAL_ROLES.includes(role))
