/**
 * Per-step validation for the submission wizard.
 *
 * Pure functions over the draft so the rules can be tested without rendering
 * anything, and so the step rail, the error summary and the final cross-step
 * check all read from one definition rather than three.
 *
 * This is a convenience layer. `src/lib/validate.ts` is the boundary that has
 * to hold, and OJS validates again on the other side of the hand-off.
 */

import { wordCount } from '@/lib/format'
import { isDoi, isEmail, isOrcid } from '@/lib/validate'
import { TOTAL_STEPS, articleTypeSpec, type DraftState } from './types'

export type StepError = { field: string; message: string }

/* -------------------------------------------------------------------------- */
/* ORCID                                                                      */
/* -------------------------------------------------------------------------- */

const ORCID_SHAPE = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/

export type OrcidState = 'empty' | 'malformed' | 'checksum' | 'valid'

/**
 * Distinguishes the two ways an ORCID iD can be wrong, because the fixes differ:
 * a malformed value is a formatting mistake, while a well-formed value that
 * fails the ISO 7064 MOD 11-2 check digit is a transcription error in the
 * digits themselves — usually one digit, and the author has to go and look it up
 * again rather than reshape what they typed.
 */
export function orcidState(raw: string): OrcidState {
  const value = raw.trim().replace(/^https?:\/\/orcid\.org\//, '')
  if (!value) return 'empty'
  if (!ORCID_SHAPE.test(value)) return 'malformed'
  return isOrcid(value) ? 'valid' : 'checksum'
}

export const ORCID_MESSAGES: Record<Exclude<OrcidState, 'valid' | 'empty'>, string> = {
  malformed: 'ORCID iD must be 16 digits in the form 0000-0002-1825-0097',
  checksum: 'That ORCID iD fails its check digit — one of the digits is wrong. Check it at orcid.org',
}

/* -------------------------------------------------------------------------- */
/* Field ids                                                                  */
/* -------------------------------------------------------------------------- */

/** Error summary entries link to `#<field>`, so these must match element ids. */
export const authorField = (index: number, name: string) => `author-${index + 1}-${name}`
export const fileField = (index: number) => `file-${index + 1}-kind`

/* -------------------------------------------------------------------------- */
/* Steps                                                                      */
/* -------------------------------------------------------------------------- */

function validateJournal({ draft }: DraftState): StepError[] {
  const errors: StepError[] = []
  if (!draft.journalSlug) errors.push({ field: 'f-journal', message: 'Choose the journal you are submitting to' })
  if (!draft.articleType) errors.push({ field: 'f-article-type', message: 'Choose an article type' })
  if (!draft.inScope) {
    errors.push({ field: 'f-in-scope', message: 'Confirm the manuscript is within the journal’s aims and scope' })
  }
  return errors
}

function validateRequirements({ draft }: DraftState): StepError[] {
  const remaining = draft.requirements.filter((ticked) => !ticked).length
  if (remaining === 0) return []
  return [
    {
      field: 'f-requirements',
      message: `Confirm all ${draft.requirements.length} requirements (${remaining} remaining)`,
    },
  ]
}

function validateMetadata({ draft }: DraftState): StepError[] {
  const errors: StepError[] = []
  const spec = articleTypeSpec(draft.articleType)
  const abstractWords = wordCount(draft.abstract)

  if (!draft.title.trim()) errors.push({ field: 'f-title', message: 'Enter the full title of the manuscript' })
  else if (draft.title.trim().length < 10) {
    errors.push({ field: 'f-title', message: 'The title looks too short to be the full title' })
  }

  if (draft.runningTitle.length > 70) {
    errors.push({ field: 'f-running-title', message: 'Shorten the running title to 70 characters or fewer' })
  }

  if (abstractWords === 0) errors.push({ field: 'f-abstract', message: 'Enter an abstract' })
  else if (abstractWords > spec.abstractWords) {
    errors.push({
      field: 'f-abstract',
      message: `Shorten the abstract to ${spec.abstractWords} words or fewer for a ${draft.articleType}`,
    })
  }

  if (draft.keywords.length < 3 || draft.keywords.length > 8) {
    errors.push({ field: 'f-keywords', message: 'Add between 3 and 8 keywords' })
  }

  return errors
}

function validateAuthors({ draft }: DraftState): StepError[] {
  const errors: StepError[] = []

  if (draft.authors.length === 0) {
    return [{ field: 'f-authors', message: 'Add at least one author' }]
  }

  draft.authors.forEach((author, index) => {
    const who = `Author ${index + 1}`
    if (!author.given.trim()) errors.push({ field: authorField(index, 'given'), message: `${who}: enter a given name` })
    if (!author.family.trim()) {
      errors.push({ field: authorField(index, 'family'), message: `${who}: enter a family name` })
    }
    if (!author.email.trim()) errors.push({ field: authorField(index, 'email'), message: `${who}: enter an email address` })
    else if (!isEmail(author.email)) {
      errors.push({ field: authorField(index, 'email'), message: `${who}: enter a valid email address` })
    }
    if (!author.affiliation.trim()) {
      errors.push({ field: authorField(index, 'affiliation'), message: `${who}: enter an affiliation` })
    }

    const orcid = orcidState(author.orcid)
    if (orcid === 'malformed' || orcid === 'checksum') {
      errors.push({ field: authorField(index, 'orcid'), message: `${who}: ${ORCID_MESSAGES[orcid]}` })
    } else if (orcid === 'empty' && author.corresponding) {
      errors.push({
        field: authorField(index, 'orcid'),
        message: `${who}: the corresponding author must provide an ORCID iD`,
      })
    }
  })

  const corresponding = draft.authors.filter((author) => author.corresponding).length
  if (corresponding === 0) errors.push({ field: 'f-authors', message: 'Choose which author is the corresponding author' })
  if (corresponding > 1) errors.push({ field: 'f-authors', message: 'Only one author can be the corresponding author' })

  return errors
}

/**
 * The file step is a readiness checklist, not a gate.
 *
 * The portal records file *metadata* and never receives the bytes — manuscripts
 * are attached in OJS, which is the system that stores them and the only place
 * the requirement can actually be enforced. Blocking the step on a manifest
 * nothing downstream reads made the author do work that was then discarded,
 * which is the same defect class as the dead controls in audit finding F-18.
 *
 * So: still require a kind on any file the author chose to list, because an
 * unlabelled entry makes the checklist useless. Do not require that files be
 * listed at all, or that particular kinds appear — StepFiles shows those as
 * advisory ✓/! indicators so the author knows what to have to hand, and OJS
 * will refuse the submission without them.
 */
function validateFiles({ files }: DraftState): StepError[] {
  const errors: StepError[] = []

  files.forEach((file, index) => {
    if (!file.kind) errors.push({ field: fileField(index), message: `Choose a file type for ${file.name}` })
  })

  return errors
}

function validateDeclarations({ draft }: DraftState): StepError[] {
  const errors: StepError[] = []

  if (!draft.funding) errors.push({ field: 'f-funding', message: 'State whether the work received funding' })
  if (draft.funding === 'yes' && !draft.funder.trim()) {
    errors.push({ field: 'f-funder', message: 'Name the funder' })
  }
  if (!draft.competingInterests.trim()) {
    errors.push({
      field: 'f-competing-interests',
      message: 'Declare competing interests, or state that there are none',
    })
  }
  if (!draft.ethics.trim()) {
    errors.push({
      field: 'f-ethics',
      message: 'Report ethics approval and consent, or state why approval was not required',
    })
  }
  if (!draft.dataAvailability.trim()) {
    errors.push({ field: 'f-data', message: 'Provide a data availability statement' })
  }
  if (!draft.generativeAi) {
    errors.push({ field: 'f-ai', message: 'Disclose whether generative AI tools were used' })
  }
  if (draft.preprintDoi.trim() && !isDoi(draft.preprintDoi)) {
    errors.push({ field: 'f-preprint', message: 'Enter the preprint DOI in the form 10.1101/2026.01.15.123456' })
  }

  return errors
}

function validateReview({ draft }: DraftState): StepError[] {
  if (draft.authorsApproved) return []
  return [
    {
      field: 'f-approved',
      message: 'Confirm that all authors have approved the submission and that the information is accurate',
    },
  ]
}

const VALIDATORS: ((state: DraftState) => StepError[])[] = [
  validateJournal,
  validateRequirements,
  validateMetadata,
  validateAuthors,
  validateFiles,
  validateDeclarations,
  validateReview,
]

/** `step` is 1-based, matching the rail and the `?step=` parameter. */
export function validateStep(step: number, state: DraftState): StepError[] {
  const validator = VALIDATORS[step - 1]
  return validator ? validator(state) : []
}

export function validateAll(state: DraftState): Record<number, StepError[]> {
  const result: Record<number, StepError[]> = {}
  for (let step = 1; step <= TOTAL_STEPS; step += 1) result[step] = validateStep(step, state)
  return result
}

/** The step the final submit has to send the author back to, if any. */
export function firstInvalidStep(state: DraftState): number | null {
  for (let step = 1; step <= TOTAL_STEPS; step += 1) {
    if (validateStep(step, state).length > 0) return step
  }
  return null
}

/** First message per field, for rendering errors beside the control. */
export function errorMap(errors: StepError[]): Record<string, string> {
  const map: Record<string, string> = {}
  errors.forEach((error) => {
    if (!map[error.field]) map[error.field] = error.message
  })
  return map
}
