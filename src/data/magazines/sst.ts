import type { JournalDetail } from '@/types/content'
import { electronicIssn, issnLabel, printIssn } from '../issn'
import { editorTable, editorialEmail, journalFacts, page, plain } from '../pages'
import { magazineTemplates } from '../templates'

/**
 * Introduction and topics supplied by the publisher (October 2026) and
 * reproduced as given. The publisher asked for magazine-style limits modelled
 * on IEEE magazines (short articles, limited results and equations); the limits
 * below are the site's proposal and await the publisher's confirmation. They
 * are also printed in the templates (scripts/templates/build.ts), so change
 * both together. The editorial board is still to be appointed.
 */
const slug = 'sst'
const title = 'Digital Trust & Cyber Resilience Magazine'

const intro =
  'Digital Trust & Cyber Resilience (DTCR) Magazine publishes technical features, review articles, tutorials, case studies and expert perspectives on cybersecurity, system safety and trustworthy digital technologies. The magazine welcomes research insights and practical experiences in artificial intelligence, autonomous systems, privacy, resilience and technology assurance, presented in accessible language and supported by credible evidence.'

const topics = [
  'Cybersecurity and cyber resilience',
  'Safety engineering and dependable systems',
  'Trustworthy, explainable and responsible AI',
  'Security and safety of generative and agentic AI',
  'Autonomous systems, robotics and human oversight',
  'Privacy engineering and personal data protection',
  'Digital identity, authentication and access management',
  'Secure software development and software supply chains',
  'Cloud, edge and distributed-system security',
  'IoT, industrial IoT and embedded-system security',
  'Cyber-physical systems and critical infrastructure protection',
  'Quantum security and post-quantum migration',
  'Deepfakes, misinformation and digital authenticity',
  'Human factors, usable security and security awareness',
  'Risk assessment, incident response and recovery',
  'Verification, validation and technology assurance',
  'Technology governance, standards and accountability',
  'Security, safety and trust in healthcare, energy, transportation and industry',
]

const editors = [
  { name: 'Shingo Yamaguchi', affiliation: 'Yamaguchi University, Japan' },
  { name: 'Gregorio Martinez Perez', affiliation: 'University of Murcia (UMU), Spain' },
  { name: 'Nitin Auluck', affiliation: 'Indian Institute of Technology Ropar, India' },
  { name: 'Brij B. Gupta', affiliation: 'Asia University, Taiwan' },
  { name: 'Ayan Mondal', affiliation: 'Indian Institute of Technology Indore, India' },
  { name: 'Arcangelo Castiglione', affiliation: 'University of Salerno, Fisciano, Salerno, Italy' },
  { name: 'Sumana Maiti', affiliation: 'Indian Institute of Technology Bhubaneswar, India' },
]

export const sstDetail: JournalDetail = {
  slug,
  kind: 'magazine',
  title,
  shortTitle: 'DTCR',
  tagline: 'Cybersecurity, system safety and trustworthy digital technologies, in accessible language.',
  issn: issnLabel(printIssn(slug)),
  eIssn: issnLabel(electronicIssn(slug)),
  area: 'Security, Safety and Trust',
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
    kicker: 'DTCR · A NextGenIQ Press Magazine',
    tile: '/images/covers/sst.jpg',
    badges: ['Open access', 'Double-blind peer review', 'Continuous publication'],
    intro,
    ctas: [
      { label: 'Submit an article', pageId: 'submit' },
      { label: 'Editorial board', pageId: 'editorial-board' },
      { label: 'Author guidelines', pageId: 'author-guidelines' },
    ],
    facts: journalFacts(electronicIssn(slug)),
    editorsLabel: 'Editors',
    editors,
  },
  pages: [
    page('aims-scope', 'Aims & scope', 'Aims and scope', 'The topics covered by DTCR Magazine.', [
      {
        title: '',
        paragraphs: [`${intro} Topics include, but are not limited to:`],
        bullets: topics,
        topicList: true,
      },
    ]),
    page('editorial-board', 'Editorial board', 'Editorial board', 'The editors of DTCR Magazine.', [
      { title: 'Editors', table: editorTable(editors) },
    ]),
    page('author-guidelines', 'Author guidelines', 'Author guidelines', 'How to prepare an article for DTCR Magazine.', [
      plain([
        'DTCR Magazine articles are short, readable and written for a broad technical audience: researchers, engineers, practitioners and decision-makers working outside the author’s own specialism. An article should explain an idea, its significance and its open problems, rather than report every detail of a study. Full derivations, proofs and extended experimental results belong in a journal article.',
      ]),
      {
        title: 'Article types',
        table: {
          head: ['Type', 'What it offers', 'Length'],
          rows: [
            ['Technical feature', 'A new idea, system or result explained for non-specialists, with its significance and open challenges', 'Up to 5 pages'],
            ['Review article', 'A concise survey of a topic: the state of the art, the main approaches compared, and what remains open', 'Up to 5 pages'],
            ['Tutorial', 'A step-by-step introduction to a technique, standard or tool, with a worked example', 'Up to 5 pages'],
            ['Case study', 'Practical experience from a deployment, incident or programme, with lessons others can apply', 'Up to 5 pages'],
            ['Expert perspective', 'An informed, evidence-based view on an emerging issue, trend or policy question', 'Up to 3 pages'],
          ],
        },
      },
      {
        title: 'Length and content limits',
        paragraphs: ['Manuscripts that exceed these limits are returned to the authors before review.'],
        bullets: [
          'No more than 5 pages in the DTCR Magazine template, including figures, tables and references: about 4,500 words of main text. Expert perspectives: no more than 3 pages, about 2,500 words.',
          'An abstract of no more than 150 words, without citations or equations.',
          'No more than 6 figures and tables combined. Use figures to explain ideas, such as architectures, workflows and comparisons, rather than to reproduce raw data.',
          'Limited results: present only the key results that support the article’s message, usually in one or two figures or a single table. Parameter sweeps, ablations and long result tables belong in a journal article.',
          'Equations kept to a minimum: no more than 3 displayed equations, and only where they are essential. Explain each idea in words first.',
          'No more than 15 references, preferably recent and peer-reviewed.',
          'No appendices or supplementary material.',
          'A biography of no more than 75 words for each author, given on the separate title page.',
        ],
      },
      {
        title: 'Writing for a magazine readership',
        bullets: [
          'Open with the problem and why it matters now, before any technical detail.',
          'Define every acronym at first use and avoid specialist jargon.',
          'Follow the template’s numbered sections: Introduction, Background, Approach, Results, Discussion and Conclusion.',
          'Put background that specialists can skip in a sidebar: a boxed text of no more than 300 words.',
          'Close with the open challenges and what practitioners or researchers should do next.',
        ],
      },
      {
        title: 'Submission requirements',
        paragraphs: [
          'Submissions must be original, written in English, and not under consideration elsewhere. Submit an anonymised manuscript for double-blind review, with author details and biographies on the separate title page. Include funding, conflicts of interest, data availability where relevant, ethical approvals, and substantive AI-use disclosures.',
        ],
      },
      magazineTemplates(slug, 'DTCR'),
    ]),
    page('peer-review-ethics', 'Peer review & ethics', 'Peer review and ethics', 'How DTCR Magazine articles are reviewed.', [
      plain([
        'Suitable manuscripts undergo independent double-blind peer review following editorial screening, which includes a check against the magazine’s length and content limits. Decisions consider originality, technical soundness, significance, and clarity for a broad readership.',
        'All contributors must follow NextGenIQ Press publication ethics policies. Conflicts of interest are disclosed, and submissions involving editors are handled independently.',
      ]),
    ]),
    page('open-access-fees', 'Open access & fees', 'Open access and fees', 'Licensing and charges for DTCR Magazine articles.', [
      plain([
        'Articles are freely available under CC BY 4.0, permitting sharing and adaptation with appropriate attribution. Third-party material may carry separate restrictions.',
        'Current charges and waiver arrangements are disclosed on the fees page. Any new or revised APC will be announced at least six months in advance and apply only to subsequent submissions. Editorial decisions are independent of payment.',
      ]),
    ]),
    page('special-issue-guidelines', 'Special issues', 'Special issues', 'Proposing a special issue of DTCR Magazine.', [
      plain([
        'Proposals should include a focused theme, rationale, topics, guest editor biographies, and timeline. Special issue articles follow the magazine’s standard length limits, review and ethics requirements.',
      ]),
    ]),
    page('contact', 'Contact', 'Contact', 'How to contact DTCR Magazine.', [
      plain([`Email ${editorialEmail}, including DTCR and your manuscript reference, if available.`]),
    ]),
  ],
}
