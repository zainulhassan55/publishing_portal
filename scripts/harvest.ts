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
 * Two passes, because the two OJS read paths fail in different ways:
 *
 *   1. OAI-PMH inventory — needs no credentials and is authoritative on *what
 *      exists*. This is the oracle: if OAI lists N published records, N is the
 *      truth, whatever the API says.
 *   2. REST enrichment — needs an API key and is authoritative on *detail*.
 *      OAI's Dublin Core would lose the affiliations, ORCIDs and CRediT roles
 *      the article page and the Scholar citation tags need.
 *
 * The run fails only when the two **disagree** — OAI says records exist and the
 * API returned fewer. That is the real partial-harvest signal. Previously any
 * HTTP failure was fatal, which meant a missing or unusable API key took the
 * whole deploy down (scripts/deploy.sh runs this before `next build` under
 * `set -e`), even though an unauthenticated OJS is a configuration state and
 * not a reason to refuse to publish the site.
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadLocalEnv } from './env.ts'
import { ojsContext, portalSlug } from '../src/lib/ojs/contexts.ts'

loadLocalEnv()

const here = dirname(fileURLToPath(import.meta.url))

// HARVEST_PATH is how the server keeps one snapshot across releases: the cron
// writes it there and every release reads it (src/lib/ojs/harvest-cache.ts
// resolves the same variable). Unset, it is the repo's content/harvest.json,
// which is what the build reads.
const configuredPath = process.env.HARVEST_PATH
const outPath = configuredPath
  ? isAbsolute(configuredPath)
    ? configuredPath
    : join(process.cwd(), configuredPath)
  : join(here, '..', 'content', 'harvest.json')

/**
 * Writes the snapshot atomically: to a sibling temp file, then a rename, which
 * on POSIX replaces the old file in one step. The server reads this file on a
 * timer while this script may be writing it; a plain write would let a render
 * land on a half-written file.
 */
function writeSnapshot(data: { articles: unknown[]; issues: unknown[] }) {
  mkdirSync(dirname(outPath), { recursive: true })
  const tmp = `${outPath}.tmp`
  writeFileSync(tmp, `${JSON.stringify({ harvestedAt: new Date().toISOString(), ...data }, null, 2)}\n`)
  renameSync(tmp, outPath)
}

/** How many articles the snapshot on disk already holds, for the guards below. */
function existingArticleCount(): number {
  if (!existsSync(outPath)) return 0
  try {
    const parsed = JSON.parse(readFileSync(outPath, 'utf8')) as { articles?: unknown[] }
    return Array.isArray(parsed.articles) ? parsed.articles.length : 0
  } catch {
    return 0
  }
}

const baseUrl = (process.env.OJS_BASE_URL || '').replace(/\/$/, '')
const apiKey = process.env.OJS_API_KEY || ''

/**
 * Portal slugs. Articles and issues are stored under these; OJS is asked by
 * each title's OJS path, which differs for renamed titles (ijic → ticr).
 */
const JOURNAL_SLUGS = ['ijdh', 'ijdm', 'ijds', 'ijei', 'ijic', 'ijis', 'ijmc', 'ijmr', 'ijqt', 'ijse', 'jqcs', 'jaise', 'sst', 'reta']

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

/** Set once the API answers 401/403, so 20 journals log one diagnosis, not 20. */
let apiUnauthorised = false

async function ojsGet<T>(context: string, path: string): Promise<T | null> {
  const url = `${baseUrl}/index.php/${context}/api/v1${path}`
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json', ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}) },
    })
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) apiUnauthorised = true
      else console.warn(`  ${context}${path} → HTTP ${response.status}`)
      return null
    }
    return (await response.json()) as T
  } catch (error) {
    console.warn(`  ${context}${path} → ${error instanceof Error ? error.message : 'failed'}`)
    return null
  }
}

/**
 * OAI-PMH inventory: how many published records OJS says each journal has.
 *
 * Credential-free, so this works even when the REST API is locked out, and it
 * is what turns "the API returned nothing" into a decidable question — no
 * records at all, or records the API would not hand over.
 *
 * Returns null if OAI itself is unreachable, which is the one case where
 * nothing can be concluded.
 */
async function oaiInventory(): Promise<Map<string, number> | null> {
  const counts = new Map<string, number>(JOURNAL_SLUGS.map((slug) => [slug, 0]))
  let resumptionToken: string | null = null
  let pages = 0

  do {
    const url = resumptionToken
      ? `${baseUrl}/index.php/index/oai?verb=ListIdentifiers&resumptionToken=${encodeURIComponent(resumptionToken)}`
      : `${baseUrl}/index.php/index/oai?verb=ListIdentifiers&metadataPrefix=oai_dc`

    let xml: string
    try {
      const response = await fetch(url, { headers: { Accept: 'application/xml' } })
      xml = await response.text()
    } catch (error) {
      console.warn(`  OAI inventory → ${error instanceof Error ? error.message : 'failed'}`)
      return null
    }

    // An empty repository is a valid answer, not an error.
    if (/<error code="noRecordsMatch"/.test(xml)) return counts

    if (/<error code=/.test(xml)) {
      console.warn(`  OAI inventory → ${xml.match(/<error code="([^"]*)"/)?.[1] ?? 'error'}`)
      return null
    }

    // Each <header> carries one <setSpec> per journal (plus section-level
    // setSpecs like `ijdh:ART`, which the slug check below ignores).
    for (const header of xml.match(/<header[^>]*>[\s\S]*?<\/header>/g) ?? []) {
      if (/status="deleted"/.test(header)) continue
      for (const spec of header.match(/<setSpec>([^<]*)<\/setSpec>/g) ?? []) {
        const slug = portalSlug(spec.replace(/<\/?setSpec>/g, ''))
        if (counts.has(slug)) counts.set(slug, (counts.get(slug) ?? 0) + 1)
      }
    }

    resumptionToken = xml.match(/<resumptionToken[^>]*>([^<]+)<\/resumptionToken>/)?.[1] ?? null
    pages += 1
  } while (resumptionToken && pages < 100)

  return counts
}

type OjsAuthor = {
  id?: number
  givenName?: Localised
  familyName?: Localised
  /** OJS ≤ 3.4: one free-text affiliation. */
  affiliation?: Localised
  /** OJS 3.5: structured affiliations, optionally ROR-matched. */
  affiliations?: { name?: Localised; ror?: string | null }[]
  orcid?: string | null
  email?: string
  country?: string
  /** OJS ≤ 3.4; 3.5 moved this to `publication.primaryContactId`. */
  primaryContact?: boolean
}

type OjsPublication = {
  id?: number
  title?: Localised
  abstract?: Localised
  /** OJS ≤ 3.4: `{ en: ['a', 'b'] }`; 3.5: `{ en: [{ name: 'a' }, …] }`. */
  keywords?: Record<string, (string | { name?: string })[]>
  primaryContactId?: number
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
  writeSnapshot({ articles: [], issues: [] })
  process.exit(0)
}

const articles: Record<string, unknown>[] = []
const issues: Record<string, unknown>[] = []

// Pass 1: what OJS says exists, before asking for any detail.
console.log('taking the OAI inventory…')
const inventory = await oaiInventory()
const expectedTotal = inventory ? [...inventory.values()].reduce((sum, n) => sum + n, 0) : null

if (inventory) {
  console.log(`  OAI reports ${expectedTotal} published record(s) across ${JOURNAL_SLUGS.length} journal(s)\n`)
} else if (existingArticleCount() > 0) {
  // On a cron this is the dangerous case: OJS unreachable, the REST pass about
  // to return nothing, and a snapshot of zero articles about to replace a good
  // one — the whole site would go empty until OJS came back. Leave the file
  // alone and let the next run try again.
  console.error('  OAI inventory unavailable and a non-empty snapshot already exists — leaving it untouched.')
  process.exit(1)
} else {
  console.log('  OAI inventory unavailable — cannot verify completeness this run\n')
}

// Pass 2: detail for each record, from the REST API.
for (const slug of JOURNAL_SLUGS) {
  console.log(`harvesting ${slug}…`)

  const issueResult = await ojsGet<{ items?: OjsIssue[] }>(ojsContext(slug), '/issues?count=100')

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
      ojsId: issue.id,
      sections: [],
    })
  }

  // status 3 is STATUS_PUBLISHED in OJS; anything else is not public.
  const submissionResult = await ojsGet<{ items?: OjsSubmission[] }>(ojsContext(slug), '/submissions?status=3&count=100')
  if (submissionResult === null) continue

  for (const submission of submissionResult.items ?? []) {
    const summary =
      submission.publications?.find((p) => p.id === submission.currentPublicationId) ?? submission.publications?.[0]
    if (!summary?.id) continue

    // The list endpoint returns a SUMMARY publication: title and dates, but no
    // authors, no galleys and no issue. Found the hard way on 2026-10-14, when
    // the first real paper reached the site with no author, no PDF and volume
    // 1 instead of 12. The full record is one more request per paper.
    const publication =
      (await ojsGet<OjsPublication>(ojsContext(slug), `/submissions/${submission.id}/publications/${summary.id}`)) ?? summary

    const title = text(publication.title)
    if (!title) continue

    const affiliations = new Map<string, { id: string; name: string; ror?: string; country?: string }>()
    const authors = (publication.authors ?? []).map((author, index) => {
      const name = [text(author.givenName), text(author.familyName)].filter(Boolean).join(' ')
      const affiliationIds: string[] = []

      // 3.5 gives a structured list; 3.4 gave one string. Read whichever is
      // present so an OJS upgrade in either direction does not blank the
      // affiliations.
      const named = (author.affiliations ?? [])
        .map((a) => ({ name: text(a.name), ror: a.ror || undefined }))
        .filter((a) => a.name)
      const legacy = text(author.affiliation)
      const entries = named.length > 0 ? named : legacy ? [{ name: legacy, ror: undefined }] : []

      for (const entry of entries) {
        const existing = [...affiliations.values()].find((a) => a.name === entry.name)
        const id = existing?.id ?? `af${affiliations.size + 1}`
        if (!existing) affiliations.set(id, { id, name: entry.name, ror: entry.ror, country: author.country })
        affiliationIds.push(id)
      }

      const corresponding =
        author.primaryContact ||
        (publication.primaryContactId !== undefined && author.id !== undefined && author.id === publication.primaryContactId)

      return {
        name: name || `Author ${index + 1}`,
        affiliationIds,
        orcid: author.orcid?.replace(/^https?:\/\/orcid\.org\//, '') || undefined,
        corresponding: corresponding || undefined,
      }
    })

    const keywords = (publication.keywords?.en ?? [])
      .map((k) => (typeof k === 'string' ? k : (k?.name ?? '')))
      .filter(Boolean)

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
      keywords,
      doi: publication.pub_id_doi ?? '',
      volume: issue?.volume ?? 1,
      issue: Number(issue?.number ?? 1),
      pages: publication.pages || undefined,
      publishedIso: published,
      receivedIso: submission.dateSubmitted?.slice(0, 10),
      access: 'Open access',
      licence: 'CC BY 4.0',
      // `urlPublished` is OJS's galley *page* (HTML wrapping its own viewer).
      // The file itself is the same path under /download/, which is what a
      // PDF link, Google Scholar's citation_pdf_url and the portal's inline
      // viewer all need.
      pdfHref: publication.galleys
        ?.find((g) => /pdf/i.test(g.label ?? ''))
        ?.urlPublished?.replace('/article/view/', '/article/download/'),
    })
  }
}

if (apiUnauthorised) {
  console.warn('\nThe OJS REST API rejected this run as unauthorised.')
  console.warn(
    apiKey
      ? '  OJS_API_KEY is set but was refused. Check the key, and that api_key_secret'
      : '  OJS_API_KEY is not set. Generate one for a service user, and check that api_key_secret',
  )
  console.warn('  is configured in config.inc.php — without it OJS cannot validate any token.')
  console.warn('  Run `npm run spike` for a precise diagnosis.')
}

// A partial harvest must not silently become the published site: a journal that
// errored would look like a journal with no articles. But "incomplete" is only
// decidable against the OAI inventory — counting HTTP failures made a missing
// API key fatal to the deploy, which is a configuration state, not a reason to
// refuse to publish.
//
// Checked BEFORE writing. This used to write first and exit 1 afterwards, which
// was fine under the deploy's `set -e` and wrong on a cron, where nothing reads
// the exit code and the half-harvest would simply have become the site.
if (expectedTotal !== null && articles.length < expectedTotal) {
  console.error(`\nOAI reports ${expectedTotal} published record(s) but only ${articles.length} were harvested.`)
  console.error('The snapshot is incomplete — not written.')
  for (const [slug, expected] of inventory ?? []) {
    const got = articles.filter((a) => a.journalSlug === slug).length
    if (got < expected) console.error(`  ${slug}: expected ${expected}, got ${got}`)
  }
  process.exit(1)
}

writeSnapshot({ articles, issues })
console.log(`\nwrote ${articles.length} article(s) and ${issues.length} issue(s) to ${outPath}`)

if (expectedTotal === 0 && articles.length === 0) {
  console.log('\nOJS has no published records yet. An empty snapshot is the correct result;')
  console.log('every listing page renders its launch-state copy from it.')
}
