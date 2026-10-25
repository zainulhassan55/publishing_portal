export type NavItem = {
  label: string
  path: string
}

export type HeroMetric = {
  value: string
  label: string
}

export type Journal = {
  slug: string
  title: string
  shortTitle?: string
  issn: string
  area: string
  access: string
  frequency: string
  summary: string
  editor?: string
  reviewType?: string
}

export type Article = {
  slug: string
  title: string
  journal: string
  meta: string
  excerpt: string
  authors?: string
  type?: string
  doi?: string
}

export type Policy = {
  slug: string
  title: string
  summary: string
  sections: { title: string; body: string }[]
}

export type InfoCard = {
  title: string
  summary: string
  meta?: string
  badge?: string
}

export type ServiceItem = {
  title: string
  summary: string
}

export type ValueItem = {
  number: string
  title: string
  summary: string
}

export type ContentTable = {
  head: string[]
  rows: string[][]
  caption?: string
}

export type ContentBlock = {
  /** An empty title renders the block without a heading and keeps it out of the page's table of contents. */
  title: string
  /** A one-line tagline shown above the paragraphs, as on an aims and scope page. */
  lead?: string
  paragraphs?: string[]
  bullets?: string[]
  /** Renders the bullets as a topic list in columns rather than a running list. */
  topicList?: boolean
  /** Paragraphs that follow the bullet list, such as a closing note after a topic list. */
  closing?: string[]
  table?: ContentTable
  subsections?: {
    title: string
    paragraphs?: string[]
    bullets?: string[]
    table?: ContentTable
  }[]
}

/** A titled section of a publisher-wide page, with an anchor id and optional follow-on links. */
export type PublisherSection = ContentBlock & {
  id: string
  links?: { label: string; href: string }[]
}

export type JournalPage = {
  id: string
  label: string
  title: string
  summary: string
  blocks: ContentBlock[]
}

export type JournalMenuItem =
  | { kind: 'page'; id: string }
  | { kind: 'submit'; label: string }
  | { kind: 'archive'; label: string }
  | { kind: 'link'; label: string; href: string }

export type JournalMenuGroup = {
  label: string
  items: JournalMenuItem[]
}

export type Editor = {
  name: string
  affiliation: string
}

/**
 * The publisher-supplied front matter of a journal or book series: the lines
 * above the fold on its home page, and its named editors. Kept separate from the
 * pages so the masthead, home page and editorial-board page read one source.
 */
export type PublicationProfile = {
  /** "IJIC · A NextGenIQ Press Journal" */
  kicker: string
  /**
   * Cover banner under /public (987 × 392, the title set in the artwork), shown
   * uncropped on cards and in the masthead. A title without one gets a lettered tile.
   */
  cover?: string
  /** Portrait (3:4) crop of the cover's artwork, without the title text, for the small cover on cards. */
  tile?: string
  /** "Open access", "Double-blind peer review", … */
  badges: string[]
  /** The introductory paragraph under the title. */
  intro: string
  /** Calls to action under the introduction, each pointing at one of the publication's pages. */
  ctas: { label: string; pageId: string }[]
  /** Facts shown in the strip under the masthead. Only verifiable facts belong here. */
  facts: { label: string; value: string }[]
  editorsLabel: string
  editors: Editor[]
  editorsNote?: string
}

export type JournalDetail = {
  slug: string
  title: string
  shortTitle?: string
  tagline?: string
  issn: string
  eIssn: string
  area: string
  access: string
  frequency: string
  scope: string
  /** Paragraphs for the overview "Research focus" box; falls back to `scope`. */
  overview?: string[]
  editor: string
  reviewType: string
  license: string
  publisher?: string
  ownership?: string
  metrics: { label: string; value: string }[]
  board: string[]
  topics: string[]
  quickLinks: string[]
  pages?: JournalPage[]
  profile: PublicationProfile
}

export type IssueArchive = {
  journalSlug: string
  volume: string
  issue: string
  year: string
  highlight: string
}

export type ArticleDetail = {
  slug: string
  title: string
  authors: string[]
  journal: string
  doi: string
  published: string
  volumeIssue: string
  abstract: string
  keywords: string[]
  type?: string
}

export type ContactChannel = {
  label: string
  value: string
  note: string
}

export type BookSeries = {
  slug: string
  title: string
  shortTitle?: string
  issn: string
  area: string
  access: string
  frequency: string
  summary: string
  reviewType?: string
}

export type BookSeriesDetail = {
  slug: string
  title: string
  shortTitle?: string
  tagline?: string
  issn: string
  eIssn: string
  area: string
  access: string
  frequency: string
  scope: string
  editor: string
  reviewType: string
  license: string
  publisher?: string
  metrics: { label: string; value: string }[]
  board: string[]
  topics: string[]
  quickLinks: string[]
  pages?: JournalPage[]
}
