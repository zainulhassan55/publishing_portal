/**
 * Starting drafts for the letters the admin panel sends when a decision is
 * recorded.
 *
 * These are only the first draft: the editor sees the letter in the panel,
 * edits it as they like, and sends what they wrote. So the wording here aims
 * to be correct and polite rather than complete, and leaves a clearly marked
 * gap where the editor has something specific to say.
 *
 * Pure and dependency-free so the client composer can build the draft without
 * a round trip. The server validates what comes back; it never re-renders it.
 */

export type DecisionKind = 'journal_proposal' | 'application' | 'special_issue' | 'book_volume' | 'book_submission'

/** Statuses that come with a letter. `under_review` and `withdrawn` are internal bookkeeping. */
export const EMAILED_STATUSES = ['accepted', 'declined', 'revisions'] as const

export const emailsOnDecision = (status: string) => (EMAILED_STATUSES as readonly string[]).includes(status)

export type DraftInput = {
  kind: DecisionKind
  status: string
  name: string
  reference: string
  /** The thing decided on: a journal title, a volume title, "Reviewer application". */
  title: string
  /** Journal or series name, when the record has one. */
  targetTitle?: string
  /** For applications: reviewer or board. */
  role?: string
  /** The decision note the editor typed, if any. Folded into the letter. */
  note?: string
}

export type Draft = { subject: string; body: string }

const WHAT: Record<DecisionKind, string> = {
  journal_proposal: 'journal proposal',
  application: 'application',
  special_issue: 'special issue proposal',
  book_volume: 'book volume proposal',
  book_submission: 'chapter submission',
}

const PLACEHOLDER = '[Add any details here, or delete this line.]'

function acceptedLines(i: DraftInput): string[] {
  const where = i.targetTitle ? ` for ${i.targetTitle}` : ''
  switch (i.kind) {
    case 'application':
      return i.role === 'board'
        ? [
            `We are delighted to invite you to join the Editorial Board${where}.`,
            'A member of the editorial office will write to you shortly with the next steps, including access to the editorial system and your listing on the journal website.',
          ]
        : [
            `We are pleased to confirm your appointment as a reviewer${where}.`,
            'You will receive review invitations through our editorial system when a manuscript matches your expertise. You can accept or decline each invitation there.',
          ]
    case 'special_issue':
      return [
        `We are pleased to tell you that your special issue proposal “${i.title}”${where} has been approved.`,
        'The journal editors will contact you to agree the call for papers, timeline and guest editor access to the editorial system.',
      ]
    case 'book_volume':
      return [
        `We are pleased to tell you that your proposal “${i.title}”${where} has been approved by the Series Editors.`,
        'We will be in touch about the contract, manuscript preparation and the delivery timeline. As noted at submission, approval of the proposal does not guarantee acceptance of the completed manuscript.',
      ]
    case 'book_submission':
      return [
        `We are pleased to tell you that your chapter “${i.title}” has been accepted${where}.`,
        'The volume editors will contact you about final files, copyright and proofs.',
      ]
    case 'journal_proposal':
      return [
        `We are pleased to tell you that the publishing committee has approved your proposal for “${i.title}”.`,
        'We will contact you to begin setting up the journal: its editorial team, scope statement and launch timeline.',
      ]
  }
}

function declinedLines(i: DraftInput): string[] {
  const opener =
    i.kind === 'application'
      ? `Thank you for your interest in serving${i.targetTitle ? ` ${i.targetTitle}` : ' NextGenIQ Press'}. After careful consideration, we are unable to offer you a place at this time.`
      : `Thank you for submitting “${i.title}”. After careful consideration, we are unable to take your ${WHAT[i.kind]} forward.`
  return [opener]
}

function revisionLines(i: DraftInput): string[] {
  return [
    `Thank you for submitting “${i.title}”. The editors have reviewed it and would like you to revise it before a final decision is made.`,
    'Please send your revised chapter, together with a short note explaining how you have addressed each point, by replying to this email.',
  ]
}

/** The draft letter for a decision, or null when the status does not come with one. */
export function decisionDraft(i: DraftInput): Draft | null {
  if (!emailsOnDecision(i.status)) return null

  const what = WHAT[i.kind]
  const note = i.note?.trim()

  const subject =
    i.status === 'accepted'
      ? `Your ${what} has been accepted (${i.reference})`
      : i.status === 'revisions'
        ? `Revisions requested for your ${what} (${i.reference})`
        : `Decision on your ${what} (${i.reference})`

  const middle = i.status === 'accepted' ? acceptedLines(i) : i.status === 'revisions' ? revisionLines(i) : declinedLines(i)

  // A decline or revision letter always gets a slot for the reason; an
  // acceptance only shows the note if the editor wrote one.
  const reasonHeading = i.status === 'declined' ? 'The editors’ comments:' : i.status === 'revisions' ? 'The changes requested:' : ''
  const reason =
    i.status === 'accepted'
      ? note
        ? ['', note]
        : ['', PLACEHOLDER]
      : ['', reasonHeading, note || PLACEHOLDER]

  const closing =
    i.status === 'declined'
      ? 'We are grateful for your interest in NextGenIQ Press and hope you will consider us again in future.'
      : 'Thank you for working with NextGenIQ Press.'

  const body = [
    `Dear ${i.name},`,
    '',
    ...middle.flatMap((line, n) => (n === 0 ? [line] : ['', line])),
    ...reason,
    '',
    closing,
    '',
    `Please quote ${i.reference} in any reply.`,
    '',
    'Kind regards,',
    'The Editorial Office',
  ].join('\n')

  return { subject, body }
}

/** True while the editor has left the "add details" line in place. */
export const hasPlaceholder = (body: string) => body.includes(PLACEHOLDER)
