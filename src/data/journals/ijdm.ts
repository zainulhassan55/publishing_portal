import type { JournalDetail } from '@/types/content'
import { electronicIssn, issnLabel, printIssn } from '../issn'
import { editorTable, editorialEmail, journalFacts, page, plain } from '../pages'
import { journalTemplates } from '../templates'

/**
 * Text supplied by the publisher (October 2026) and reproduced as given, except
 * the Aims and Scope page, which was rewritten at the site owner's request in
 * the publisher's own terms (same topics, same closing requirement). Edit the
 * wording only on the publisher's instruction.
 */
const slug = 'ijdm'
const title = 'Journal of Digital Management and Intelligent Enterprises'

const intro =
  'The Journal of Digital Management and Intelligent Enterprises (JDMIE) publishes research on how digital technologies transform organisations, management practices, and business performance. The journal welcomes original research, review articles, conceptual papers, and rigorous case studies connecting scholarly insights with managerial practice.'

const topics = [
  'Digital transformation and organisational change',
  'Digital business strategy',
  'AI and business analytics',
  'Managerial decision-making',
  'Digital leadership and workforce development',
  'Human–AI collaboration',
  'Digital platforms and business model innovation',
  'Digital entrepreneurship',
  'Intelligent operations and supply chains',
  'Process automation',
  'Digital marketing and customer experience',
  'Service management',
  'Knowledge management and data governance',
  'Cybersecurity and digital trust',
  'Sustainable digital innovation',
  'Public-sector transformation and inclusion',
]

const honoraryEditorInChief = { name: 'Prof. Eldon Y. Li', affiliation: 'National Chung Cheng University, Taiwan' }

const editors = [
  { name: 'Tzu-Chuen Lu', affiliation: 'National Chin-Yi University of Technology, Taichung, Taiwan' },
  { name: 'Vijayan Sugumaran', affiliation: 'Oakland University, Rochester, USA' },
  { name: 'Shin-Hung Pan', affiliation: 'Chaoyang University of Technology, Taiwan' },
  { name: 'Yi-Hui Chen', affiliation: 'Chang Gung University, Taoyuan City, Taiwan' },
  { name: 'Ramakrishnan Raman', affiliation: 'Symbiosis International (Deemed University), Pune, India' },
  { name: 'Priyanka C. Bhatt', affiliation: 'Yuan Ze University, Taiwan' },
]

export const ijdmDetail: JournalDetail = {
  slug,
  title,
  shortTitle: 'JDMIE',
  tagline: 'How digital technologies transform organisations, management practices, and business performance.',
  issn: issnLabel(printIssn(slug)),
  eIssn: issnLabel(electronicIssn(slug)),
  area: 'Digital Management',
  access: 'Open Access',
  frequency: 'Continuous publication',
  publisher: 'NextGenIQ Press',
  editor: 'Editors',
  reviewType: 'Double-blind peer review',
  license: 'CC BY 4.0',
  scope: intro,
  overview: [intro],
  metrics: [],
  board: [honoraryEditorInChief, ...editors].map((e) => `${e.name}, ${e.affiliation}`),
  topics,
  quickLinks: [],
  profile: {
    kicker: 'JDMIE · A NextGenIQ Press Journal',
    cover: '/images/journals/cover-ijdm.svg',
    tile: '/images/covers/ijdm.jpg',
    badges: ['Open access', 'Double-blind peer review', 'Continuous publication'],
    intro,
    ctas: [
      { label: 'Submit a manuscript', pageId: 'submit' },
      { label: 'Editorial board', pageId: 'editorial-board' },
      { label: 'Author guidelines', pageId: 'author-guidelines' },
    ],
    facts: journalFacts(electronicIssn(slug)),
    editorsLabel: 'Editors',
    editors,
    editorsNote: `Honorary Editor-in-Chief: ${honoraryEditorInChief.name}, ${honoraryEditorInChief.affiliation}.`,
  },
  pages: [
    page('aims-scope', 'Aims & scope', 'Aims and scope', 'The research areas covered by JDMIE.', [
      {
        title: '',
        lead: 'The international journal for research on digital technologies, organisations and management practice',
        paragraphs: [
          'Digital technologies are changing how organisations are led, structured and run. Artificial intelligence, analytics, platforms and automation are reshaping strategy, operations, marketing and work itself, while raising new questions of governance, trust, skills and inclusion. Understanding these changes, and managing them well, requires research that connects technological developments with sound management theory and evidence from practice.',
          'The Journal of Digital Management and Intelligent Enterprises (JDMIE) is a peer-reviewed, open-access journal that publishes research on how digital technologies transform organisations, management practices and business performance. The journal welcomes original research, review articles, conceptual papers and rigorous case studies connecting scholarly insights with managerial practice. Topics include, but are not limited to:',
        ],
        bullets: topics,
        topicList: true,
        closing: ['Submissions should demonstrate a clear managerial or organisational contribution supported by sound theory, methods, or evidence.'],
      },
    ]),
    page('editorial-board', 'Editorial board', 'Editorial board', 'The editors of JDMIE.', [
      { title: 'Honorary Editor-in-Chief', table: editorTable([honoraryEditorInChief]) },
      { title: 'Editors', table: editorTable(editors) },
    ]),
    page('author-guidelines', 'Author guidelines', 'Author guidelines', 'How to prepare a manuscript for JDMIE.', [
      plain([
        'Submissions must be original, written in English, and not under consideration elsewhere. Authors should clearly explain the research question, contribution, analytical approach, findings, limitations, and implications for management.',
        'Submit an anonymised manuscript for double-blind review, with author details provided separately. Include funding, conflicts of interest, data availability, relevant ethical approvals, and substantive AI-use disclosures.',
      ]),
      journalTemplates(slug, 'JDMIE'),
    ]),
    page('peer-review-ethics', 'Peer review & ethics', 'Peer review and ethics', 'How JDMIE manuscripts are reviewed.', [
      plain([
        'Suitable manuscripts undergo independent double-blind peer review following editorial screening. Decisions consider originality, theoretical grounding, methodological quality, clarity, and practical significance.',
        'All contributors must follow NextGenIQ Press publication ethics policies. Conflicts of interest are disclosed, and submissions involving editors are handled independently. Authors must protect participants’ privacy and confidential organisational information.',
      ]),
    ]),
    page('open-access-fees', 'Open access & fees', 'Open access and fees', 'Licensing and charges for JDMIE articles.', [
      plain([
        'Articles are freely available under CC BY 4.0, permitting sharing and adaptation with appropriate attribution. Third-party material may carry separate restrictions.',
        'Current charges and waiver arrangements are disclosed on the fees page. Any new or revised APC will be announced at least six months before taking effect and will apply only to manuscripts submitted on or after the effective date. Editorial decisions are independent of payment.',
      ]),
    ]),
    page('special-issue-guidelines', 'Special issues', 'Special issues', 'Proposing a special issue of JDMIE.', [
      plain([
        'JDMIE welcomes proposals on focused and emerging topics in digital management. Proposals should include the theme, rationale, topics, guest editor biographies, and timeline. All submissions follow the journal’s standard review and ethics requirements.',
      ]),
    ]),
    page('contact', 'Contact', 'Contact', 'How to contact JDMIE.', [
      plain([`Email ${editorialEmail}, including JDMIE and your manuscript reference, if available.`]),
    ]),
  ],
}
