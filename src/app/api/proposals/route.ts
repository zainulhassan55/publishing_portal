import { handler, jsonError, jsonOk, readJson } from '@/lib/api'
import { clientIp, rateLimit } from '@/lib/api'
import { insert } from '@/lib/db'
import { Validator } from '@/lib/validate'
import { subjectList } from '@/data/subjects'
import { sendEditorialEmail, sendTransactionalEmail } from '@/lib/email'
import { requireMember, submittedBy } from '@/lib/auth/require'

export const dynamic = 'force-dynamic'

type Body = {
  title?: string
  subject?: string
  scope?: string
  rationale?: string
  expectedVolume?: string
  eicName?: string
  eicAffiliation?: string
  eicOrcid?: string
  proposerName?: string
  proposerEmail?: string
  agree?: boolean
}

export const POST = handler(async (request) => {
  const limit = rateLimit(`proposals:${clientIp(request)}`, 3, 600_000)
  if (!limit.ok) return jsonError('rate-limited', 429, { retryAfter: limit.retryAfter })

  const member = await requireMember()
  if (member instanceof Response) return member

  const body = await readJson<Body>(request)
  const v = new Validator()

  const title = v.string({ field: 'title', value: body.title, label: 'Proposed journal title', required: true, min: 8, max: 300 })
  const subject = v.oneOf(
    'subject',
    body.subject,
    subjectList.map((s) => s.label),
    'Subject area',
  )
  const scope = v.string({ field: 'scope', value: body.scope, label: 'Scope', required: true, min: 80, max: 4000 })
  const rationale = v.string({ field: 'rationale', value: body.rationale, label: 'Why the journal is needed', max: 4000 })
  const expectedVolume = v.string({ field: 'expectedVolume', value: body.expectedVolume, label: 'Expected annual volume', max: 60 })
  const eicName = v.string({ field: 'eicName', value: body.eicName, label: 'Proposed Editor-in-Chief', max: 200 })
  const eicAffiliation = v.string({ field: 'eicAffiliation', value: body.eicAffiliation, label: 'Affiliation', max: 300 })
  const eicOrcid = body.eicOrcid ? v.orcid('eicOrcid', body.eicOrcid) : ''
  const proposerName = v.string({ field: 'proposerName', value: body.proposerName, label: 'Your name', required: true, max: 200 })
  const proposerEmail = v.email('proposerEmail', body.proposerEmail)
  v.accepted('agree', body.agree, 'You must confirm that the proposal may be shared with the publishing committee')

  v.throwIfInvalid()

  const id = await insert(
    `INSERT INTO journal_proposals
       (title, subject, scope, rationale, expected_volume, eic_name, eic_affiliation, eic_orcid,
        proposer_name, proposer_email, payload)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title,
      subject,
      scope,
      rationale || null,
      expectedVolume || null,
      eicName || null,
      eicAffiliation || null,
      eicOrcid || null,
      proposerName,
      proposerEmail,
      JSON.stringify({ ...body, submittedBy: submittedBy(member) }),
    ],
  )

  const reference = `NGIQ-PROP-${String(id).padStart(5, '0')}`

  // Email is best effort: the proposal is already durably stored, so a mail
  // outage must not make the author think their submission was lost.
  await Promise.allSettled([
    sendTransactionalEmail({
      to: proposerEmail,
      subject: `We have received your journal proposal (${reference})`,
      lines: [
        `Dear ${proposerName},`,
        `Thank you for proposing “${title}”.`,
        `Your reference is ${reference}. We acknowledge proposals within five working days, and the publishing committee reviews them quarterly.`,
        'We will be in touch once the scope and overlap review is complete.',
      ],
    }),
    sendEditorialEmail({
      subject: `Journal proposal ${reference}: ${title}`,
      lines: [
        `Subject area: ${subject}`,
        `Proposer: ${proposerName} <${proposerEmail}>`,
        eicName ? `Proposed EiC: ${eicName}${eicAffiliation ? `, ${eicAffiliation}` : ''}` : 'No EiC proposed',
        '',
        scope,
      ],
    }),
  ])

  return jsonOk({ reference }, 201)
})
