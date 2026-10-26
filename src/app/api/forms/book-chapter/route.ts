import { clientIp, handler, jsonError, jsonOk, rateLimit, readJson } from '@/lib/api'
import { volumeWithOpenCall } from '@/lib/books/volumes'
import { insert } from '@/lib/db'
import { honeypotTripped, notifyReceived, readFileRefs, readList, reference } from '@/lib/forms/server'
import { attachUploads, verifyUploads } from '@/lib/uploads/service'
import { Validator } from '@/lib/validate'
import { getSeries, seriesSlugs } from '@/data/registry'
import { requireMember, submittedBy } from '@/lib/auth/require'

export const dynamic = 'force-dynamic'

/**
 * Chapter submission to a volume with an open call. The manuscript is
 * anonymised for review, so author details come separately, in the form and on
 * a title page; declarations follow the series' author guidelines.
 */
export const POST = handler(async (request) => {
  const limit = rateLimit(`forms:${clientIp(request)}`, 5, 600_000)
  if (!limit.ok) return jsonError('rate-limited', 429, { retryAfter: limit.retryAfter })

  const member = await requireMember()
  if (member instanceof Response) return member

  const body = await readJson<Record<string, unknown>>(request)
  if (honeypotTripped(body)) return jsonOk({ reference: 'NGIQ-BC-00000' }, 201)

  const v = new Validator()
  const series = v.oneOf('series', body.series, seriesSlugs, 'Book series')
  const volumeSlug = typeof body.volume === 'string' ? body.volume : ''
  const volume = series ? await volumeWithOpenCall(series, volumeSlug) : undefined
  if (series && !volume) return jsonError('closed', 410, { message: 'This volume is not accepting chapter submissions.' })

  const title = v.string({ field: 'title', value: body.title, label: 'Chapter title', required: true, min: 5, max: 400 })
  const abstract = v.string({ field: 'abstract', value: body.abstract, label: 'Abstract', required: true, min: 100, max: 5000 })
  const keywords = v.string({ field: 'keywords', value: body.keywords, label: 'Keywords', required: true, max: 500 })

  const authors = readList(body.authors, 15).map((a, i) => ({
    name: v.string({ field: `authors.${i}.name`, value: a.name, label: 'Author name', required: true, max: 200 }),
    email: v.email(`authors.${i}.email`, a.email, 'Author email'),
    affiliation: v.string({ field: `authors.${i}.affiliation`, value: a.affiliation, label: 'Affiliation', required: true, max: 300 }),
    country: v.string({ field: `authors.${i}.country`, value: a.country, label: 'Country', max: 100 }),
    orcid: v.orcid(`authors.${i}.orcid`, a.orcid),
  }))
  if (authors.length === 0) v.add({ field: 'authors', message: 'Add at least one author' })
  const correspondingIndex = Number(body.corresponding ?? 0)
  const corresponding = authors[Number.isInteger(correspondingIndex) ? correspondingIndex : 0] ?? authors[0]

  const declarations = {
    funding: v.string({ field: 'funding', value: body.funding, label: 'Funding', required: true, max: 2000 }),
    conflicts: v.string({ field: 'conflicts', value: body.conflicts, label: 'Conflicts of interest', required: true, max: 2000 }),
    aiUse: v.string({ field: 'aiUse', value: body.aiUse, label: 'Use of generative AI', required: true, max: 2000 }),
    permissions: v.string({ field: 'permissions', value: body.permissions, label: 'Third-party material', max: 2000 }),
    ethics: v.string({ field: 'ethics', value: body.ethics, label: 'Ethics approval and consent', max: 2000 }),
    dataAvailability: v.string({ field: 'dataAvailability', value: body.dataAvailability, label: 'Data availability', max: 2000 }),
  }
  v.accepted('original', body.original, 'Please confirm the chapter is original and not under consideration elsewhere')
  const refs = readFileRefs(
    body.files,
    [
      { field: 'manuscript', purpose: 'manuscript', label: 'Anonymised manuscript', required: true },
      { field: 'titlePage', purpose: 'title_page', label: 'Title page', required: true },
      { field: 'supporting', purpose: 'supporting', label: 'Supporting files', max: 3 },
    ],
    v,
  )
  v.throwIfInvalid()

  const rows = await verifyUploads(refs)
  const payload = { series, volume: volume!.slug, volumeTitle: volume!.title, title, abstract, keywords, authors, corresponding: corresponding.email, declarations }
  const id = await insert(
    `INSERT INTO book_submissions (kind, series_slug, volume_id, title, corresponding_name, corresponding_email, payload)
     VALUES ('chapter', ?, ?, ?, ?, ?, ?)`,
    [series, volume!.id, title, corresponding.name, corresponding.email, JSON.stringify({ ...payload, submittedBy: submittedBy(member) })],
  )
  const ref = reference('BC', id)
  await attachUploads(rows, 'book_submission', id, `chapters/${ref}`)

  await notifyReceived({
    to: corresponding.email,
    name: corresponding.name,
    ref,
    what: 'chapter submission',
    title,
    ackNote: `Your chapter for “${volume!.title}” will be assessed by the volume editors and sent for independent peer review if suitable.`,
    summary: [
      `Series: ${getSeries(series)?.title ?? series}`,
      `Volume: ${volume!.title}`,
      `Authors: ${authors.map((a) => `${a.name} (${a.affiliation})`).join('; ')}`,
      '',
      abstract,
    ],
  })

  return jsonOk({ reference: ref }, 201)
})
