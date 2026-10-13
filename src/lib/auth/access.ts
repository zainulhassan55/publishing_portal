/**
 * Who may see which submissions.
 *
 * Until this module existed the portal had no access control of its own. The
 * two role checks in the codebase — the "Editorial queues" nav link in
 * Header.tsx and the "As editor" tab in DashboardPage.tsx — both only show and
 * hide UI, and `/api/submissions` gated on nothing but "is anyone signed in".
 * That is not a permission model; it is a display preference.
 *
 * ## Where the enforcement actually lives
 *
 * OJS, and that is deliberate. `GET /api/v1/{journal}/submissions` applies the
 * caller's own OJS permissions, verified directly against the live install with
 * an account holding reader + author + reviewer and nothing more:
 *
 *   - omitting `assignedTo` makes OJS force it to the caller's own id
 *   - asking for another user's id answers
 *     `403 "You can only view unpublished submissions to which you have been
 *     assigned."`
 *
 * So the portal cannot read a submission it has no right to, whatever this file
 * says. What this file fixes is the portal **asking the wrong question** — see
 * below — and the absence of any gate on privileged scopes, which otherwise
 * arrives the first time a route needs one and gets written ad hoc.
 *
 * The portal also *cannot* do its own ownership filtering as a second layer,
 * tempting as that is. The author-facing submission payload carries an empty
 * `authors` array, and `/submissions/{id}/participants` answers 401 for a
 * non-editorial account, so there is nothing to check ownership against. Asking
 * the correctly scoped question is the whole of the portal's job here; claiming
 * a defence-in-depth filter that cannot actually see ownership would be worse
 * than honest delegation, because it would read as a guarantee.
 *
 * ## The bug this closes
 *
 * `/api/submissions` issued `/submissions?count=100` with no scope at all and
 * rendered whatever came back under "My submissions". For an author that is
 * their own work, because OJS forces the filter. For an account holding
 * `manager` or `site-admin` in a journal, OJS legitimately returns **the entire
 * journal queue** — and the portal labelled every other author's manuscript as
 * the reader's own submission. One query whose meaning silently changed with the
 * caller's roles, behind a fixed heading.
 *
 * Scope is now always stated explicitly, so "mine" means the same thing for
 * every role, and the whole-queue read is a separate scope that has to be asked
 * for and is refused to anyone without the roles for it.
 *
 * ## The limit of a flat role list
 *
 * OJS grants roles **per journal**: someone can be an editor of IJDH and a
 * plain author everywhere else. `portal_sessions.roles` stores one flat
 * site-wide array, so `roles` here means "holds this role in at least one
 * journal" and can never mean "holds it in *this* journal". Every helper below
 * is therefore a coarse gate on which *scope* may be requested, and never the
 * last word on a specific journal or paper — OJS re-checks per journal on every
 * call and is the only thing that knows the answer. Narrowing this would mean
 * storing per-journal roles at sign-in; see docs/OJS-INTEGRATION.md.
 */

/**
 * How much of the submission list a request is asking for.
 *
 *   - `mine`  — submissions OJS has assigned to this user. For an author that
 *               is what they wrote; for an editor the papers they were assigned
 *               to handle; for a reviewer the ones they were invited to review,
 *               across any journal. One query covers all three because OJS
 *               models all three as an assignment.
 *   - `all`   — every submission in every journal, regardless of assignment.
 *               Administrators and journal managers only.
 */
export type SubmissionScope = 'mine' | 'all'

/**
 * Roles OJS lets see unassigned submissions in a journal.
 *
 * These two and no others, matching OJS's own test
 * (`ROLE_ID_SITE_ADMIN`, `ROLE_ID_MANAGER`). Note what is *not* here: `editor`
 * is OJS's sub-editor, which OJS itself restricts to assigned submissions. That
 * is also what the editorial policy asks for — an editor sees the papers they
 * were assigned, not the whole queue — so the portal does not have to fight its
 * identity provider to get the behaviour it wants.
 */
const ALL_SUBMISSIONS_ROLES = ['site-admin', 'manager']

export const canReadAllSubmissions = (roles: string[] | undefined) =>
  (roles ?? []).some((role) => ALL_SUBMISSIONS_ROLES.includes(role))

/**
 * The widest scope this user is entitled to.
 *
 * Used to decide what to *offer*, not to authorise a request: a caller asking
 * for `all` is checked with `canReadAllSubmissions`, because a UI that merely
 * declines to show a control is not a permission check.
 */
export const widestScope = (roles: string[] | undefined): SubmissionScope =>
  canReadAllSubmissions(roles) ? 'all' : 'mine'

/**
 * Resolves a requested scope against what the roles permit.
 *
 * Defaults to `mine` when nothing is asked for — the safe direction, and it
 * keeps the dashboard's meaning fixed no matter who signs in. An unrecognised
 * value is a client bug and is refused rather than quietly downgraded, so it
 * surfaces in testing instead of looking like it worked.
 */
export function resolveScope(
  requested: string | null | undefined,
  roles: string[] | undefined,
): { ok: true; scope: SubmissionScope } | { ok: false; reason: 'forbidden' | 'unknown-scope' } {
  if (requested === null || requested === undefined || requested === '' || requested === 'mine') {
    return { ok: true, scope: 'mine' }
  }

  if (requested === 'all') {
    return canReadAllSubmissions(roles) ? { ok: true, scope: 'all' } : { ok: false, reason: 'forbidden' }
  }

  return { ok: false, reason: 'unknown-scope' }
}
