import type {
  Article,
  ArticleDetail,
  BookSeries,
  BookSeriesDetail,
  ContactChannel,
  HeroMetric,
  InfoCard,
  IssueArchive,
  Journal,
  JournalDetail,
  NavItem,
  Policy,
  ServiceItem,
  ValueItem,
} from '../types/content'
import { isriDetail, isriSeries } from './books/isri'
import { lnisiDetail, lnisiSeries } from './books/lnisi'
import { ijdhDetail, ijdhJournal } from './journals/ijdh'
import { ijdmDetail, ijdmJournal } from './journals/ijdm'
import { ijdsDetail, ijdsJournal } from './journals/ijds'
import { ijeiDetail, ijeiJournal } from './journals/ijei'
import { ijicDetail, ijicJournal } from './journals/ijic'
import { ijisDetail, ijisJournal } from './journals/ijis'
import { ijmcDetail, ijmcJournal } from './journals/ijmc'
import { ijmrDetail, ijmrJournal } from './journals/ijmr'
import { ijqtDetail, ijqtJournal } from './journals/ijqt'
import { ijseDetail, ijseJournal } from './journals/ijse'

export const brand = {
  name: 'Digital Manuscriptpedia',
  shortName: 'DMPedia',
  unitLabel: 'A unit of Digital Manuscriptpedia',
  tagline: 'Independent Academic Publishing',
  summary:
    'An independent academic publisher dedicated to advancing research and scholarship across diverse disciplines. We publish high-quality journals, books, and conference proceedings, providing a trusted platform for authors and institutions worldwide.',
}

export const navigationItems: NavItem[] = [
  { label: 'Journals', path: '/journals' },
  { label: 'Articles', path: '/articles' },
  { label: 'Book Series', path: '/books' },
  { label: 'Proceedings', path: '/proceedings' },
  { label: 'About', path: '/about' },
]

export const secondaryNavigationItems: NavItem[] = [
  { label: 'Call for Papers', path: '/cfp' },
  { label: 'Special Issues', path: '/special-issues' },
  { label: 'Guidelines', path: '/guidelines' },
  { label: 'Policies', path: '/policies' },
  { label: 'Indexing', path: '/indexing' },
  { label: 'News', path: '/news' },
  { label: 'Contact', path: '/contact' },
]

export const heroHighlights = [
  'Peer-reviewed open-access journals with transparent editorial standards',
  'DOI-ready articles, issue archives, and discoverable scholarly metadata',
  'Conference proceedings, books, and author guidance in one public portal',
]

export const heroMetrics: HeroMetric[] = [
  { value: '10', label: 'Active journals' },
  { value: 'APC waived', label: 'Until Sep 2026' },
  { value: 'CC BY 4.0', label: 'Open access license' },
  { value: 'Single-blind', label: 'Peer review' },
]

export const publisherServices: ServiceItem[] = [
  {
    title: 'Publishing',
    summary:
      'Peer-reviewed journals, books, and conference proceedings across digital fields, entrepreneurship, innovation, and related scholarly areas.',
  },
  {
    title: 'Peer Review Support',
    summary:
      'Constructive expert feedback that strengthens manuscript quality before and during editorial decision-making.',
  },
  {
    title: 'Research Collaboration',
    summary:
      'Facilitating partnerships between researchers and institutions across the globe.',
  },
  {
    title: 'Workshops & Training',
    summary:
      'Educational programs that strengthen research skills, writing quality, and publishing readiness.',
  },
  {
    title: 'Consulting Services',
    summary:
      'Expert advice on research methodologies, data analysis, and project management for academic teams.',
  },
  {
    title: 'Funding Opportunities',
    summary:
      'Information on grants, scholarships, and other funding pathways relevant to scholarly work.',
  },
]

export const aboutValues: ValueItem[] = [
  {
    number: '01',
    title: 'Integrity',
    summary: 'Upholding the highest standards of academic and research ethics.',
  },
  {
    number: '02',
    title: 'Collaboration',
    summary: 'Encouraging cross-disciplinary and international partnerships.',
  },
  {
    number: '03',
    title: 'Excellence',
    summary: 'Striving for the highest quality in research and academia.',
  },
  {
    number: '04',
    title: 'Innovation',
    summary: 'Supporting groundbreaking and impactful research.',
  },
  {
    number: '05',
    title: 'Accessibility',
    summary: 'Ensuring open access to knowledge and resources for all.',
  },
  {
    number: '06',
    title: 'Impact',
    summary: 'Driving research that addresses real-world challenges and societal needs.',
  },
]

export const featuredJournals: Journal[] = [
  ijdhJournal,
  ijdmJournal,
  ijdsJournal,
  ijeiJournal,
  ijicJournal,
  ijisJournal,
  ijmcJournal,
  ijmrJournal,
  ijqtJournal,
  ijseJournal,
]

export const latestArticles: Article[] = []

export const policies: Policy[] = [
  {
    slug: 'publication-ethics',
    title: 'Publication Ethics',
    summary:
      'COPE-aligned guidance covering originality, authorship, misconduct, and ethical publishing responsibilities.',
    sections: [
      {
        title: 'COPE core practices',
        body: 'DMPedia follows the core practices of the Committee on Publication Ethics (COPE) across all journals. Editors, authors, and reviewers are expected to adhere to these standards. Cases of suspected misconduct are handled in accordance with COPE flowcharts and procedures.',
      },
      {
        title: 'Editorial independence',
        body: 'Editorial decisions are made solely on scholarly merit, independent of commercial considerations. Each journal operates with a defined scope, an identifiable editorial leadership, and a publicly listed board.',
      },
      {
        title: 'Originality and plagiarism screening',
        body: 'Submitted manuscripts are checked for plagiarism and duplicate publication prior to peer review. Self-plagiarism and text recycling expectations are stated in author guidelines.',
      },
      {
        title: 'Corrections and retractions',
        body: 'Errors, retractions, and expressions of concern are handled promptly according to COPE guidance. Corrections are linked to the original article and remain part of the scholarly record.',
      },
    ],
  },
  {
    slug: 'peer-review-policy',
    title: 'Peer Review Policy',
    summary:
      'Clear explanation of reviewer expectations, confidentiality, conflict management, and editorial decision flow.',
    sections: [
      {
        title: 'Review model',
        body: 'All research content undergoes documented peer review prior to acceptance. Journals use single-blind or double-blind review as stated in each title’s author guidelines.',
      },
      {
        title: 'Reviewer responsibilities',
        body: 'Reviewers provide constructive, confidential, and timely evaluations focused on originality, methodological soundness, clarity, and contribution to the field.',
      },
      {
        title: 'Conflicts of interest',
        body: 'Editors and reviewers must declare competing interests. Where a conflict exists, the manuscript is reassigned to maintain impartial decision-making.',
      },
      {
        title: 'Decision process',
        body: 'Editors weigh reviewer reports, manuscript quality, and journal scope before issuing revise, accept, or reject decisions. Appeals are considered through a documented editorial pathway.',
      },
    ],
  },
  {
    slug: 'open-access-licensing',
    title: 'Open Access & Licensing',
    summary:
      'Describes APC-free open access, licensing options, author rights, and how readers may legally access and share published content.',
    sections: [
      {
        title: 'Open access commitment',
        body: 'DMPedia journals are free and open access. Articles are permanently available without subscription barriers, supporting global knowledge exchange.',
      },
      {
        title: 'APC-free publishing',
        body: 'Authors are not required to pay article processing charges for current DMPedia journals. Removing publication fees lowers barriers for researchers worldwide.',
      },
      {
        title: 'Licensing',
        body: 'Articles are typically published under a Creative Commons Attribution (CC BY 4.0) license unless a journal-specific exception is stated.',
      },
      {
        title: 'Author rights',
        body: 'Authors retain meaningful rights to share and reuse their work in accordance with the applicable license and institutional policies.',
      },
    ],
  },
  {
    slug: 'archiving-preservation',
    title: 'Archiving & Preservation',
    summary:
      'Outlines long-term preservation goals and how the portal supports a durable scholarly record.',
    sections: [
      {
        title: 'Persistent identifiers',
        body: 'DMPedia assigns DOIs to published articles and maintains stable URLs for discoverability, citation tracking, and long-term access.',
      },
      {
        title: 'Digital preservation',
        body: 'Published content is prepared for deposit with recognized digital preservation services to protect the scholarly record over time.',
      },
      {
        title: 'Metadata integrity',
        body: 'Complete bibliographic metadata—including titles, authors, affiliations, abstracts, and keywords—is maintained to support indexing and archival quality.',
      },
      {
        title: 'Version of record',
        body: 'The portal presents the publisher version of record with clear issue, volume, and DOI information for reliable citation.',
      },
    ],
  },
]

export const aboutPillars = [
  {
    title: 'Who we are',
    body: 'DMPedia is a global academic publisher and knowledge platform that empowers researchers, educators, and professionals to collaborate, share knowledge, and drive impactful research and innovation.',
  },
  {
    title: 'Our mission',
    body: 'To promote and support high-quality research and academic excellence through international collaboration, rigorous peer review, and open knowledge sharing.',
  },
  {
    title: 'Our vision',
    body: 'To bridge traditional scholarship with modern digital tools, making research more accessible, visible, and meaningful for global audiences.',
  },
]

export const contactChannels: ContactChannel[] = [
  {
    label: 'Editorial Office',
    value: 'contact@digitalmanuscriptpedia.com',
    note: 'For journal scope questions, editorial processes, and publication-related inquiries.',
  },
  {
    label: 'General Inquiries',
    value: 'digitalmanuscriptpedia@gmail.com',
    note: 'For general publisher questions, author support, and partnership introductions.',
  },
  {
    label: 'Proceedings & Conferences',
    value: 'contact@digitalmanuscriptpedia.com',
    note: 'For DMP-LNCSE, DMP-LNMR, and conference proceedings collaboration.',
  },
]

export const footerGroups = [
  {
    title: 'Explore',
    links: [
      { label: 'About DMPedia', path: '/about' },
      { label: 'Journals', path: '/journals' },
      { label: 'Latest Articles', path: '/articles' },
      { label: 'Special Issues', path: '/special-issues' },
    ],
  },
  {
    title: 'Publishing',
    links: [
      { label: 'Author Guidelines', path: '/guidelines' },
      { label: 'Policies', path: '/policies' },
      { label: 'Open Access', path: '/policies/open-access-licensing' },
      { label: 'Indexing & DOI', path: '/indexing' },
    ],
  },
]

export const publishingFacts = [
  'Peer-reviewed journals across computing, engineering, health, business, sustainability, and forensics',
  'APC-free open access with CC BY licensing and transparent ethics policies',
  'Conference proceedings series with ISBN assignment and optional DOI support',
]

export const editorialStandards = [
  'Documented peer review before acceptance, with review type disclosed per journal',
  'Reference integrity checks and plagiarism screening before review',
  'Public editorial boards with named leadership and institutional affiliations',
  'Ethical declarations for conflicts, funding, data availability, and approvals where applicable',
  'DOI assignment and metadata-complete article presentation',
  'Prompt correction and retraction handling aligned with COPE guidance',
]

export const journalDetails: JournalDetail[] = [
  ijdhDetail,
  ijdmDetail,
  ijdsDetail,
  ijeiDetail,
  ijicDetail,
  ijisDetail,
  ijmcDetail,
  ijmrDetail,
  ijqtDetail,
  ijseDetail,
]

export const issueArchives: IssueArchive[] = [
  {
    journalSlug: 'ijdh',
    volume: 'Volume 1',
    issue: 'Issue 1',
    year: '2026',
    highlight: 'Inaugural continuous publication year for digital health research.',
  },
  {
    journalSlug: 'ijdm',
    volume: 'Volume 1',
    issue: 'Issue 1',
    year: '2026',
    highlight: 'Inaugural continuous publication year for digital management research.',
  },
  {
    journalSlug: 'ijds',
    volume: 'Volume 1',
    issue: 'Issue 1',
    year: '2026',
    highlight: 'Inaugural continuous publication year for digital society research.',
  },
  {
    journalSlug: 'ijei',
    volume: 'Volume 1',
    issue: 'Issue 1',
    year: '2026',
    highlight: 'Inaugural continuous publication year for entrepreneurship and innovation research.',
  },
  {
    journalSlug: 'ijic',
    volume: 'Volume 1',
    issue: 'Issue 1',
    year: '2026',
    highlight: 'Inaugural continuous publication year for intelligent computing research.',
  },
  {
    journalSlug: 'ijis',
    volume: 'Volume 1',
    issue: 'Issue 1',
    year: '2026',
    highlight: 'Inaugural continuous publication year for interdisciplinary science research.',
  },
  {
    journalSlug: 'ijmc',
    volume: 'Volume 1',
    issue: 'Issue 1',
    year: '2026',
    highlight: 'Inaugural continuous publication year for mathematical computing research.',
  },
  {
    journalSlug: 'ijmr',
    volume: 'Volume 1',
    issue: 'Issue 1',
    year: '2026',
    highlight: 'Inaugural continuous publication year for multidisciplinary research.',
  },
  {
    journalSlug: 'ijqt',
    volume: 'Volume 1',
    issue: 'Issue 1',
    year: '2026',
    highlight: 'Inaugural continuous publication year for quantum technologies research.',
  },
  {
    journalSlug: 'ijse',
    volume: 'Volume 1',
    issue: 'Issue 1',
    year: '2026',
    highlight: 'Inaugural continuous publication year for smart electronics research.',
  },
]

export const articleDetails: ArticleDetail[] = []

export const cfpItems: InfoCard[] = [
  {
    title: 'Connected Care and Trustworthy Clinical AI',
    summary:
      'Invites original research for IJDH on telemedicine, clinical decision support, health data interoperability, and trustworthy digital health systems.',
    meta: 'Deadline: 31 Dec 2026 · IJDH',
    badge: 'Open',
  },
  {
    title: 'Digital Strategy and Platform Ecosystems',
    summary:
      'Invites original research for IJDM on digital transformation, platform-based business models, data-driven decision making, and accountable digital management.',
    meta: 'Deadline: 31 Dec 2026 · IJDM',
    badge: 'Open',
  },
  {
    title: 'Digital Citizenship and Platform Society',
    summary:
      'Invites original research for IJDS on digital citizenship, civic technologies, digital inequality, algorithmic governance, and equitable digital public life.',
    meta: 'Deadline: 31 Dec 2026 · IJDS',
    badge: 'Open',
  },
  {
    title: 'Entrepreneurial Ecosystems and Innovation Management',
    summary:
      'Invites original research for IJEI on new venture creation, innovation management, digital entrepreneurship, and sustainable venturing.',
    meta: 'Deadline: 31 Dec 2026 · IJEI',
    badge: 'Open',
  },
  {
    title: 'Trustworthy and Resource-Aware Intelligent Computing',
    summary:
      'Invites original research for IJIC on hybrid intelligent systems, interpretable models, edge inference, and autonomous decision-making.',
    meta: 'Deadline: 31 Dec 2026 · IJIC',
    badge: 'Open',
  },
  {
    title: 'Knowledge Integration and Convergent Science',
    summary:
      'Invites original research for IJIS on interdisciplinary methods, team science, cross-domain data, and convergent scientific practice.',
    meta: 'Deadline: 31 Dec 2026 · IJIS',
    badge: 'Open',
  },
  {
    title: 'Structure-Preserving and High-Performance Mathematical Computing',
    summary:
      'Invites original research for IJMC on numerical analysis, symbolic computation, verified methods, and mathematically grounded algorithms.',
    meta: 'Deadline: 31 Dec 2026 · IJMC',
    badge: 'Open',
  },
  {
    title: 'Integrative Multidisciplinary Problem-Driven Research',
    summary:
      'Invites original research for IJMR on cross-field methods, evidence integration, cross-sector collaboration, and problem-driven multidisciplinary studies.',
    meta: 'Deadline: 31 Dec 2026 · IJMR',
    badge: 'Open',
  },
  {
    title: 'Scalable Quantum Computing, Communication, and Sensing',
    summary:
      'Invites original research for IJQT on quantum architectures, error correction, quantum networks, sensing, and quantum-safe systems.',
    meta: 'Deadline: 31 Dec 2026 · IJQT',
    badge: 'Open',
  },
  {
    title: 'Intelligent Connected and Energy-Aware Electronics',
    summary:
      'Invites original research for IJSE on smart sensors, edge-AI hardware, low-power circuits, IoT devices, and hardware security.',
    meta: 'Deadline: 31 Dec 2026 · IJSE',
    badge: 'Open',
  },
]

export const featuredBookSeries: BookSeries[] = [isriSeries, lnisiSeries]

export const bookSeriesDetails: BookSeriesDetail[] = [isriDetail, lnisiDetail]

export const proceedings: InfoCard[] = [
  {
    title: 'DMP-LNCSE — Lecture Notes in Computer Science & Engineering',
    summary:
      'Peer-reviewed conference proceedings series for AI, software engineering, networks, cybersecurity, data science, electronics, and emerging computing technologies. ISBN assignment with optional DOI support.',
    meta: 'Mode: Online / Hybrid / Physical',
    badge: 'Series',
  },
  {
    title: 'DMP-LNMR — Lecture Notes in Multidisciplinary Research',
    summary:
      'Peer-reviewed proceedings home for management, education, social sciences, humanities, applied sciences, and cross-disciplinary studies.',
    meta: 'Mode: Online / Hybrid / Physical',
    badge: 'Series',
  },
]

export const specialIssues: InfoCard[] = [
  {
    title: 'Connected Care and Trustworthy Clinical AI',
    summary:
      'Explores clinical decision support, medical AI, interoperability, and trustworthy digital health for IJDH.',
    meta: 'Submission deadline: 31 Dec 2026',
    badge: 'Open',
  },
  {
    title: 'Digital Strategy and Platform Ecosystems',
    summary:
      'Explores digital transformation, platform ecosystems, enterprise systems, and accountable digital management for IJDM.',
    meta: 'Submission deadline: 31 Dec 2026',
    badge: 'Open',
  },
  {
    title: 'Digital Citizenship and Platform Society',
    summary:
      'Explores digital citizenship, civic technologies, digital inequality, and algorithmic governance for IJDS.',
    meta: 'Submission deadline: 31 Dec 2026',
    badge: 'Open',
  },
  {
    title: 'Entrepreneurial Ecosystems and Innovation Management',
    summary:
      'Explores new venture creation, innovation management, digital entrepreneurship, and entrepreneurial ecosystems for IJEI.',
    meta: 'Submission deadline: 31 Dec 2026',
    badge: 'Open',
  },
  {
    title: 'Trustworthy and Resource-Aware Intelligent Computing',
    summary:
      'Explores hybrid intelligent systems, interpretable models, resource-aware inference, and autonomous systems for IJIC.',
    meta: 'Submission deadline: 31 Dec 2026',
    badge: 'Open',
  },
  {
    title: 'Knowledge Integration and Convergent Science',
    summary:
      'Explores interdisciplinary methods, team science, cross-domain synthesis, and convergent research practices for IJIS.',
    meta: 'Submission deadline: 31 Dec 2026',
    badge: 'Open',
  },
  {
    title: 'Structure-Preserving and High-Performance Mathematical Computing',
    summary:
      'Explores numerical analysis, symbolic computation, high-performance solvers, and structure-preserving models for IJMC.',
    meta: 'Submission deadline: 31 Dec 2026',
    badge: 'Open',
  },
  {
    title: 'Integrative Multidisciplinary Problem-Driven Research',
    summary:
      'Explores cross-field methods, evidence integration, and problem-driven multidisciplinary studies for IJMR.',
    meta: 'Submission deadline: 31 Dec 2026',
    badge: 'Open',
  },
  {
    title: 'Scalable Quantum Computing, Communication, and Sensing',
    summary:
      'Explores quantum architectures, error correction, quantum networks, sensing, and hybrid quantum-classical systems for IJQT.',
    meta: 'Submission deadline: 31 Dec 2026',
    badge: 'Open',
  },
  {
    title: 'Intelligent Connected and Energy-Aware Electronics',
    summary:
      'Explores smart sensors, edge-AI hardware, low-power electronics, IoT nodes, and trusted hardware for IJSE.',
    meta: 'Submission deadline: 31 Dec 2026',
    badge: 'Open',
  },
]

export const guidelines: InfoCard[] = [
  {
    title: 'Author Guidelines',
    summary:
      'Manuscript structure, figures, references, ethical disclosures, data availability statements, and file preparation requirements.',
    badge: 'Core',
  },
  {
    title: 'Reviewer Guidelines',
    summary:
      'Confidentiality, conflict management, evaluation criteria, and expectations for constructive scholarly review.',
    badge: 'Public Summary',
  },
  {
    title: 'Editor Guidelines',
    summary:
      'Editorial independence, decision consistency, communication standards, and publication oversight principles.',
    badge: 'Governance',
  },
  {
    title: 'Conference Proceedings Guidelines',
    summary:
      'Formatting, ISBN workflow, optional DOI registration, and quality standards for DMP-LNCSE and DMP-LNMR volumes.',
    badge: 'Series',
  },
]

export const indexingItems: InfoCard[] = [
  {
    title: 'DOI Registration',
    summary:
      'Prepared for Crossref-aligned DOI workflows with persistent identifiers on published articles and proceedings.',
    badge: 'Infrastructure',
  },
  {
    title: 'Abstracting & Indexing',
    summary:
      'Portal structure supports discoverability across academic search environments and future indexing service applications.',
    badge: 'Visibility',
  },
  {
    title: 'Metadata Readiness',
    summary:
      'Complete article, journal, issue, and policy metadata supports citation tracking, ORCID attribution, and archival quality.',
    badge: 'Search Ready',
  },
  {
    title: 'Open Access Discoverability',
    summary:
      'APC-free open access with CC BY licensing improves global reach for authors, institutions, and readers.',
    badge: 'OA',
  },
]

export const newsItems: InfoCard[] = [
  {
    title: 'LNISI book series now live on the DMPedia publishing portal',
    summary:
      'Lecture Notes in Interdisciplinary Science and Innovation is available with full about and call-for-books pages for open-access lecture notes and edited volumes.',
    meta: 'Sep 2026',
    badge: 'Announcement',
  },
  {
    title: 'ISRI book series now live on the DMPedia publishing portal',
    summary:
      'International Series in Research and Innovation is available with full about and call-for-books pages for open-access monographs and edited volumes.',
    meta: 'Sep 2026',
    badge: 'Announcement',
  },
  {
    title: 'APC waived across active journals until September 2026',
    summary:
      'Authors can publish open access with no article processing charge during the introductory waiver period.',
    meta: 'Sep 2026',
    badge: 'Update',
  },
]
