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
const slug = 'ijic'
const title = 'International Journal of Intelligent Computing'

const intro =
  'The International Journal of Intelligent Computing (IJIC) publishes original research, review articles, and short communications on artificial intelligence, computational methods, and intelligent systems. The journal welcomes theoretical advances and practical applications supported by rigorous analysis and evidence.'

const topics = [
  'Machine learning',
  'Generative AI',
  'Agentic AI and multi-agent systems',
  'Computational intelligence and optimisation',
  'Autonomous systems',
  'Data science and knowledge engineering',
  'Decision support systems',
  'Computer vision',
  'Natural language processing',
  'Multimedia intelligence',
  'Cloud, edge and distributed computing',
  'Neuromorphic computing',
  'Explainable and responsible AI',
  'Secure and privacy-preserving AI',
  'Applications in healthcare and education',
  'Applications in industry, transportation and sustainability',
]

const editors = [
  { name: 'Amiya Nayak', affiliation: 'University of Ottawa, Canada' },
  { name: 'Jinsong Wu', affiliation: 'University of Chile, Chile' },
  { name: 'Brij B. Gupta', affiliation: 'Asia University, Taiwan' },
  { name: 'Kwok Tai Chui', affiliation: 'Hong Kong Metropolitan University, Hong Kong' },
  { name: 'Bharat S. Rawal', affiliation: 'Grambling State University, Grambling, LA, USA' },
  { name: 'Priyanka Chaurasia', affiliation: 'University of Ulster, UK' },
  { name: 'Marjan Kuchaki Rafsanjani', affiliation: 'Shahid Bahonar University of Kerman, Kerman, Iran' },
]

export const ijicDetail: JournalDetail = {
  slug,
  title,
  shortTitle: 'IJIC',
  tagline: 'Artificial intelligence, computational methods, and intelligent systems.',
  issn: issnLabel(printIssn(slug)),
  eIssn: issnLabel(electronicIssn(slug)),
  area: 'Intelligent Computing',
  access: 'Open Access',
  frequency: 'Continuous publication',
  publisher: 'NextGenIQ Press',
  editor: 'Editors',
  reviewType: 'Double-blind peer review',
  license: 'CC BY 4.0',
  scope: intro,
  overview: [intro],
  metrics: [],
  board: editors.map((e) => `${e.name}, ${e.affiliation}`),
  topics,
  quickLinks: [],
  profile: {
    kicker: 'IJIC · A NextGenIQ Press Journal',
    cover: '/images/journals/cover-ijic.jpg',
    tile: '/images/journals/tile-ijic.jpg',
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
  },
  pages: [
    page('aims-scope', 'Aims & scope', 'Aims and scope', 'The research areas covered by IJIC.', [
      {
        title: '',
        lead: 'The international journal for research on artificial intelligence, computational methods and intelligent systems',
        paragraphs: [
          'Intelligent computing has become a foundation of modern science, industry and public services. Learning systems, autonomous agents and data-driven decision support now shape how organisations diagnose disease, manage infrastructure, teach, trade and govern. As these systems grow more capable and more widely deployed, research is needed not only on new algorithms and architectures, but on their reliability, efficiency, transparency and security in real-world settings.',
          'The International Journal of Intelligent Computing (IJIC) is a peer-reviewed, open-access journal that publishes original research, review articles and short communications on artificial intelligence, computational methods and intelligent systems. The journal welcomes theoretical advances and practical applications supported by rigorous analysis and evidence. Topics include, but are not limited to:',
        ],
        bullets: topics,
        topicList: true,
        closing: ['Submissions should demonstrate a clear contribution to intelligent computing beyond routine application of existing methods.'],
      },
    ]),
    page('editorial-board', 'Editorial board', 'Editorial board', 'The editors of IJIC.', [
      { title: 'Editors', table: editorTable(editors) },
    ]),
    page('author-guidelines', 'Author guidelines', 'Author guidelines', 'How to prepare a manuscript for IJIC.', [
      plain([
        'Submissions must be original, written in English, and not under consideration elsewhere. Authors should clearly describe their contribution, methods, results, limitations, and relevant comparisons.',
        'Submit an anonymised manuscript for double-blind review, with author details provided separately. Include funding, conflicts of interest, data availability, relevant ethical approvals, and substantive AI-use disclosures.',
      ]),
      journalTemplates(slug, 'IJIC'),
    ]),
    page('peer-review-ethics', 'Peer review & ethics', 'Peer review and ethics', 'How IJIC manuscripts are reviewed.', [
      plain([
        'Suitable manuscripts undergo independent double-blind peer review following editorial screening. Decisions consider originality, technical quality, significance, and clarity.',
        'All contributors must follow NextGenIQ Press publication ethics policies. Conflicts of interest are disclosed, and submissions involving editors are handled independently.',
      ]),
    ]),
    page('open-access-fees', 'Open access & fees', 'Open access and fees', 'Licensing and charges for IJIC articles.', [
      plain([
        'Articles are freely available under CC BY 4.0, permitting sharing and adaptation with appropriate attribution. Third-party material may carry separate restrictions.',
        'Current charges and waiver arrangements are disclosed on the fees page. Any new or revised APC will be announced at least six months in advance and apply only to subsequent submissions. Editorial decisions are independent of payment.',
      ]),
    ]),
    page('special-issue-guidelines', 'Special issues', 'Special issues', 'Proposing a special issue of IJIC.', [
      plain([
        'Proposals should include a focused theme, rationale, topics, guest editor biographies, and timeline. Special issue manuscripts follow the journal’s standard review and ethics requirements.',
      ]),
    ]),
    page('contact', 'Contact', 'Contact', 'How to contact IJIC.', [
      plain([`Email ${editorialEmail}, including IJIC and your manuscript reference, if available.`]),
    ]),
  ],
}
