import { clientIp, handler, jsonError, jsonOk, rateLimit, readJson } from '@/lib/api'
import { insert } from '@/lib/db'
import { VOLUME_FORMATS, VOLUME_TIMELINES } from '@/lib/forms/options'
import { honeypotTripped, notifyReceived, readFileRefs, readList, reference } from '@/lib/forms/server'
import { attachUploads, verifyUploads } from '@/lib/uploads/service'
import { Validator } from '@/lib/validate'
import { getSeries, seriesSlugs } from '@/data/registry'
import { requireMember, submittedBy } from '@/lib/auth/require'

export const dynamic = 'force-dynamic'

/**
 * Book volume proposal for AIISC or LNMR. Fields follow the publisher's
 * "Propose a Volume" list for each series; LNMR additionally asks for the
 * multidisciplinary focus, and proceedings add the event, programme committee
 * and peer-review arrangements.
 */
export const POST = handler(async (request) => {
  const limit = rateLimit(`forms:${clientIp(request)}`, 5, 600_000)
  if (!limit.ok) return jsonError('rate-limited', 429, { retryAfter: limit.retryAfter })

  const member = await requireMember()
  if (member instanceof Response) return member

  const body = await readJson<Record<string, unknown>>(request)
  if (honeypotTripped(body)) return jsonOk({ reference: 'NGIQ-BP-00000' }, 201)

  const v = new Validator()
  const series = v.oneOf('series', body.series, seriesSlugs, 'Book series')
  const format = v.oneOf('format', body.format, VOLUME_FORMATS.map((f) => f.value), 'Publication format')
  const title = v.string({ field: 'title', value: body.title, label: 'Proposed title', required: true, min: 8, max: 300 })
  const altTitles = v.string({ field: 'altTitles', value: body.altTitles, label: 'Alternative titles', max: 600 })
  const aims = v.string({ field: 'aims', value: body.aims, label: 'Aims', required: true, min: 100, max: 5000 })
  const readership = v.string({ field: 'readership', value: body.readership, label: 'Intended readership', required: true, min: 20, max: 2000 })
  const contribution = v.string({ field: 'contribution', value: body.contribution, label: 'Original contribution', required: true, min: 100, max: 5000 })
  const multidisciplinary = v.string({
    field: 'multidisciplinary',
    value: body.multidisciplinary,
    label: 'Multidisciplinary focus',
    required: series === 'lnmr',
    min: series === 'lnmr' ? 50 : undefined,
    max: 3000,
  })
  const toc = v.string({ field: 'toc', value: body.toc, label: 'Preliminary table of contents', required: true, min: 50, max: 10000 })
  const contributors = v.string({ field: 'contributors', value: body.contributors, label: 'Proposed contributors', max: 4000 })
  const length = v.string({ field: 'length', value: body.length, label: 'Estimated manuscript length', required: true, max: 120 })
  const timeline = v.oneOf('timeline', body.timeline, VOLUME_TIMELINES, 'Submission timeline')

  const editors = readList(body.editors, 8).map((e, i) => ({
    name: v.string({ field: `editors.${i}.name`, value: e.name, label: 'Name', required: true, max: 200 }),
    email: v.email(`editors.${i}.email`, e.email),
    affiliation: v.string({ field: `editors.${i}.affiliation`, value: e.affiliation, label: 'Affiliation', required: true, max: 300 }),
    country: v.string({ field: `editors.${i}.country`, value: e.country, label: 'Country', max: 100 }),
    orcid: v.orcid(`editors.${i}.orcid`, e.orcid),
    bio: v.string({ field: `editors.${i}.bio`, value: e.bio, label: 'Biography', required: true, min: 50, max: 2000 }),
  }))
  if (editors.length === 0) v.add({ field: 'editors', message: 'Add at least one author or editor' })

  const p = (body.proceedings && typeof body.proceedings === 'object' ? body.proceedings : {}) as Record<string, unknown>
  const isProceedings = format === 'proceedings'
  const proceedings = isProceedings
    ? {
        event: v.string({ field: 'proceedings.event', value: p.event, label: 'Event name', required: true, max: 300 }),
        dates: v.string({ field: 'proceedings.dates', value: p.dates, label: 'Event dates', required: true, max: 120 }),
        location: v.string({ field: 'proceedings.location', value: p.location, label: 'Location', required: true, max: 200 }),
        url: v.string({ field: 'proceedings.url', value: p.url, label: 'Event website', max: 500, pattern: /^https?:\/\/\S+$/, patternMessage: 'Event website must start with http:// or https://' }),
        committee: v.string({ field: 'proceedings.committee', value: p.committee, label: 'Programme committee', required: true, min: 30, max: 5000 }),
        review: v.string({ field: 'proceedings.review', value: p.review, label: 'Peer-review arrangements', required: true, min: 50, max: 3000 }),
        expectedPapers: v.string({ field: 'proceedings.expectedPapers', value: p.expectedPapers, label: 'Expected number of papers', max: 60 }),
      }
    : null

  const submitterName = v.string({ field: 'submitterName', value: body.submitterName, label: 'Your name', required: true, max: 200 })
  const submitterEmail = v.email('submitterEmail', body.submitterEmail, 'Your email address')
  v.accepted('ack', body.ack, 'Please confirm you understand that proposal approval does not guarantee acceptance of the completed manuscript')
  const refs = readFileRefs(
    body.files,
    [
      { field: 'cvs', purpose: 'cv', label: 'Author or editor CVs', required: true, max: 8 },
      { field: 'sample', purpose: 'sample_chapter', label: 'Sample chapter', max: 2 },
      { field: 'proposal', purpose: 'proposal', label: 'Full proposal document' },
    ],
    v,
  )
  v.throwIfInvalid()

  const rows = await verifyUploads(refs)
  const payload = {
    series, format, title, altTitles, aims, readership, contribution, multidisciplinary, toc, contributors, length, timeline,
    editors, proceedings, submitterName, submitterEmail,
  }
  const id = await insert(
    `INSERT INTO editorial_proposals (kind, target_slug, title, submitter_name, submitter_email, payload)
     VALUES ('book_volume', ?, ?, ?, ?, ?)`,
    [series, title, submitterName, submitterEmail, JSON.stringify({ ...payload, submittedBy: submittedBy(member) })],
  )
  const ref = reference('BP', id)
  await attachUploads(rows, 'editorial_proposal', id, `proposals/${ref}`)

  const s = getSeries(series)
  await notifyReceived({
    to: submitterEmail,
    name: submitterName,
    ref,
    what: `${s?.code ?? 'book'} volume proposal`,
    title,
    ackNote: 'The Series Editors will assess your proposal and be in touch. Proposal approval does not guarantee acceptance of the completed manuscript.',
    summary: [
      `Series: ${s?.title ?? series}`,
      `Format: ${VOLUME_FORMATS.find((f) => f.value === format)?.label ?? format}`,
      `Authors/editors: ${editors.map((e) => `${e.name} (${e.affiliation})`).join('; ')}`,
      `Length: ${length} · Timeline: ${timeline}`,
      ...(proceedings ? [`Event: ${proceedings.event}, ${proceedings.dates}, ${proceedings.location}`] : []),
      '',
      aims,
    ],
  })

  return jsonOk({ reference: ref }, 201)
})
