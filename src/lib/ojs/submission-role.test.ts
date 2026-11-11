import assert from 'node:assert/strict'
import { test } from 'node:test'
import { roleFromAssignments, roleFromParticipants, type OjsParticipant } from './submission-role.ts'

/**
 * Shapes taken from the live install's `/submissions/{id}/participants/1`:
 * TQCIS-36, where Dr. Akshat Gurav (21) is the author and Brij B. Gupta (61)
 * the Editor-in-Chief — the paper that showed up under "As author" for both.
 */
const assigned = (id: number, ...roleIds: number[]): OjsParticipant => ({
  id,
  stageAssignments: roleIds.map((roleId) => ({ stageAssignmentUserGroup: { roleId } })),
})

const tqcis36 = [assigned(21, 65536), assigned(61, 17)]

test('the author of a paper is its author', () => {
  assert.equal(roleFromParticipants(tqcis36, 21), 'author')
})

test('the editor handling a paper is its editor, not its author', () => {
  assert.equal(roleFromParticipants(tqcis36, 61), 'editor')
  assert.equal(roleFromParticipants([assigned(5, 16)], 5), 'editor')
})

test('author outranks editor on the same paper', () => {
  assert.equal(roleFromParticipants([assigned(9, 17, 65536)], 9), 'author')
})

test('someone who is not a participant gets no stage role', () => {
  // A reviewer: assigned to the paper through a review assignment, never as a
  // stage participant.
  assert.equal(roleFromParticipants(tqcis36, 99), null)
})

test('journal-wide roles do not leak in — only the stage assignment counts', () => {
  // OJS reports `groups` (every role in the journal) beside the assignments.
  // An editor of the journal who is only the author here is the author.
  const participant = { ...assigned(21, 65536), groups: [{ roleId: 16 }, { roleId: 17 }] }
  assert.equal(roleFromParticipants([participant], 21), 'author')
})

test('database rows classify the same way as the participant list', () => {
  assert.equal(roleFromAssignments([65536], false), 'author')
  assert.equal(roleFromAssignments([17], false), 'editor')
  assert.equal(roleFromAssignments([], true), 'reviewer')
  // A stage role says more than a review assignment on the same paper.
  assert.equal(roleFromAssignments([17], true), 'editor')
  assert.equal(roleFromAssignments([65536, 17], true), 'author')
  assert.equal(roleFromAssignments([], false), null)
})
