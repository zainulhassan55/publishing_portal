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

export type ContentBlock = {
  title: string
  paragraphs?: string[]
  bullets?: string[]
  subsections?: {
    title: string
    paragraphs?: string[]
    bullets?: string[]
  }[]
}

export type JournalPage = {
  id: string
  label: string
  title: string
  summary: string
  blocks: ContentBlock[]
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
