import type { JournalDetail } from '@/types/content'
import { electronicIssn, issnLabel, printIssn } from '../issn'
import { editorTable, editorialEmail, journalFacts, page, plain } from '../pages'
import { journalTemplates } from '../templates'

/**
 * Introduction, topics and closing requirement supplied by the publisher
 * (October 2026) and reproduced as given. The remaining pages follow TICR's, as
 * the publisher asked. The editorial board is still to be appointed.
 */
const slug = 'jaise'
const title = 'Journal of Agentic AI for Sustainable Energy'

const intro =
  'The Journal of Agentic AI for Sustainable Energy (JAAISE) publishes original research, review articles, and short communications on agentic artificial intelligence, autonomous decision-making, and intelligent control for sustainable energy systems. The journal welcomes theoretical advances and practical applications in multi-agent coordination, renewable energy integration, smart grids, energy storage, and energy management, supported by rigorous analysis and evidence.'

const topics = [
  'Agentic AI architectures for sustainable energy systems',
  'Multi-agent coordination and distributed energy management',
  'Autonomous planning, reasoning and decision-making',
  'Reinforcement learning and adaptive energy control',
  'Generative AI and large language model agents for energy applications',
  'Autonomous microgrids and virtual power plants',
  'Renewable energy integration and intelligent forecasting',
  'Intelligent energy storage and battery management',
  'Electric vehicle charging and vehicle-to-grid coordination',
  'Agent-based demand response and energy trading',
  'Digital twins for autonomous energy systems',
  'Intelligent control of power electronics and converters',
  'Distributed optimisation and resource scheduling',
  'Cybersecurity and privacy in agent-enabled energy networks',
  'Explainability, safety and human oversight in autonomous energy control',
  'Verification, benchmarking and reproducibility of energy AI systems',
  'Energy-efficient agentic AI and lifecycle sustainability assessment',
  'Applications in smart buildings, industry and integrated energy systems',
]

const editors = [
  { name: 'V. P. Meena', affiliation: 'National Institute of Technology Jamshedpur, India' },
  { name: 'Chunjia Han', affiliation: 'Birkbeck, University of London, UK' },
  { name: 'Nadia Nedjah', affiliation: 'State University of Rio de Janeiro, Brazil' },
  { name: 'Muthu Ramachandran', affiliation: 'University of South Africa, & Forti5 Tech Ltd., Leeds, UK' },
  { name: 'Kwok Tai Chui', affiliation: 'Hong Kong Metropolitan University, Hong Kong' },
  { name: 'Chi-Wen Lung', affiliation: 'Asia University, Taiwan' },
  { name: 'Sugam Sharma', affiliation: 'Founder, Iowa State University SUF/eLegalls ai, USA' },
]

export const jaiseDetail: JournalDetail = {
  slug,
  title,
  shortTitle: 'JAAISE',
  tagline: 'Agentic AI, autonomous decision-making, and intelligent control for sustainable energy systems.',
  issn: issnLabel(printIssn(slug)),
  eIssn: issnLabel(electronicIssn(slug)),
  area: 'Agentic AI and Sustainable Energy',
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
    kicker: 'JAAISE · A NextGenIQ Press Journal',
    tile: '/images/journals/tile-jaise.jpg',
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
    page('aims-scope', 'Aims & scope', 'Aims and scope', 'The research areas covered by JAAISE.', [
      {
        title: '',
        paragraphs: [`${intro} Topics include, but are not limited to:`],
        bullets: topics,
        topicList: true,
        closing: [
          'Submissions should demonstrate a substantive connection between agentic AI or autonomous intelligent methods and sustainable energy, supported by rigorous analysis, simulation or experimental evidence.',
        ],
      },
    ]),
    page('editorial-board', 'Editorial board', 'Editorial board', 'The editors of JAAISE.', [
      { title: 'Editors', table: editorTable(editors) },
    ]),
    page('author-guidelines', 'Author guidelines', 'Author guidelines', 'How to prepare a manuscript for JAAISE.', [
      plain([
        'Submissions must be original, written in English, and not under consideration elsewhere. Authors should clearly describe their contribution, methods, results, limitations, and relevant comparisons.',
        'Submit an anonymised manuscript for double-blind review, with author details provided separately. Include funding, conflicts of interest, data availability, relevant ethical approvals, and substantive AI-use disclosures.',
      ]),
      journalTemplates(slug, 'JAAISE'),
    ]),
    page('peer-review-ethics', 'Peer review & ethics', 'Peer review and ethics', 'How JAAISE manuscripts are reviewed.', [
      plain([
        'Suitable manuscripts undergo independent double-blind peer review following editorial screening. Decisions consider originality, technical quality, significance, and clarity.',
        'All contributors must follow NextGenIQ Press publication ethics policies. Conflicts of interest are disclosed, and submissions involving editors are handled independently.',
      ]),
    ]),
    page('open-access-fees', 'Open access & fees', 'Open access and fees', 'Licensing and charges for JAAISE articles.', [
      plain([
        'Articles are freely available under CC BY 4.0, permitting sharing and adaptation with appropriate attribution. Third-party material may carry separate restrictions.',
        'Current charges and waiver arrangements are disclosed on the fees page. Any new or revised APC will be announced at least six months in advance and apply only to subsequent submissions. Editorial decisions are independent of payment.',
      ]),
    ]),
    page('special-issue-guidelines', 'Special issues', 'Special issues', 'Proposing a special issue of JAAISE.', [
      plain([
        'Proposals should include a focused theme, rationale, topics, guest editor biographies, and timeline. Special issue manuscripts follow the journal’s standard review and ethics requirements.',
      ]),
    ]),
    page('contact', 'Contact', 'Contact', 'How to contact JAAISE.', [
      plain([`Email ${editorialEmail}, including JAAISE and your manuscript reference, if available.`]),
    ]),
  ],
}
