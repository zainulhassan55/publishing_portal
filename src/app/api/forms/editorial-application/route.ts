import { clientIp, handler, jsonError, jsonOk, rateLimit, readJson } from '@/lib/api'
import { insert } from '@/lib/db'
import { APPLICATION_ROLES, DEGREES } from '@/lib/forms/options'
import { honeypotTripped, notifyReceived, readFileRefs, reference } from '@/lib/forms/server'
import { attachUploads, verifyUploads } from '@/lib/uploads/service'
import { Validator } from '@/lib/validate'
import { getJournal, getSeries, journalSlugs, seriesSlugs } from '@/data/registry'

export const dynamic = 'force-dynamic'

/** Become a reviewer, or apply to join an editorial board, for one journal or book series. */
export const POST = handler(async (request) => {
  const limit = rateLimit(`forms:${clientIp(request)}`, 5, 600_000)
  if (!limit.ok) return jsonError('rate-limited', 429, { retryAfter: limit.retryAfter })

  const body = await readJson<Record<string, unknown>>(request)
  if (honeypotTripped(body)) return jsonOk({ reference: 'NGIQ-ED-00000' }, 201)

  const v = new Validator()
  const role = v.oneOf('role', body.role, APPLICATION_ROLES.map((r) => r.value), 'Role')
  const target = v.oneOf('target', body.target, [...journalSlugs, ...seriesSlugs], 'Journal or book series')
  const name = v.string({ field: 'name', value: body.name, label: 'Full name', required: true, max: 200 })
  const email = v.email('email', body.email)
  const affiliation = v.string({ field: 'affiliation', value: body.affiliation, label: 'Affiliation', required: true, max: 300 })
  const country = v.string({ field: 'country', value: body.country, label: 'Country', required: true, max: 100 })
  const orcid = v.orcid('orcid', body.orcid, 'ORCID iD', true)
  const degree = v.oneOf('degree', body.degree, DEGREES, 'Highest degree')
  const expertise = v.string({ field: 'expertise', value: body.expertise, label: 'Areas of expertise', required: true, min: 20, max: 1500 })
  const profile = v.string({ field: 'profile', value: body.profile, label: 'Brief academic profile', required: true, min: 50, max: 3000 })
  const motivation = v.string({ field: 'motivation', value: body.motivation, label: 'Why you are applying', max: 2000 })
  const boards = v.string({ field: 'boards', value: body.boards, label: 'Current editorial roles', max: 1500 })
  const profileUrl = v.string({ field: 'profileUrl', value: body.profileUrl, label: 'Profile link', max: 500, pattern: /^https?:\/\/\S+$/, patternMessage: 'Profile link must start with http:// or https://' })
  v.accepted('consent', body.consent, 'Please confirm that we may store your details to assess your application')
  const refs = readFileRefs(body.files, [{ field: 'cv', purpose: 'cv', label: 'CV', required: true }], v)
  v.throwIfInvalid()

  const rows = await verifyUploads(refs)
  const payload = { role, target, name, email, affiliation, country, orcid, degree, expertise, profile, motivation, boards, profileUrl }
  const id = await insert(
    `INSERT INTO editorial_applications (role, target_slug, name, email, orcid, payload) VALUES (?, ?, ?, ?, ?, ?)`,
    [role, target, name, email, orcid, JSON.stringify(payload)],
  )
  const ref = reference('ED', id)
  await attachUploads(rows, 'editorial_application', id, `applications/${ref}`)

  const titleOf = getJournal(target)?.title ?? getSeries(target)?.title ?? target
  const roleLabel = APPLICATION_ROLES.find((r) => r.value === role)?.label ?? role
  await notifyReceived({
    to: email,
    name,
    ref,
    what: role === 'reviewer' ? 'reviewer application' : 'editorial board application',
    title: `${roleLabel}, ${titleOf}`,
    summary: [`Role: ${roleLabel}`, `Title: ${titleOf}`, `Affiliation: ${affiliation}, ${country}`, `ORCID: ${orcid}`, '', expertise],
  })

  return jsonOk({ reference: ref }, 201)
})
