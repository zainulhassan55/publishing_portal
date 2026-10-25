/**
 * Choice lists shared by the editorial forms and their API routes, so the
 * browser offers exactly what the server accepts.
 */

export const STATUS_LABELS: Record<string, string> = {
  received: 'Received',
  under_review: 'Under review',
  revisions: 'Revisions requested',
  accepted: 'Accepted',
  declined: 'Declined',
  withdrawn: 'Withdrawn',
}

export const APPLICATION_ROLES = [
  { value: 'reviewer', label: 'Reviewer' },
  { value: 'board', label: 'Editorial board member' },
] as const

export const DEGREES = ['PhD or equivalent doctorate', 'Master’s degree', 'Bachelor’s degree', 'Other'] as const

export const VOLUME_FORMATS = [
  { value: 'monograph', label: 'Research monograph' },
  { value: 'edited', label: 'Edited volume' },
  { value: 'proceedings', label: 'Conference proceedings' },
] as const

export const VOLUME_TIMELINES = ['Within 6 months', '7–9 months', '10–12 months', 'More than 12 months'] as const

export const CONTACT_TOPICS = [
  'General enquiry',
  'Submission enquiry',
  'Manuscript status',
  'Peer review',
  'Special issue proposal',
  'Book volume or proceedings proposal',
  'Editorial board application',
  'Indexing or metadata',
  'Technical problem',
  'Other',
] as const

/** Honeypot field name. Hidden from people; bots that fill every input fill it. */
export const HONEYPOT = 'website'
