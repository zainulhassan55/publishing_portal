/**
 * Which OJS pages an account can actually open, decided before the browser is
 * sent there.
 *
 * OJS enforces roles per journal, and a page it refuses is answered with a
 * redirect to `user/authorizationDenied` — rendered in OJS's own interface,
 * reading "The current role does not have access to this operation". The
 * portal's register page enrols new accounts as Readers (the journals here do
 * not yet permit Author self-registration, see ojs-register.ts), and a Reader
 * is refused by every workspace page: the dashboard (`dashboard/*`, role
 * assignments verified against pkp-lib stable-3_5_0: `mySubmissions` is
 * Author-only, `reviewAssignments` Reviewer-only, `editorial` editorial roles
 * only, and the bare `dashboard` and the legacy `submissions` page both
 * forward to `mySubmissions`), the submission wizard (which needs a user
 * group that may submit) and the editorial workflow.
 *
 * Sending such an account there, then letting OJS explain, is exactly the
 * "old interface keeps coming back after sign-in" complaint. So the hand-off
 * route asks here first, and keeps the reader on the portal with the real
 * explanation — which is that an editor has to grant the Author role.
 *
 * Pure and dependency-free so it runs under `node --test`.
 */

import { EDITORIAL_ROLES } from './roles.ts'

export type OjsRequirement = {
  /** Journal path, e.g. `ijdh`, or `index` for the site level. */
  journal: string
  /** The role family the page is gated on. */
  needs: 'author' | 'reviewer' | 'editorial' | 'member'
  /**
   * True for the submission wizard, the one page OJS opens to an account that
   * holds no submitting role *provided the journal's Author role permits
   * self-registration*: `getSubmitUserGroups()` falls back to that group and
   * the account is enrolled as an author on its first submission. The
   * hand-off checks the journal's registration form for that permission
   * before refusing (see authorSelfRegistrationOffered in ojs-register.ts).
   * The dashboard is not like this — it is Author-only regardless.
   */
  selfEnrolable?: boolean
}

/**
 * The role an OJS page under `ojsPath` is gated on, or null when the page is
 * open to any signed-in account (profile, public journal pages, article
 * galleys). Conservative on purpose: a page not listed here is handed off as
 * before.
 */
export function ojsPageRequirement(pathname: string, ojsPath: string): OjsRequirement | null {
  const prefix = `${ojsPath.replace(/\/$/, '')}/index.php/`
  if (!pathname.startsWith(prefix)) return null

  const [journal = '', page = '', op = ''] = pathname.slice(prefix.length).split('/')
  if (!journal) return null

  switch (page) {
    case 'submission':
      return { journal, needs: 'author', selfEnrolable: true }
    case 'submissions':
    case 'authorDashboard':
      return { journal, needs: 'author' }
    case 'reviewer':
      return { journal, needs: 'reviewer' }
    case 'workflow':
    case 'management':
    case 'stats':
      // Authors reach `workflow/access/<id>` for their own submissions; that is
      // the one editorial page an author may open, so it is left to OJS.
      return page === 'workflow' && op === 'access' ? { journal, needs: 'author' } : { journal, needs: 'editorial' }
    case 'dashboard':
      if (op === 'editorial') return { journal, needs: 'editorial' }
      if (op === 'reviewAssignments') return { journal, needs: 'reviewer' }
      // `mySubmissions`, and the bare `dashboard` which forwards to it.
      return { journal, needs: 'author' }
    default:
      return null
  }
}

/**
 * Whether `roles` (the lowercased OJS role names held in the portal session)
 * satisfy a requirement. Editorial roles satisfy everything: an editor opens
 * the author dashboard and the wizard freely in OJS.
 *
 * The site level (`index`) has no dashboard at all — OJS refuses everyone
 * there, editors included — so that is never satisfiable.
 */
export function canOpenOjsPage(roles: readonly string[], requirement: OjsRequirement | null): boolean {
  if (!requirement) return true
  if (requirement.journal === 'index') return false

  const editorial = roles.some((role) => EDITORIAL_ROLES.includes(role))
  if (editorial) return true

  switch (requirement.needs) {
    case 'author':
      return roles.includes('author')
    case 'reviewer':
      return roles.includes('reviewer')
    case 'editorial':
      return false
    case 'member':
      return roles.some((role) => role !== 'reader')
  }
}
