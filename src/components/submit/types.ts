/**
 * The submission draft payload.
 *
 * This is what `POST /api/drafts` stores verbatim in `submission_drafts.payload`
 * and what `POST /api/drafts/submit` reads back when it hands the manuscript to
 * OJS. OJS is the system of record from the moment the hand-off succeeds, so
 * nothing here is authoritative after submission — it exists only to let an
 * author build up a submission over several sittings.
 */

export type ArticleTypeName = 'Research Article' | 'Review' | 'Short Communication' | 'Case Study' | 'Perspective'

export type ArticleTypeSpec = {
  name: ArticleTypeName
  /** Main-text limit, excluding references. */
  words: number
  abstractWords: number
  note?: string
}

export const ARTICLE_TYPES: ArticleTypeSpec[] = [
  {
    name: 'Research Article',
    words: 8000,
    abstractWords: 250,
    note: 'Structured abstract: Background, Methods, Results, Conclusions.',
  },
  { name: 'Review', words: 10000, abstractWords: 250, note: 'Systematic or narrative syntheses.' },
  { name: 'Short Communication', words: 3000, abstractWords: 150, note: 'A single, self-contained finding.' },
  { name: 'Case Study', words: 5000, abstractWords: 200, note: 'Consent for publication is required.' },
  { name: 'Perspective', words: 3000, abstractWords: 150, note: 'Argument or commentary; invited or unsolicited.' },
]

export const articleTypeSpec = (name: string): ArticleTypeSpec =>
  ARTICLE_TYPES.find((type) => type.name === name) ?? ARTICLE_TYPES[0]

/** CRediT taxonomy, all fourteen roles, in the published order. */
export const CREDIT_ROLES = [
  'Conceptualization',
  'Data curation',
  'Formal analysis',
  'Funding acquisition',
  'Investigation',
  'Methodology',
  'Project administration',
  'Resources',
  'Software',
  'Supervision',
  'Validation',
  'Visualization',
  'Writing – original draft',
  'Writing – review and editing',
] as const

export const FILE_KINDS = [
  'Anonymised manuscript',
  'Manuscript with author details',
  'Title page',
  'Figure',
  'Table',
  'Supplementary file',
  'Cover letter',
] as const

export type DraftFileKind = (typeof FILE_KINDS)[number]

/**
 * The two kinds the technical check rejects a submission for missing.
 *
 * Advisory in the portal: StepFiles shows them as a readiness checklist so the
 * author knows what to have to hand, but the portal never receives the files
 * and so cannot enforce the requirement. OJS does, at the point of attachment.
 */
export const REQUIRED_FILE_KINDS: DraftFileKind[] = ['Anonymised manuscript', 'Title page']

/**
 * Each item is tied to the journal policy page that defines it, so a confirmation
 * is never asked for without the text behind it being one click away.
 */
export const REQUIREMENTS: { text: string; pageId: string }[] = [
  {
    text: 'The manuscript follows the journal template, reference style and word limit for the chosen article type.',
    pageId: 'author-instructions',
  },
  {
    text: 'The work is original, is not published elsewhere and is not under consideration at another journal, and all authors have approved its submission.',
    pageId: 'publication-ethics',
  },
  {
    text: 'The main manuscript file is anonymised for double-blind review, with author names, affiliations and identifying acknowledgements removed.',
    pageId: 'peer-review-process',
  },
  {
    text: 'Any use of generative AI tools in the research or the writing is disclosed in the declarations.',
    pageId: 'generative-ai-policy',
  },
  {
    text: 'The data underlying the findings can be described in a data availability statement, and shared where ethics and consent allow.',
    pageId: 'research-data-policy',
  },
  {
    text: 'I accept publication under CC BY 4.0, retaining copyright, and I hold the rights to any third-party material reproduced in the manuscript.',
    pageId: 'copyright-licensing',
  },
]

export type AiDisclosure = 'none' | 'language' | 'content'

export const AI_DISCLOSURES: { value: AiDisclosure; label: string; hint?: string }[] = [
  { value: 'none', label: 'No generative AI tools were used' },
  { value: 'language', label: 'Used for language editing only' },
  {
    value: 'content',
    label: 'Used for content, analysis or images',
    hint: 'Describe the tool, version and how it was used in the manuscript.',
  },
]

export type DraftAuthor = {
  id: string
  given: string
  family: string
  email: string
  affiliation: string
  /** ROR identifier, set only when the author picked a registry match. */
  rorId: string
  country: string
  orcid: string
  corresponding: boolean
  roles: string[]
}

/**
 * File *metadata* only — and this is the permanent design, not a gap.
 *
 * The bytes are never sent anywhere: the draft records what the author intends
 * to attach, and the files themselves are uploaded in OJS, which owns them.
 * Relaying manuscripts through the portal would put unscreened, sometimes
 * embargoed research data in a second location, inheriting backup, retention
 * and disclosure obligations for a copy nothing needs.
 *
 * See docs/OJS-INTEGRATION.md and the note in StepFiles.
 */
export type DraftFile = {
  id: string
  name: string
  size: number
  kind: DraftFileKind | ''
}

export type DraftPayload = {
  journalSlug: string
  articleType: ArticleTypeName
  specialIssueId: string
  inScope: boolean
  requirements: boolean[]
  title: string
  runningTitle: string
  abstract: string
  keywords: string[]
  subject: string
  authors: DraftAuthor[]
  funding: 'yes' | 'no' | ''
  funder: string
  grant: string
  competingInterests: string
  ethics: string
  dataAvailability: string
  generativeAi: AiDisclosure | ''
  preprintDoi: string
  suggestedReviewers: string
  opposedReviewers: string
  authorsApproved: boolean
}

/** Everything a step validator needs. Files live outside `payload` in the API. */
export type DraftState = { draft: DraftPayload; files: DraftFile[] }

export const newAuthor = (id: string): DraftAuthor => ({
  id,
  given: '',
  family: '',
  email: '',
  affiliation: '',
  rorId: '',
  country: '',
  orcid: '',
  corresponding: false,
  roles: [],
})

export const emptyDraft = (journalSlug: string): DraftPayload => ({
  journalSlug,
  articleType: 'Research Article',
  specialIssueId: '',
  inScope: false,
  requirements: REQUIREMENTS.map(() => false),
  title: '',
  runningTitle: '',
  abstract: '',
  keywords: [],
  subject: '',
  authors: [{ ...newAuthor('a1'), corresponding: true }],
  funding: '',
  funder: '',
  grant: '',
  competingInterests: '',
  ethics: '',
  dataAvailability: '',
  generativeAi: '',
  preprintDoi: '',
  suggestedReviewers: '',
  opposedReviewers: '',
  authorsApproved: false,
})

/**
 * A stored draft may predate a change to this shape, so every field is merged
 * over the empty draft rather than trusted wholesale.
 */
export const mergeDraft = (stored: unknown, journalSlug: string): DraftPayload => {
  const base = emptyDraft(journalSlug)
  if (!stored || typeof stored !== 'object') return base
  const partial = stored as Partial<DraftPayload>
  return {
    ...base,
    ...partial,
    requirements:
      Array.isArray(partial.requirements) && partial.requirements.length === base.requirements.length
        ? partial.requirements.map(Boolean)
        : base.requirements,
    keywords: Array.isArray(partial.keywords) ? partial.keywords.filter((k): k is string => typeof k === 'string') : [],
    authors:
      Array.isArray(partial.authors) && partial.authors.length > 0
        ? partial.authors.map((author, index) => ({ ...newAuthor(`a${index + 1}`), ...author }))
        : base.authors,
  }
}

/* -------------------------------------------------------------------------- */
/* Props supplied by the server shell                                         */
/* -------------------------------------------------------------------------- */

export type JournalOption = { slug: string; title: string; code: string }

export type CallOption = {
  id: string
  journalSlug: string
  theme: string
  deadlineIso: string
  guestEditor?: string
}

export type StepLabel = {
  /** Rail label. */
  label: string
  /** Heading above the step body. */
  title: string
}

export const STEPS: StepLabel[] = [
  { label: 'Journal and section', title: 'Choose a journal and article type' },
  { label: 'Requirements', title: 'Confirm the submission requirements' },
  { label: 'Metadata', title: 'Title, abstract and keywords' },
  { label: 'Authors', title: 'Authors and affiliations' },
  { label: 'Files', title: 'Manuscript files' },
  { label: 'Declarations', title: 'Declarations' },
  { label: 'Review and submit', title: 'Review and submit' },
]

export const TOTAL_STEPS = STEPS.length

/** Resolves an error message for one field id, or undefined. */
export type ErrorLookup = (field: string) => string | undefined
