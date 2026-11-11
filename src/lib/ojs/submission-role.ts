/**
 * Which hat the signed-in user wears on one submission: author, editor or
 * reviewer.
 *
 * `/api/submissions` asks OJS for everything `assignedTo` the user, and OJS
 * counts all three as an assignment. The dashboard used to put the whole
 * answer under "As author", so an editor saw every paper they were handling
 * listed as their own submission.
 *
 * The submission list carries no assignment data, and OJS 3.5 ignores an
 * `assignedWithRoles` filter on it (both verified against the live install).
 * What does carry it is `/submissions/{id}/participants/{stageId}`: each
 * participant comes back with `stageAssignments`, and each of those names the
 * user group — and so the role — the person holds *on that submission*. The
 * `groups` field beside it is the person's roles in the whole journal, which is
 * exactly the wrong question, so it is not read.
 *
 * Stage 1 is the stage to ask about. The Author group and the editorial groups
 * are attached to it, while later stages are not reliably attached to every
 * editorial group — on this install an Editor-in-Chief is missing from the
 * copyediting participant list of a paper they handle. Reviewers are never
 * stage participants; they hold a review assignment instead.
 *
 * Pure and dependency-free so it runs under `node --test`.
 */

import { EDITORIAL_ROLES, ROLE_NAMES } from '../auth/roles.ts'

export type SubmissionRole = 'author' | 'editor' | 'reviewer'

export type OjsParticipant = {
  id?: number
  stageAssignments?: { stageAssignmentUserGroup?: { roleId?: number } }[]
}

/**
 * The user's role on a submission according to its participant list, or null
 * when they are not a participant at all.
 *
 * Author outranks editor: someone who holds both on one paper (an editor who
 * submitted to their own journal) is reading it as their own manuscript, and
 * the author view is the one that shows them what they have to do.
 */
export function roleFromParticipants(participants: OjsParticipant[], userId: number): SubmissionRole | null {
  const me = participants.find((p) => p.id === userId)
  if (!me) return null
  return roleFromAssignments(
    (me.stageAssignments ?? []).map((a) => a.stageAssignmentUserGroup?.roleId ?? -1),
    false,
  )
}

/**
 * The same decision from raw OJS data: the role ids of the user's stage
 * assignments on one paper, and whether they hold a review assignment on it.
 * Used with rows read from the OJS database (src/lib/ojs/db.ts).
 *
 * Author, then editor, then reviewer. An editor who also reviews a paper is
 * handling it; a stage role always says more than a review assignment.
 */
export function roleFromAssignments(stageRoleIds: number[], reviewing: boolean): SubmissionRole | null {
  const roles = stageRoleIds.map((id) => ROLE_NAMES[id])
  if (roles.includes('author')) return 'author'
  if (roles.some((role) => role && EDITORIAL_ROLES.includes(role))) return 'editor'
  return reviewing ? 'reviewer' : null
}
