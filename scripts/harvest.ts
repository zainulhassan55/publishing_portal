/**
 * Harvests published content from OJS into content/harvest.json.
 *
 * OJS is the system of record; the portal renders a read model. This script is
 * the only thing that crosses that boundary, and it only ever reads.
 *
 * Run it in CI before `next build`, and on a cron after that so an article
 * published in OJS reaches the site without a developer. The snapshot is
 * disposable: deleting it loses nothing that a re-run cannot rebuild.
 *
 *   OJS_BASE_URL=https://www.nextgeniqpress.com/ojs OJS_API_KEY=… npm run harvest
 *
 * Reads go through the REST API with an admin-scoped key rather than OAI-PMH
 * because the API returns the full galley, author and section detail the
 * article page needs; OAI-PMH Dublin Core would lose the affiliations, ORCIDs
 * and CRediT roles.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const outPath = join(here, '..', 'content', 'harvest.json')

const baseUrl = (process.env.OJS_BASE_URL || '').replace(/\/$/, '')
const apiKey = process.env.OJS_API_KEY || ''

const JOURNAL_SLUGS = ['ijdh', 'ijdm', 'ijds', 'ijei', 'ijic', 'ijis', 'ijmc', 'ijmr', 'ijqt', 'ijse']

type Localised = Record<string, string> | string | undefined

const text = (value: Localised): string => {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value.en ?? Object.values(value)[0] ?? ''
}

const slugify = (title: string) =>
  title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80)

async function ojsGet<T>(context: string, path: string): Promise<T | null> {
  const url = `${baseUrl}/index.php/${context}/api/v1${path}`
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json', ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}) },
    })
    if (!response.ok) {
      console.warn(`  ${context}${path} → HTTP ${response.status}`)
      return null
    }
    return (await response.json()) as T
  } catch (error) {
    console.warn(`  ${context}${path} → ${error instanceof Error ? error.message : 'failed'}`)
    return null
  }
}

type OjsAuthor = {
  givenName?: Localised
  familyName?: Localised
  affiliation?: Localised
  orcid?: string
  email?: string
  country?: string
  primaryContact?: boolean
}

type OjsPublication = {
  id?: number
  title?: Localised
  abstract?: Localised
  keywords?: Record<string, string[]>
  pub_id_doi?: string
  pages?: string
  datePublished?: string
  authors?: OjsAuthor[]
  sectionId?: number
  issueId?: number
  galleys?: { urlPublished?: string; label?: string }[]
}

type OjsSubmission = {
  id: number
  status?: number
  dateSubmitted?: string
  publications?: OjsPublication[]
  currentPublicationId?: number
}

type OjsIssue = {
  id: number
  volume?: number
  number?: string | number
  year?: number
  title?: Localised
  datePublished?: string
  isCurrent?: boolean
}

if (!baseUrl) {
  console.log('OJS_BASE_URL is not set — writing an empty snapshot.')
  console.log('This is the expected state before the first article is published; every')
  console.log('listing page renders its launch-state copy from it.')
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, `${JSON.stringify({ harvestedAt: new Date().toISOString(), articles: [], issues: [] }, null, 2)}\n`)
  process.exit(0)
}

const articles: Record<string, unknown>[] = []
const issues: Record<string, unknown>[] = []
let failures = 0

for (const slug of JOURNAL_SLUGS) {
  console.log(`harvesting ${slug}…`)

  const issueResult = await ojsGet<{ items?: OjsIssue[] }>(slug, '/issues?count=100')
  if (issueResult === null) failures += 1

  const issueById = new Map<number, OjsIssue>()
  for (const issue of issueResult?.items ?? []) {
    issueById.set(issue.id, issue)
    issues.push({
      journalSlug: slug,
      volume: issue.volume ?? 1,
      number: Number(issue.number ?? 1),
      year: issue.year ?? new Date(issue.datePublished ?? Date.now()).getUTCFullYear(),
      title: text(issue.title) || undefined,
      publishedIso: issue.datePublished?.slice(0, 10),
      current: Boolean(issue.isCurrent),
      sections: [],
    })
  }

  // status 3 is STATUS_PUBLISHED in OJS; anything else is not public.
  const submissionResult = await ojsGet<{ items?: OjsSubmission[] }>(slug, '/submissions?status=3&count=100')
  if (submissionResult === null) {
    failures += 1
    continue
  }

  for (const submission of submissionResult.items ?? []) {
    const publication =
      submission.publications?.find((p) => p.id === submission.currentPublicationId) ?? submission.publications?.[0]
    if (!publication) continue

    const title = text(publication.title)
    if (!title) continue

    const affiliations = new Map<string, { id: string; name: string; country?: string }>()
    const authors = (publication.authors ?? []).map((author, index) => {
      const name = [text(author.givenName), text(author.familyName)].filter(Boolean).join(' ')
      const affiliationName = text(author.affiliation)
      const affiliationIds: string[] = []

      if (affiliationName) {
        const existing = [...affiliations.values()].find((a) => a.name === affiliationName)
        const id = existing?.id ?? `af${affiliations.size + 1}`
        if (!existing) affiliations.set(id, { id, name: affiliationName, country: author.country })
        affiliationIds.push(id)
      }

      return {
        name: name || `Author ${index + 1}`,
        affiliationIds,
        orcid: author.orcid?.replace(/^https?:\/\/orcid\.org\//, '') || undefined,
        corresponding: author.primaryContact || undefined,
      }
    })

    const issue = publication.issueId ? issueById.get(publication.issueId) : undefined
    const published = publication.datePublished?.slice(0, 10) ?? issue?.datePublished?.slice(0, 10)
    if (!published) continue

    articles.push({
      id: `ojs-${submission.id}`,
      slug: slugify(title),
      journalSlug: slug,
      // OJS section names do not map cleanly onto the portal's article types,
      // so a Research Article default is applied and corrected per journal
      // section mapping once the sections are configured in OJS.
      type: 'Research Article',
      status: 'published',
      title,
      authors,
      affiliations: [...affiliations.values()],
      abstract: text(publication.abstract).replace(/<[^>]+>/g, '').trim(),
      keywords: publication.keywords?.en ?? [],
      doi: publication.pub_id_doi ?? '',
      volume: issue?.volume ?? 1,
      issue: Number(issue?.number ?? 1),
      pages: publication.pages || undefined,
      publishedIso: published,
      receivedIso: submission.dateSubmitted?.slice(0, 10),
      access: 'Open access',
      licence: 'CC BY 4.0',
      pdfHref: publication.galleys?.find((g) => /pdf/i.test(g.label ?? ''))?.urlPublished,
    })
  }
}

mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(
  outPath,
  `${JSON.stringify({ harvestedAt: new Date().toISOString(), articles, issues }, null, 2)}\n`,
)

console.log(`\nwrote ${articles.length} article(s) and ${issues.length} issue(s) to content/harvest.json`)

// A partial harvest must not silently become the published site: a journal that
// errored would look like a journal with no articles.
if (failures > 0) {
  console.error(`\n${failures} OJS request(s) failed. The snapshot is incomplete — do not deploy it.`)
  process.exit(1)
}
