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
  issn: string
  area: string
  access: string
  frequency: string
  summary: string
}

export type Article = {
  slug: string
  title: string
  journal: string
  meta: string
  excerpt: string
  authors?: string
}

export type Policy = {
  slug: string
  title: string
  summary: string
}

export type InfoCard = {
  title: string
  summary: string
  meta?: string
  badge?: string
}

export type JournalDetail = {
  slug: string
  title: string
  issn: string
  eIssn: string
  area: string
  access: string
  frequency: string
  scope: string
  metrics: { label: string; value: string }[]
  board: string[]
  quickLinks: string[]
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
}

export type ContactChannel = {
  label: string
  value: string
  note: string
}
