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
  'Lecture Notes in Multidisciplinary Research (LNMR) publishes research monographs, edited volumes, and conference proceedings that connect perspectives across disciplines. The series welcomes original research, methodological advances, and critical syntheses addressing scientific, technological, and societal challenges.'

const topics = [
  'Artificial intelligence and society',
  'Digital transformation',
  'Healthcare technologies',
  'Public health and wellbeing',
  'Education and learning technologies',
  'Skills development',
  'Business innovation and entrepreneurship',
  'Digital economies',
  'Sustainability and environmental research',
  'Resilient infrastructure',
  'Technology policy and governance',
  'Ethics and inclusion',
  'Digital humanities',
  'Communication and social research',
  'Research methods and open science',
  'Interdisciplinary collaboration',
]

const editors = [
  { name: 'Kwok Tai Chui', affiliation: 'Hong Kong Metropolitan University, Hong Kong' },
]

const editorsNote =
  'The Series Editor guides the academic direction of the series, evaluates proposals, and oversees editorial quality and independent peer review.'

export const lnmr: Series = {
  slug: 'lnmr',
  code: 'LNMR',
  title: 'Lecture Notes in Multidisciplinary Research',
  kind: 'book',
  subjectKey: 'interdisciplinary',
  scope: intro,
  topics,
  issn: null,
  profile: {
    kicker: 'LNMR · A NextGenIQ Press Book Series',
    cover: '/images/series/cover-lnmr.jpg',
    tile: '/images/series/tile-lnmr.jpg',
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
    page('aims-scope', 'Aims & scope', 'Aims and scope', 'The research areas covered by LNMR.', [
      {
        title: '',
        lead: 'A book series connecting perspectives across disciplines',
        paragraphs: [
          'Many of today’s most pressing scientific, technological and societal challenges, from public health and sustainability to the social effects of artificial intelligence, cannot be understood from within a single discipline. Progress depends on research that brings methods, evidence and ideas from different fields together around a shared problem.',
          'Lecture Notes in Multidisciplinary Research (LNMR) is a peer-reviewed, open-access book series that publishes research monographs, edited volumes and conference proceedings connecting perspectives across disciplines. LNMR brings together scholarship from computing, engineering, health, education, business, the humanities and the social sciences, and welcomes original research, methodological advances and critical syntheses. Contributions should demonstrate how multiple disciplinary perspectives advance understanding of a shared research problem. Topics include, but are not limited to:',
        ],
        bullets: topics,
        topicList: true,
        closing: ['Each volume should have a coherent theme, a clearly defined readership, and a substantive scholarly contribution.'],
      },
    ]),
    page('editorial-board', 'Editorial board', 'Editorial board', 'The Series Editor of LNMR.', [
      { title: 'Series editor', table: editorTable(editors), paragraphs: [], closing: [editorsNote] },
    ]),
    page('propose-volume', 'Propose a volume', 'Propose a volume', 'What to include in an LNMR volume proposal.', [
      plain(['Proposals are welcome throughout the year. Please include:'], {
        bullets: [
          'Proposed title, publication format, aims, and intended readership.',
          'Scholarly contribution and explanation of the multidisciplinary focus.',
          'Preliminary table of contents and estimated manuscript length.',
          'Author or editor biographies and proposed contributors.',
          'Manuscript preparation and submission timeline.',
          'For proceedings: event details, programme committee, and peer-review arrangements.',
        ],
        closing: [
          `Email ${editorialEmail} with the subject “LNMR Proposal — [Title]”. Proposal approval does not guarantee acceptance of the completed manuscript.`,
        ],
      }),
    ]),
    page(
      'author-editor-guidelines',
      'Author & editor guidelines',
      'Author and Editor Guidelines',
      'Manuscript requirements for LNMR authors and volume editors.',
      [
        plain([
          'Manuscripts must be original, clearly structured, and appropriately referenced. Authors should explain specialised terminology, justify their methods, present supporting evidence, and acknowledge limitations.',
          'Contributors must disclose funding, conflicts of interest, and substantive use of generative AI. Ethical approvals, participant consent, and permissions for third-party material must be obtained where required.',
          'Volume editors coordinate contributors, maintain thematic coherence, and ensure that revisions are completed. Formatting requirements will be provided during the proposal process.',
        ]),
        seriesTemplates('lnmr', 'LNMR'),
      ],
    ),
    page('peer-review-ethics', 'Peer review & ethics', 'Peer review and ethics', 'How LNMR volumes are reviewed.', [
      plain([
        'All volumes undergo editorial assessment and independent peer review. Monographs are assessed as complete works; chapters and proceedings papers are reviewed individually, alongside assessment of the volume’s overall coherence.',
        'Where appropriate, reviewers from complementary disciplines assess the contribution. Submissions involving an editor’s own work or a conflict of interest are handled independently. All contributions must comply with NextGenIQ Press publication ethics policies.',
      ]),
    ]),
    page('open-access-fees', 'Open access & fees', 'Open access and fees', 'Licensing and charges for LNMR volumes.', [
      plain([
        'Published volumes are freely available online under CC BY 4.0, permitting sharing and adaptation with appropriate attribution. Third-party material may carry separate restrictions.',
        'There is no submission fee. Any publication charges, funding arrangements, or available waivers will be disclosed before a publishing agreement is signed. Editorial decisions are independent of payment.',
      ]),
    ]),
    page('indexing-abstracting', 'Indexing & abstracting', 'Indexing and abstracting', 'Indexing status of LNMR.', [
      plain([
        'LNMR is a new series, and no indexing coverage is currently confirmed. Eligible publications may be submitted to relevant indexing services for independent assessment; inclusion is not guaranteed.',
        'Confirmed coverage will be reported here, specifying whether it applies to the series, individual volumes, or chapters. Publication identifiers will be displayed once assigned.',
      ]),
    ]),
    page('volumes', 'Published volumes', 'Published volumes', 'Volumes published in LNMR.', [
      plain([
        'Published volumes will be listed here as they become available. We currently welcome proposals for monographs, edited collections, and proceedings from conferences, symposia, and workshops within the series scope.',
      ]),
    ]),
    page('contact', 'Contact', 'Contact', 'How to contact LNMR.', [
      plain([
        `For proposals, proceedings partnerships, and editorial enquiries, contact ${editorialEmail}. Please include LNMR in the subject line.`,
      ]),
    ]),
  ],
}
