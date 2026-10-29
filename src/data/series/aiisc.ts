import type { Series } from '@/types/publishing'
import { editorTable, editorialEmail, page, plain, seriesFacts } from '../pages'
import { seriesTemplates } from '../templates'

/**
 * Text supplied by the publisher (October 2026) and reproduced as given, except
 * the Aims and Scope page, which was rewritten at the site owner's request in
 * the publisher's own terms (same topics, same closing requirement). Edit the
 * wording only on the publisher's instruction.
 */
const intro =
  'Advances in AI, Intelligent Systems and Computing (AIISC) publishes research monographs, edited volumes, and conference proceedings on artificial intelligence, intelligent systems, and advanced computing. The series welcomes theoretical advances, innovative methods, and applications supported by rigorous analysis and evidence.'

const topics = [
  'Machine learning',
  'Generative AI and foundation models',
  'Agentic AI',
  'Computational intelligence and optimisation',
  'Autonomous systems',
  'Explainable and responsible AI',
  'Secure and privacy-preserving AI',
  'Data science and knowledge engineering',
  'Decision support systems',
  'Computer vision and language processing',
  'Multimedia intelligence',
  'Cloud, edge and distributed computing',
  'Quantum and neuromorphic computing',
  'Intelligent IoT and cyber-physical systems',
  'Digital twins',
  'Applications in healthcare, education, industry, transportation and sustainability',
]

const editors = [
  { name: 'Nadia Nedjah', affiliation: 'State University of Rio de Janeiro, Brazil' },
]

const editorsNote =
  'The Series Editor guides the academic direction of the series, assesses proposals, and oversees editorial quality and independent peer review.'

export const aiisc: Series = {
  slug: 'aiisc',
  code: 'AIISC',
  title: 'Advances in AI, Intelligent Systems and Computing',
  kind: 'book',
  subjectKey: 'computing',
  scope: intro,
  topics,
  issn: null,
  profile: {
    kicker: 'AIISC · A NextGenIQ Press Book Series',
    cover: '/images/series/cover-aiisc.jpg',
    tile: '/images/series/tile-aiisc.jpg',
    badges: ['Open access', 'Peer reviewed', 'CC BY 4.0'],
    intro,
    ctas: [
      { label: 'Propose a volume', pageId: 'propose-volume' },
      { label: 'Editorial board', pageId: 'editorial-board' },
      { label: 'Published volumes', pageId: 'volumes' },
    ],
    facts: seriesFacts,
    editorsLabel: 'Series editor',
    editors,
    editorsNote,
  },
  pages: [
    page('aims-scope', 'Aims & scope', 'Aims and scope', 'The research areas covered by AIISC.', [
      {
        title: '',
        lead: 'A book series on artificial intelligence, intelligent systems and advanced computing',
        paragraphs: [
          'Artificial intelligence and advanced computing are moving rapidly from research laboratories into everyday systems, from clinical decision support and smart manufacturing to transport networks and digital public services. This creates a need for authoritative, book-length treatments that consolidate new methods, connect theory with engineering practice, and examine how intelligent systems can be made reliable, efficient and trustworthy.',
          'Advances in AI, Intelligent Systems and Computing (AIISC) is a peer-reviewed, open-access book series that publishes research monographs, edited volumes and conference proceedings on artificial intelligence, intelligent systems and advanced computing. The series connects advances in computational methods with the development of intelligent, reliable and efficient systems, and welcomes theoretical advances, innovative methods and applications supported by rigorous analysis and evidence. Topics include, but are not limited to:',
        ],
        bullets: topics,
        topicList: true,
        closing: ['Each volume should offer a coherent scholarly contribution for researchers, postgraduate students, or practitioners.'],
      },
    ]),
    page('editorial-board', 'Editorial board', 'Editorial board', 'The Series Editor of AIISC.', [
      { title: 'Series editor', table: editorTable(editors), paragraphs: [], closing: [editorsNote] },
    ]),
    page('propose-volume', 'Propose a volume', 'Propose a volume', 'What to include in an AIISC volume proposal.', [
      plain(['Proposals are welcome throughout the year. Please include:'], {
        bullets: [
          'Proposed title, publication format, aims, and intended readership.',
          'Original contribution and preliminary table of contents.',
          'Author or editor biographies and proposed contributors.',
          'Estimated manuscript length and submission timeline.',
          'For proceedings: event details, programme committee, and peer-review arrangements.',
        ],
        closing: [
          `Email ${editorialEmail} with the subject “AIISC Proposal — [Title]”. Proposal approval does not guarantee acceptance of the completed manuscript.`,
        ],
      }),
    ]),
    page(
      'author-editor-guidelines',
      'Author & editor guidelines',
      'Author and Editor Guidelines',
      'Manuscript requirements for AIISC authors and volume editors.',
      [
        plain([
          'Manuscripts must be original, clearly organised, and appropriately referenced. Authors should explain their methods, present supporting evidence, acknowledge limitations, and provide data or code availability information where applicable.',
          'Contributors must disclose funding, conflicts of interest, and substantive use of generative AI, and obtain necessary permissions for third-party material. Volume editors coordinate contributors, maintain thematic coherence, and oversee completion of revisions.',
        ]),
        seriesTemplates('aiisc', 'AIISC'),
      ],
    ),
    page('peer-review-ethics', 'Peer review & ethics', 'Peer review and ethics', 'How AIISC volumes are reviewed.', [
      plain([
        'All volumes undergo editorial assessment and independent peer review. Monographs are assessed as complete works; chapters and proceedings papers are reviewed individually, alongside assessment of the volume’s overall coherence.',
        'Submissions involving an editor’s own work or a conflict of interest are handled independently. All contributions must comply with NextGenIQ Press publication ethics policies.',
      ]),
    ]),
    page('open-access-fees', 'Open access & fees', 'Open access and fees', 'Licensing and charges for AIISC volumes.', [
      plain([
        'Published volumes are freely available online under CC BY 4.0, permitting sharing and adaptation with appropriate attribution. Third-party material may carry separate restrictions.',
        'There is no submission fee. Any publication charges, funding arrangements, or available waivers will be disclosed before a publishing agreement is signed. Editorial decisions are independent of payment.',
      ]),
    ]),
    page('indexing-abstracting', 'Indexing & abstracting', 'Indexing and abstracting', 'Indexing status of AIISC.', [
      plain([
        'AIISC is a new series, and no indexing coverage is currently confirmed. Eligible publications may be submitted to relevant indexing services for independent assessment; inclusion is not guaranteed.',
        'Confirmed coverage will be reported here, specifying whether it applies to the series, individual volumes, or chapters. Publication identifiers will be displayed once assigned.',
      ]),
    ]),
    page('volumes', 'Published volumes', 'Published volumes', 'Volumes published in AIISC.', [
      plain([
        'Published volumes will be listed here as they become available. We currently welcome proposals for monographs, edited collections, and conference proceedings within the series scope.',
      ]),
    ]),
    page('contact', 'Contact', 'Contact', 'How to contact AIISC.', [
      plain([`For proposals and editorial enquiries, contact ${editorialEmail}. Please include AIISC in the subject line.`]),
    ]),
  ],
}
