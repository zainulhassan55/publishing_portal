import type { JournalDetail } from '@/types/content'
import { electronicIssn, issnLabel, printIssn } from '../issn'
import { boardPending, editorialEmail, journalFacts, page, plain } from '../pages'
import { journalTemplates } from '../templates'

/**
 * Introduction and topics supplied by the publisher (October 2026) and
 * reproduced as given. The remaining pages follow IJIC's, as the publisher
 * asked. The editorial board is still to be appointed.
 */
const slug = 'jqcs'
const title = 'Journal of Quantum Computing and Security'

const intro =
  'The Journal of Quantum Computing and Security (JQCS) publishes original research, review articles, and short communications on quantum computing, quantum information technologies, and security in the quantum era. The journal welcomes theoretical advances and practical applications in quantum algorithms, systems, cryptography, and post-quantum security, supported by rigorous analysis and evidence.'

const topics = [
  'Quantum computing and algorithms',
  'Quantum information theory',
  'Quantum architectures and hardware',
  'Quantum programming and software engineering',
  'Quantum error correction and fault tolerance',
  'Quantum simulation and optimisation',
  'Hybrid quantum–classical computing',
  'Quantum machine learning and artificial intelligence',
  'Quantum cryptography and key distribution',
  'Quantum communications and networks',
  'Post-quantum cryptography and cryptanalysis',
  'Cryptographic agility and quantum-safe migration',
  'Security of quantum computing platforms',
  'Privacy-preserving quantum computation',
  'Verification, benchmarking and reproducibility',
  'Applications of quantum computing in science, engineering and cybersecurity',
]

export const jqcsDetail: JournalDetail = {
  slug,
  title,
  shortTitle: 'JQCS',
  tagline: 'Quantum computing, quantum information technologies, and security in the quantum era.',
  issn: issnLabel(printIssn(slug)),
  eIssn: issnLabel(electronicIssn(slug)),
  area: 'Quantum Computing and Security',
  access: 'Open Access',
  frequency: 'Continuous publication',
  publisher: 'NextGenIQ Press',
  editor: 'Editors',
  reviewType: 'Double-blind peer review',
  license: 'CC BY 4.0',
  scope: intro,
  overview: [intro],
  metrics: [],
  board: [],
  topics,
  quickLinks: [],
  profile: {
    kicker: 'JQCS · A NextGenIQ Press Journal',
    badges: ['Open access', 'Double-blind peer review', 'Continuous publication'],
    intro,
    ctas: [
      { label: 'Submit a manuscript', pageId: 'submit' },
      { label: 'Editorial board', pageId: 'editorial-board' },
      { label: 'Author guidelines', pageId: 'author-guidelines' },
    ],
    facts: journalFacts(electronicIssn(slug)),
    editorsLabel: 'Editors',
    editors: [],
    editorsNote: 'The editorial board is being appointed.',
  },
  pages: [
    page('aims-scope', 'Aims & scope', 'Aims and scope', 'The research areas covered by JQCS.', [
      {
        title: '',
        paragraphs: [`${intro} Topics include, but are not limited to:`],
        bullets: topics,
        topicList: true,
      },
    ]),
    page('editorial-board', 'Editorial board', 'Editorial board', 'The editors of JQCS.', [plain([boardPending('JQCS')])]),
    page('author-guidelines', 'Author guidelines', 'Author guidelines', 'How to prepare a manuscript for JQCS.', [
      plain([
        'Submissions must be original, written in English, and not under consideration elsewhere. Authors should clearly describe their contribution, methods, results, limitations, and relevant comparisons.',
        'Submit an anonymised manuscript for double-blind review, with author details provided separately. Include funding, conflicts of interest, data availability, relevant ethical approvals, and substantive AI-use disclosures.',
      ]),
      journalTemplates(slug, 'JQCS'),
    ]),
    page('peer-review-ethics', 'Peer review & ethics', 'Peer review and ethics', 'How JQCS manuscripts are reviewed.', [
      plain([
        'Suitable manuscripts undergo independent double-blind peer review following editorial screening. Decisions consider originality, technical quality, significance, and clarity.',
        'All contributors must follow NextGenIQ Press publication ethics policies. Conflicts of interest are disclosed, and submissions involving editors are handled independently.',
      ]),
    ]),
    page('open-access-fees', 'Open access & fees', 'Open access and fees', 'Licensing and charges for JQCS articles.', [
      plain([
        'Articles are freely available under CC BY 4.0, permitting sharing and adaptation with appropriate attribution. Third-party material may carry separate restrictions.',
        'Current charges and waiver arrangements are disclosed on the fees page. Any new or revised APC will be announced at least six months in advance and apply only to subsequent submissions. Editorial decisions are independent of payment.',
      ]),
    ]),
    page('special-issue-guidelines', 'Special issues', 'Special issues', 'Proposing a special issue of JQCS.', [
      plain([
        'Proposals should include a focused theme, rationale, topics, guest editor biographies, and timeline. Special issue manuscripts follow the journal’s standard review and ethics requirements.',
      ]),
    ]),
    page('contact', 'Contact', 'Contact', 'How to contact JQCS.', [
      plain([`Email ${editorialEmail}, including JQCS and your manuscript reference, if available.`]),
    ]),
  ],
}
