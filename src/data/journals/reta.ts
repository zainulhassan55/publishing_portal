import type { JournalDetail } from '@/types/content'
import { editorTable, editorialEmail, journalFacts, articlesInPressPage, indexingPage, page, plain } from '../pages'
import { journalTemplates } from '../templates'

const slug = 'reta'
const title = 'Reviews in Emerging Technology and Applications'
const intro = "Reviews in Emerging Technology and Applications (RETA) is a peer-reviewed, open-access journal dedicated exclusively to publishing high-quality systematic reviews, meta-analyses, and state-of-the-art scoping articles. The journal serves as a premier multidisciplinary platform mapping the rapid evolution of next-generation technologies and their critical applications across engineering, applied sciences, and interdisciplinary fields. RETA does not accept standalone original experimental papers, focusing entirely on comprehensive literature synthesis that consolidates existing knowledge, evaluates technological progress, and uncovers underlying research gaps, practical challenges, and future engineering directions."
const topics = [
  "Computing, AI & Quantum Systems: Artificial intelligence, intelligent computing, autonomous systems, quantum computing, quantum communications, and next-generation quantum technologies.",
  "Security, Connectivity & Trust: Cybersecurity, privacy frameworks, trustworthy digital technologies, advanced communications, networking, and connected systems.",
  "Electronics & Electrical Engineering: Electronics, semiconductor design, photonics, advanced sensing infrastructure, power electronics, and intelligent control mechanisms.",
  "Robotics, Manufacturing & Automation: Mechanical engineering, robotics, mechatronics, advanced manufacturing, additive manufacturing, and industrial automation.",
  "Materials, Nanotech & Chemical Processing: Materials science, nanotechnology, functional materials, chemical engineering, process technologies, and industrial biotechnology.",
  "Energy, Infrastructure & Environment: Renewable energy, energy storage, sustainable systems, civil engineering, resilient infrastructure, environmental engineering, pollution control, resource recovery, water technologies, waste management, and circular-economy solutions.",
  "Bio-Engineering, Medical & Agriculture: Biomedical engineering, medical devices, advanced healthcare technologies, biotechnology, bioengineering, synthetic biology, agricultural technologies, precision farming, and food engineering.",
  "Aerospace, Mobility & Physics: Aerospace engineering, space technologies, remote sensing, transportation systems, mobility, marine technologies, applied physics, instrumentation, and measurement technologies.",
  "Modeling, Governance & Convergence: Computational modeling, simulation frameworks, digital twins, technology convergence, cross-disciplinary applications, reliability assessment, standardization, technology adoption, commercialization paths, governance, and societal impacts."
]
const reviewPolicy = [
  "Submissions must provide a substantive review of technologies, engineering methods, enabling scientific advances, or their applications. Articles should critically evaluate existing evidence, explain how literature was identified and selected, compare approaches, and identify limitations and future research priorities.",
  "The journal welcomes comprehensive surveys, systematic reviews, scoping reviews, critical and integrative reviews, umbrella reviews, and meta-analyses. Bibliometric reviews must include substantive critical synthesis beyond publication and citation statistics. Standalone original research papers and reviews without a clear technological connection are outside the journal’s scope."
]

/** Editorial board as supplied by the publisher ("Updated EB", November 2026), in the publisher's order. */
const editors = [
  { name: 'Mu-Yen Chen', affiliation: 'National Cheng Kung University, Tainan, Taiwan' },
  { name: 'Chunjia Han', affiliation: 'Birkbeck, University of London, UK' },
  { name: 'Chi-Wen Lung', affiliation: 'Asia University, Taiwan' },
  { name: 'Ramakrishnan Raman', affiliation: 'Symbiosis International (Deemed University), Pune, India' },
  { name: 'Sunneng Sandino Berutu', affiliation: 'Universitas Duta Bangsa Surakarta, Indonesia' },
  { name: 'Subhra Mazumdar', affiliation: 'Indian Institute of Technology Indore, India' },
  { name: 'Afu Ichsan Pradana', affiliation: 'Duta Bangsa University, Indonesia' },
  { name: 'Sugam Sharma', affiliation: 'Iowa State University SUF/eLegalls ai, USA' },
]

/** Publisher-supplied scope; no ISSN has been assigned yet. */
export const retaDetail: JournalDetail = {
  slug, title, shortTitle: 'RETA',
  tagline: 'Comprehensive surveys and critical reviews of emerging technologies and their applications.',
  issn: 'Not yet assigned', eIssn: 'Not yet assigned',
  area: 'Emerging Technology and Applications', access: 'Open Access',
  frequency: 'Continuous publication', publisher: 'NextGenIQ Press',
  editor: 'Editors', reviewType: 'Double-blind peer review', license: 'CC BY 4.0',
  scope: intro, overview: [intro], metrics: [], board: editors.map((e) => `${e.name}, ${e.affiliation}`), topics, quickLinks: [],
  profile: {
    kicker: 'RETA · A NextGenIQ Press Journal',
    tile: '/images/covers/reta.jpg',
    badges: ['Open access', 'Double-blind peer review', 'Continuous publication'], intro,
    ctas: [
      { label: 'Submit a manuscript', pageId: 'submit' },
      { label: 'Editorial board', pageId: 'editorial-board' },
      { label: 'Author guidelines', pageId: 'author-guidelines' },
    ],
    facts: journalFacts(null).map(f => f.label === 'ISSN (online)' ? { ...f, value: 'Not yet assigned' } : f),
    editorsLabel: 'Editors', editors,
  },
  pages: [
    page('aims-scope', 'Aims & scope', 'Aims and Scope', 'The review-only scope of RETA.', [
      plain(["Reviews in Emerging Technology and Applications (RETA) publishes comprehensive surveys and critical reviews of emerging and advancing technologies across engineering, applied sciences, and interdisciplinary fields. The journal aims to consolidate knowledge, evaluate technological progress, and identify research gaps, practical challenges, and future directions."]),
      { title: 'Subject Areas & Core Domains', paragraphs: ['Topics of interest include comprehensive reviews and surveys in the following fields, but are not limited to:'], bullets: topics, topicList: true, closing: reviewPolicy },
    ]),
    page('editorial-board', 'Editorial board', 'Editorial board', 'The editors of RETA.', [{ title: 'Editors', table: editorTable(editors) }]),
    page('author-guidelines', 'Author guidelines', 'Author guidelines', 'Preparing a review manuscript for RETA.', [
      plain([...reviewPolicy,
        'Submit an anonymised manuscript for double-blind review, with author details provided separately. Include funding, conflicts of interest, data availability, relevant ethical approvals, and substantive AI-use disclosures.',
        'Submissions must be original, written in English, and not under consideration elsewhere. Originality here concerns the review and synthesis; standalone original experimental papers are outside the scope.',
      ]), journalTemplates(slug, 'RETA'),
    ]),
    page('peer-review-ethics', 'Peer review & ethics', 'Peer review and ethics', 'How RETA review manuscripts are assessed.', [plain([
      'Suitable review manuscripts undergo independent double-blind peer review following editorial screening. Assessment considers the rigour of literature identification and selection, critical synthesis, limitations, and relevance to emerging technologies.',
      'All contributors must follow NextGenIQ Press publication ethics policies. Conflicts of interest are disclosed, and submissions involving editors are handled independently.',
    ])]),
    page('open-access-fees', 'Open access & fees', 'Open access and fees', 'Licensing and charges for RETA articles.', [plain([
      'Articles are freely available under CC BY 4.0, permitting sharing and adaptation with appropriate attribution. Third-party material may carry separate restrictions.',
      'Consult the publisher’s fees page for current charges and waiver arrangements. Editorial decisions are independent of payment.',
    ])]),
    page('contact', 'Contact', 'Contact', 'How to contact RETA.', [plain([`Email ${editorialEmail}, including RETA and your manuscript reference, if available.`])]),
    indexingPage('RETA'),
    articlesInPressPage('RETA'),
  ],
}
