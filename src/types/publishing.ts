import type { ContentTable, JournalPage, PublicationProfile } from './content'

/* -------------------------------------------------------------------------- */
/* Subjects                                                                   */
/* -------------------------------------------------------------------------- */

export type SubjectKey =
  | 'health'
  | 'management'
  | 'society'
  | 'entrepreneurship'
  | 'computing'
  | 'interdisciplinary'
  | 'mathematics'
  | 'electronics'
  | 'energy'
  | 'security'

export type Subject = {
  key: SubjectKey
  label: string
  /** oklch, so every subject colour sits at the same lightness and chroma. */
  color: string
}

/* -------------------------------------------------------------------------- */
/* Articles                                                                   */
/* -------------------------------------------------------------------------- */

export type ArticleType =
  | 'Research Article'
  | 'Review'
  | 'Short Communication'
  | 'Case Study'
  | 'Perspective'
  | 'Editorial'

export type Affiliation = {
  id: string
  name: string
  /** Research Organization Registry identifier, when matched. */
  ror?: string
  country?: string
}

export type ArticleAuthor = {
  name: string
  /** Indices into `Article.affiliations`, rendered as superscripts. */
  affiliationIds: string[]
  orcid?: string
  corresponding?: boolean
  email?: string
  /** CRediT contributor roles. */
  roles?: string[]
}

export type ArticleSection = {
  id: string
  /** "1", "2.1" — precomputed so the TOC and body never disagree. */
  number: string
  heading: string
  paragraphs?: string[]
  bullets?: string[]
  table?: ContentTable
  figure?: ArticleFigure
  equation?: { tex: string; label: string }
  subsections?: ArticleSection[]
}

export type ArticleFigure = {
  id: string
  label: string
  caption: string
  src?: string
  alt: string
}

export type ArticleReference = {
  id: string
  /** Rendered citation string, already in the journal's numbered style. */
  text: string
  doi?: string
}

export type SupplementaryFile = {
  name: string
  kind: 'PDF' | 'CSV' | 'MP4' | 'ZIP' | 'XLSX'
  size: string
  description?: string
  href?: string
}

export type ArticleDeclarations = {
  funding: string
  competingInterests: string
  ethics: string
  consent?: string
  dataAvailability: string
  contributions: string
  generativeAi: string
}

export type ArticleMetrics = {
  views: number
  downloads: number
  citations: number
}

export type ArticleStatus = 'published' | 'in-press' | 'corrected' | 'retracted'

/**
 * The portal's article record. This is also the normalised target shape of the
 * OJS harvest (see src/lib/ojs/harvest.ts) — anything the harvester cannot fill
 * is optional so a partially populated record still renders.
 */
export type Article = {
  id: string
  slug: string
  journalSlug: string
  type: ArticleType
  status: ArticleStatus
  title: string
  authors: ArticleAuthor[]
  affiliations: Affiliation[]
  abstract: string
  highlights?: string[]
  keywords: string[]
  doi: string
  volume: number
  issue: number
  pages?: string
  /** ISO 8601. Formatted for display at render time, never stored pre-formatted. */
  publishedIso: string
  receivedIso?: string
  revisedIso?: string
  acceptedIso?: string
  access: 'Open access'
  licence: string
  graphicalAbstract?: ArticleFigure
  body?: ArticleSection[]
  references?: ArticleReference[]
  declarations?: ArticleDeclarations
  supplementary?: SupplementaryFile[]
  metrics?: ArticleMetrics
  pdfHref?: string
  /** Populated for retracted or corrected records. */
  notice?: { kind: 'retraction' | 'correction'; date: string; reason: string; href?: string }
}

/* -------------------------------------------------------------------------- */
/* Issues                                                                     */
/* -------------------------------------------------------------------------- */

export type IssueSection = {
  name: string
  articleIds: string[]
}

export type Issue = {
  journalSlug: string
  volume: number
  number: number
  year: number
  title?: string
  publishedIso?: string
  sections: IssueSection[]
  current?: boolean
  /** OJS's issue id, so a link OJS emits (`/issue/view/<id>`) can be resolved to a portal page. */
  ojsId?: number
}

/* -------------------------------------------------------------------------- */
/* Calls for papers, news                                                     */
/* -------------------------------------------------------------------------- */

export type CfpStatus = 'Open' | 'Closing soon' | 'Closed'

export type CallForPapers = {
  id: string
  journalSlug: string
  theme: string
  /** ISO 8601. Status and days-remaining are derived, never stored. */
  deadlineIso: string
  guestEditor?: string
  description?: string
  specialIssue?: boolean
}

export type NewsItem = {
  slug: string
  dateIso: string
  type: 'Announcement' | 'Infrastructure' | 'Editorial' | 'Call for papers'
  title: string
  journalSlug?: string
  body?: string[]
}

/* -------------------------------------------------------------------------- */
/* Journal insights                                                           */
/* -------------------------------------------------------------------------- */

export type JournalInsights = {
  /** Days from submission to first decision. */
  firstDecisionDays?: number
  submissionToAcceptanceDays?: number
  acceptanceToOnlineDays?: number
  acceptanceRatePct?: number
  articlesPublished?: number
  downloads12m?: number
}

/* -------------------------------------------------------------------------- */
/* Editorial board                                                            */
/* -------------------------------------------------------------------------- */

export type BoardMember = {
  name: string
  role: string
  affiliation: string
  country?: string
  orcid?: string
}

/* -------------------------------------------------------------------------- */
/* Author-facing workflow (portal-owned; OJS is the system of record)         */
/* -------------------------------------------------------------------------- */

export type SubmissionStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under review'
  | 'Revisions requested'
  | 'Accepted'
  | 'In production'
  | 'Published'
  | 'Rejected'
  | 'Withdrawn'

export type SubmissionTimelineEvent = {
  label: string
  dateIso?: string
  state: 'done' | 'current' | 'pending' | 'failed'
  note?: string
}

export type Submission = {
  id: string
  journalSlug: string
  type: ArticleType
  title: string
  status: SubmissionStatus
  submittedIso?: string
  updatedIso: string
  coauthors: string[]
  nextAction?: string
  /** 0-based index into the timeline; -1 for a draft that was never submitted. */
  stage: number
  draftStep?: number
  decisionLetter?: {
    dateIso: string
    summary: string
    body: string[]
    reviews: { reviewer: string; recommendation: string; comments: string[] }[]
  }
}

export type ReviewInvitation = {
  id: string
  journalSlug: string
  title: string
  type: ArticleType
  invitedBy: string
  invitedIso: string
  respondByIso: string
  dueIso: string
  status: 'pending' | 'accepted' | 'declined' | 'submitted'
  abstract?: string
}

/* -------------------------------------------------------------------------- */
/* Book and proceedings series                                                */
/* -------------------------------------------------------------------------- */

export type SeriesKind = 'book' | 'proceedings'

export type Series = {
  slug: string
  code: string
  title: string
  kind: SeriesKind
  subjectKey: SubjectKey
  /** One-paragraph description used on cards and in meta descriptions. */
  scope: string
  /** Topic list from the aims and scope, shown on cards and the series home page. */
  topics: string[]
  /** Null until the ISSN registration completes. */
  issn: string | null
  profile: PublicationProfile
  pages: JournalPage[]
  /**
   * Volumes announced by the publisher, kept in the content layer so they show
   * without a database. Volumes created in Admin → Book volumes are listed
   * alongside them; on a slug clash the admin volume wins.
   */
  volumes?: SeriesVolume[]
}

/** `biography` is a list of paragraphs. */
export type VolumeEditor = { name: string; affiliation: string; biography?: string[] }

/** A volume announced in a series' data file (see `Series.volumes`). */
export type SeriesVolume = {
  /** URL segment under /series/<series>/volumes/. Never change it once live. */
  slug: string
  number: number
  title: string
  /** Free text, such as "December 2026". Shown until `publishedDate` is set. */
  expectedDate: string
  /** Free text, such as "12 December 2026"; null while the volume is forthcoming. */
  publishedDate: string | null
  /** Bare DOI such as "10.63521/…"; null shows "To be assigned". */
  doi: string | null
  /** Null shows "To be assigned". */
  isbn: string | null
  /** Portrait cover under /public. Without one the series cover stands in. Use a new filename to replace it (nginx caches images forever). */
  cover?: string
  pages: number | null
  editors: VolumeEditor[]
  /** Paragraphs of the book description; empty until the publisher supplies it. */
  description: string[]
  /** "The many academic areas covered … include:" plus its topic list. */
  coverage?: { intro: string; topics: string[] }
  keywords?: string[]
  /** Table of contents (chapter titles); empty shows "Coming soon" once a description exists. */
  contents: string[]
  /** Who the book is for; null until supplied. */
  readership: string | null
}
