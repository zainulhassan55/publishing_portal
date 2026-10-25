import { clientIp, handler, jsonError, jsonOk, rateLimit, readJson } from '@/lib/api'
import { insert } from '@/lib/db'
import { honeypotTripped, notifyReceived, readFileRefs, readList, reference } from '@/lib/forms/server'
import { attachUploads, verifyUploads } from '@/lib/uploads/service'
import { Validator } from '@/lib/validate'
import { getJournal, journalSlugs } from '@/data/registry'

export const dynamic = 'force-dynamic'

/**
 * Special issue proposal. Fields follow the publisher's Special Issue
 * Guidelines: target journal, title, aims, scope and topics; guest editors with
 * affiliations, expertise and biographies; timeline, anticipated submissions
 * and promotion plan.
 */
export const POST = handler(async (request) => {
  const limit = rateLimit(`forms:${clientIp(request)}`, 5, 600_000)
  if (!limit.ok) return jsonError('rate-limited', 429, { retryAfter: limit.retryAfter })

  const body = await readJson<Record<string, unknown>>(request)
  if (honeypotTripped(body)) return jsonOk({ reference: 'NGIQ-SI-00000' }, 201)

  const v = new Validator()
  const journal = v.oneOf('journal', body.journal, journalSlugs, 'Target journal')
  const title = v.string({ field: 'title', value: body.title, label: 'Proposed title', required: true, min: 8, max: 300 })
  const aims = v.string({ field: 'aims', value: body.aims, label: 'Aims and scope', required: true, min: 100, max: 5000 })
  const topics = v.string({ field: 'topics', value: body.topics, label: 'Topics of interest', required: true, min: 20, max: 3000 })
  const rationale = v.string({ field: 'rationale', value: body.rationale, label: 'Why this topic now', max: 3000 })

  const editors = readList(body.guestEditors, 6).map((e, i) => ({
    name: v.string({ field: `guestEditors.${i}.name`, value: e.name, label: 'Guest editor name', required: true, max: 200 }),
    email: v.email(`guestEditors.${i}.email`, e.email, 'Guest editor email'),
    affiliation: v.string({ field: `guestEditors.${i}.affiliation`, value: e.affiliation, label: 'Affiliation', required: true, max: 300 }),
    country: v.string({ field: `guestEditors.${i}.country`, value: e.country, label: 'Country', max: 100 }),
    orcid: v.orcid(`guestEditors.${i}.orcid`, e.orcid),
    expertise: v.string({ field: `guestEditors.${i}.expertise`, value: e.expertise, label: 'Areas of expertise', required: true, max: 1000 }),
    bio: v.string({ field: `guestEditors.${i}.bio`, value: e.bio, label: 'Brief biography', required: true, min: 50, max: 2000 }),
  }))
  if (editors.length === 0) v.add({ field: 'guestEditors', message: 'Add at least one guest editor' })

  const timeline = v.string({ field: 'timeline', value: body.timeline, label: 'Proposed timeline', required: true, min: 20, max: 2000 })
  const expected = v.string({ field: 'expected', value: body.expected, label: 'Anticipated number of submissions', required: true, max: 60 })
  const promotion = v.string({ field: 'promotion', value: body.promotion, label: 'Promotion plan', required: true, min: 30, max: 3000 })
  const conflicts = v.string({ field: 'conflicts', value: body.conflicts, label: 'Conflicts of interest', max: 2000 })
  const submitterName = v.string({ field: 'submitterName', value: body.submitterName, label: 'Your name', required: true, max: 200 })
  const submitterEmail = v.email('submitterEmail', body.submitterEmail, 'Your email address')
  v.accepted('guidelines', body.guidelines, 'Please confirm you have read the Special Issue Guidelines')
  const refs = readFileRefs(
    body.files,
    [
      { field: 'cvs', purpose: 'cv', label: 'Guest editor CVs', max: 6 },
      { field: 'proposal', purpose: 'proposal', label: 'Proposal document' },
    ],
    v,
  )
  v.throwIfInvalid()

  const rows = await verifyUploads(refs)
  const payload = { journal, title, aims, topics, rationale, guestEditors: editors, timeline, expected, promotion, conflicts, submitterName, submitterEmail }
  const id = await insert(
    `INSERT INTO editorial_proposals (kind, target_slug, title, submitter_name, submitter_email, payload)
     VALUES ('special_issue', ?, ?, ?, ?, ?)`,
    [journal, title, submitterName, submitterEmail, JSON.stringify(payload)],
  )
  const ref = reference('SI', id)
  await attachUploads(rows, 'editorial_proposal', id, `proposals/${ref}`)

  await notifyReceived({
    to: submitterEmail,
    name: submitterName,
    ref,
    what: 'special issue proposal',
    title,
    ackNote: 'Proposals are subject to editorial approval. We will contact you once the journal’s editors have assessed it.',
    summary: [
      `Journal: ${getJournal(journal)?.title ?? journal}`,
      `Guest editors: ${editors.map((e) => `${e.name} (${e.affiliation})`).join('; ')}`,
      `Anticipated submissions: ${expected}`,
      '',
      aims,
    ],
  })

  return jsonOk({ reference: ref }, 201)
})
