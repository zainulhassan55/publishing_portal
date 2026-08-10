import type {
  Article,
  ArticleDetail,
  ContactChannel,
  HeroMetric,
  InfoCard,
  IssueArchive,
  Journal,
  JournalDetail,
  NavItem,
  Policy,
} from '../types/content'

export const brand = {
  name: 'Northfield Scholarly Press',
  shortName: 'NSP',
  tagline: 'Independent Academic Publishing',
  summary:
    'An independent academic publisher supporting peer-reviewed journals, conference proceedings, and open scholarly communication with clear editorial standards.',
}

export const navigationItems: NavItem[] = [
  { label: 'Journals', path: '/journals' },
  { label: 'Articles', path: '/articles' },
  { label: 'Books', path: '/books' },
  { label: 'Proceedings', path: '/proceedings' },
  { label: 'About', path: '/about' },
]

export const secondaryNavigationItems: NavItem[] = [
  { label: 'Call for Papers', path: '/cfp' },
  { label: 'Guidelines', path: '/guidelines' },
  { label: 'Policies', path: '/policies' },
  { label: 'Indexing', path: '/indexing' },
  { label: 'News', path: '/news' },
  { label: 'Contact', path: '/contact' },
]

export const heroHighlights = [
  'Peer-reviewed journals with transparent editorial policies',
  'DOI-ready article presentation and issue archives',
  'Clear author guidance and open calls for papers',
]

export const heroMetrics: HeroMetric[] = [
  { value: '4', label: 'Active journals' },
  { value: '1,200+', label: 'Published articles' },
  { value: '35', label: 'Author countries' },
  { value: 'Open', label: 'Access focus' },
]

export const featuredJournals: Journal[] = [
  {
    slug: 'journal-digital-learning-innovation',
    title: 'Journal of Digital Learning and Innovation',
    issn: 'ISSN 3027-1148',
    area: 'Education Technology',
    access: 'Open Access',
    frequency: 'Quarterly',
    summary:
      'Publishes peer-reviewed studies on digital pedagogy, AI-assisted learning, and curriculum transformation.',
  },
  {
    slug: 'international-journal-data-society',
    title: 'International Journal of Data and Society',
    issn: 'ISSN 3027-1199',
    area: 'Data Science',
    access: 'Hybrid',
    frequency: 'Biannual',
    summary:
      'Focuses on analytics, data governance, ethical systems, and the societal impact of evidence-driven decisions.',
  },
  {
    slug: 'applied-engineering-research-review',
    title: 'Applied Engineering Research Review',
    issn: 'ISSN 3027-1261',
    area: 'Engineering',
    access: 'Open Access',
    frequency: 'Quarterly',
    summary:
      'Highlights practical and high-impact engineering research across sustainable systems, design, and implementation.',
  },
  {
    slug: 'contemporary-studies-public-policy',
    title: 'Contemporary Studies in Public Policy',
    issn: 'ISSN 3027-1326',
    area: 'Policy & Governance',
    access: 'Open Access',
    frequency: 'Continuous',
    summary:
      'Provides a venue for interdisciplinary scholarship on governance, regulation, innovation, and public institutions.',
  },
]

export const latestArticles: Article[] = [
  {
    slug: 'open-access-strategies-emerging-publishers',
    title: 'Open Access Strategies for Emerging Academic Publishers',
    journal: 'Journal of Digital Learning and Innovation',
    meta: 'Vol. 2 No. 1 • Aug 2026',
    excerpt:
      'A strategic overview of how smaller academic publishers can strengthen visibility, trust, and author engagement.',
    authors: 'A. Rahman, J. Cruz, L. Mendoza',
  },
  {
    slug: 'metadata-first-model-journal-archives',
    title: 'A Metadata-First Model for Discoverable Journal Archives',
    journal: 'International Journal of Data and Society',
    meta: 'Vol. 1 No. 4 • Jul 2026',
    excerpt:
      'Explores discoverability patterns that improve indexing readiness, search quality, and archival organization.',
    authors: 'S. Patel, N. Wong',
  },
  {
    slug: 'responsive-scholarly-portals-mobile-readers',
    title: 'Designing Responsive Scholarly Portals for Mobile Readers',
    journal: 'Applied Engineering Research Review',
    meta: 'Vol. 3 No. 2 • Jul 2026',
    excerpt:
      'Examines interface patterns that improve reading comfort and navigation for long-form academic content.',
    authors: 'M. Hasan, R. Teo, D. Alvarez',
  },
  {
    slug: 'trust-signals-author-submission-intent',
    title: 'Trust Signals That Improve Author Submission Intent',
    journal: 'Contemporary Studies in Public Policy',
    meta: 'Vol. 1 No. 2 • Jun 2026',
    excerpt:
      'Analyzes how visible policies, indexing cues, and editorial structure affect perceived publishing credibility.',
    authors: 'E. Collins, F. Santos',
  },
]

export const policies: Policy[] = [
  {
    slug: 'publication-ethics',
    title: 'Publication Ethics',
    summary:
      'COPE-aligned guidance covering originality, authorship, misconduct, and ethical publishing responsibilities.',
  },
  {
    slug: 'peer-review-policy',
    title: 'Peer Review Policy',
    summary:
      'Clear explanation of reviewer expectations, confidentiality, conflict management, and editorial decision flow.',
  },
  {
    slug: 'open-access-licensing',
    title: 'Open Access & Licensing',
    summary:
      'Describes licensing options, author rights, and how readers may legally access and share published content.',
  },
  {
    slug: 'archiving-preservation',
    title: 'Archiving & Preservation',
    summary:
      'Outlines long-term preservation goals and how the portal supports sustainable scholarly recordkeeping.',
  },
]

export const aboutPillars = [
  {
    title: 'Academic credibility',
    body: 'Present journals, policies, and public research outputs in a format that feels trustworthy to authors, librarians, and faculty reviewers.',
  },
  {
    title: 'Discoverability',
    body: 'Make journals and articles easy to browse through clear metadata, structured archives, and future-ready search pathways.',
  },
  {
    title: 'Scalable structure',
    body: 'Use a maintainable design system so books, proceedings, special issues, and policy detail pages can grow without redesign.',
  },
]

export const contactChannels: ContactChannel[] = [
  {
    label: 'Editorial Office',
    value: 'editorial@publisher-portal.edu',
    note: 'For publication scope, journal inquiries, and editorial support.',
  },
  {
    label: 'Technical Support',
    value: 'support@publisher-portal.edu',
    note: 'For site feedback, access issues, and future submission system support.',
  },
  {
    label: 'Partnership Desk',
    value: 'partnerships@publisher-portal.edu',
    note: 'For conference proceedings, institutional collaboration, and journal launch discussions.',
  },
]

export const footerGroups = [
  {
    title: 'Portal',
    links: [
      { label: 'About the Organization', path: '/about' },
      { label: 'Featured Journals', path: '/journals' },
      { label: 'Latest Articles', path: '/articles' },
      { label: 'Special Issues', path: '/special-issues' },
    ],
  },
  {
    title: 'Publishing',
    links: [
      { label: 'Author Guidelines', path: '/guidelines' },
      { label: 'Policies', path: '/policies' },
      { label: 'Open Access', path: '/policies' },
      { label: 'Indexing & DOI', path: '/indexing' },
    ],
  },
]

export const publishingFacts = [
  'English-first public portal prepared for future multilingual growth',
  'Responsive presentation for desktop, tablet, and mobile review',
  'Content model designed for future CMS or MMS integration',
]

export const journalDetails: JournalDetail[] = [
  {
    slug: 'journal-digital-learning-innovation',
    title: 'Journal of Digital Learning and Innovation',
    issn: 'ISSN 3027-1148',
    eIssn: 'E-ISSN 3027-1156',
    area: 'Education Technology',
    access: 'Open Access',
    frequency: 'Quarterly',
    scope:
      'Publishes research on digital pedagogy, AI in education, learning analytics, online assessment, and innovation in higher education practice.',
    metrics: [
      { label: 'Current volume', value: 'Vol. 2' },
      { label: 'Issues published', value: '6' },
      { label: 'Open articles', value: '74' },
    ],
    board: ['Editor-in-Chief: Dr. Alina Cruz', 'Associate Editor: Dr. Minh Tran', 'Board Member: Prof. J. Mendoza'],
    quickLinks: ['Aims & Scope', 'Current Issue', 'Editorial Board', 'Author Guidelines'],
  },
  {
    slug: 'international-journal-data-society',
    title: 'International Journal of Data and Society',
    issn: 'ISSN 3027-1199',
    eIssn: 'E-ISSN 3027-1202',
    area: 'Data Science',
    access: 'Hybrid',
    frequency: 'Biannual',
    scope:
      'Focuses on data governance, analytics, digital ethics, public data systems, and the societal impact of evidence-driven technologies.',
    metrics: [
      { label: 'Current volume', value: 'Vol. 1' },
      { label: 'Issues published', value: '4' },
      { label: 'Open articles', value: '38' },
    ],
    board: ['Editor-in-Chief: Prof. Nina Wong', 'Associate Editor: Dr. Sameer Patel', 'Board Member: Dr. Esther Cole'],
    quickLinks: ['Aims & Scope', 'Issue Archive', 'Policies', 'Submit Manuscript'],
  },
]

export const issueArchives: IssueArchive[] = [
  {
    journalSlug: 'journal-digital-learning-innovation',
    volume: 'Volume 2',
    issue: 'Issue 1',
    year: '2026',
    highlight: 'Special section on AI-assisted assessment and digital curriculum design.',
  },
  {
    journalSlug: 'journal-digital-learning-innovation',
    volume: 'Volume 1',
    issue: 'Issue 4',
    year: '2025',
    highlight: 'Reader-centered design approaches for online higher education.',
  },
  {
    journalSlug: 'international-journal-data-society',
    volume: 'Volume 1',
    issue: 'Issue 4',
    year: '2026',
    highlight: 'Public data trust, metadata integrity, and governance by design.',
  },
]

export const articleDetails: ArticleDetail[] = [
  {
    slug: 'open-access-strategies-emerging-publishers',
    title: 'Open Access Strategies for Emerging Academic Publishers',
    authors: ['A. Rahman', 'J. Cruz', 'L. Mendoza'],
    journal: 'Journal of Digital Learning and Innovation',
    doi: '10.5555/nsp.2026.001',
    published: 'August 2026',
    volumeIssue: 'Vol. 2 No. 1',
    abstract:
      'This article examines the strategic choices that allow emerging publishers to position open access journals with credibility, discoverability, and sustainable operational trust.',
    keywords: ['Open access', 'Publishing strategy', 'Academic visibility', 'Metadata'],
  },
  {
    slug: 'metadata-first-model-journal-archives',
    title: 'A Metadata-First Model for Discoverable Journal Archives',
    authors: ['S. Patel', 'N. Wong'],
    journal: 'International Journal of Data and Society',
    doi: '10.5555/nsp.2026.014',
    published: 'July 2026',
    volumeIssue: 'Vol. 1 No. 4',
    abstract:
      'The paper proposes a journal archive design approach centered on metadata quality, discoverability, and institutional readability across scholarly publishing systems.',
    keywords: ['Metadata', 'Archives', 'Indexing', 'Portal design'],
  },
]

export const cfpItems: InfoCard[] = [
  {
    title: 'AI in Education Policy and Practice',
    summary:
      'A professor-facing call for papers focused on applied research, policy frameworks, and classroom implementation in AI-enabled learning systems.',
    meta: 'Submission deadline: 15 Dec 2026',
    badge: 'Open',
  },
  {
    title: 'Smart Infrastructure and Sustainable Cities',
    summary:
      'Invites interdisciplinary papers on systems engineering, urban resilience, sustainable infrastructure, and public technology.',
    meta: 'Submission deadline: 20 Jan 2027',
    badge: 'Open',
  },
  {
    title: 'Data Transparency in Public Institutions',
    summary:
      'Welcomes submissions on governance, accountability, public records, and digital transparency across institutional settings.',
    meta: 'Submission deadline: 02 Feb 2027',
    badge: 'Open',
  },
]

export const books: InfoCard[] = [
  {
    title: 'Handbook of Digital Scholarship Systems',
    summary:
      'A reference volume on platform design, metadata workflows, and digital dissemination for academic publishers.',
    meta: 'ISBN 978-1-0000-2026-4',
    badge: 'Forthcoming',
  },
  {
    title: 'Research Methods for Contemporary Learning Environments',
    summary:
      'An interdisciplinary academic title covering methodology, instructional design, and evidence-based educational practice.',
    meta: 'ISBN 978-1-0000-2026-8',
    badge: '2026 Release',
  },
  {
    title: 'Applied Data Governance in Higher Education',
    summary:
      'Explores institutional data strategy, ethics, stewardship, and policy implementation across research ecosystems.',
    meta: 'ISBN 978-1-0000-2027-1',
    badge: 'Monograph',
  },
]

export const proceedings: InfoCard[] = [
  {
    title: 'International Conference on Digital Learning Systems 2027',
    summary:
      'Proceedings volume for peer-reviewed conference papers on educational systems, AI, and interactive platforms.',
    meta: 'Kuala Lumpur • Mar 2027',
    badge: 'Open CFP',
  },
  {
    title: 'Symposium on Sustainable Engineering Practice',
    summary:
      'Conference volume focused on applied engineering solutions, resilient infrastructure, and climate-aware design.',
    meta: 'Bangkok • Jun 2027',
    badge: 'Series Volume',
  },
  {
    title: 'Forum on Public Policy Innovation',
    summary:
      'A scholarly proceedings series for governance research, institutional innovation, and regulatory transformation.',
    meta: 'Singapore • Sep 2027',
    badge: 'Partner Event',
  },
]

export const specialIssues: InfoCard[] = [
  {
    title: 'AI in Education Policy and Practice',
    summary:
      'Explores pedagogical innovation, governance, and implementation challenges in AI-enabled learning environments.',
    meta: 'Submission deadline: 15 Dec 2026',
    badge: 'Open',
  },
  {
    title: 'Smart Infrastructure and Sustainable Cities',
    summary:
      'Invites interdisciplinary scholarship linking engineering systems, civic planning, and environmental resilience.',
    meta: 'Submission deadline: 20 Jan 2027',
    badge: 'Open',
  },
  {
    title: 'Data Transparency in Public Institutions',
    summary:
      'Focuses on accountability, records, access policy, and evidence-informed governance in public systems.',
    meta: 'Publishing in Q2 2027',
    badge: 'Forthcoming',
  },
]

export const guidelines: InfoCard[] = [
  {
    title: 'Author Guidelines',
    summary:
      'Submission preparation, manuscript structure, figures, references, ethical disclosures, and file expectations.',
    badge: 'Core',
  },
  {
    title: 'Reviewer Guidelines',
    summary:
      'Review quality expectations, confidentiality, conflict management, and evaluation criteria for scholarly review.',
    badge: 'Public Summary',
  },
  {
    title: 'Editor Guidelines',
    summary:
      'Editorial responsibilities, decision consistency, communication standards, and publication oversight principles.',
    badge: 'Governance',
  },
]

export const indexingItems: InfoCard[] = [
  {
    title: 'DOI Registration',
    summary:
      'Prepared for Crossref-aligned DOI workflows and a consistent permanent identifier strategy for published content.',
    badge: 'Infrastructure',
  },
  {
    title: 'Abstracting & Indexing',
    summary:
      'Portal structure is designed to support discoverability across indexing services and academic search environments.',
    badge: 'Visibility',
  },
  {
    title: 'Metadata Readiness',
    summary:
      'Clean article, journal, issue, and policy presentation supports future metadata expansion and platform integration.',
    badge: 'Search Ready',
  },
]

export const newsItems: InfoCard[] = [
  {
    title: 'Publisher branding proposal prepared for faculty review',
    summary:
      'A refined public portal concept has been prepared to support approval discussions and implementation planning.',
    meta: 'Aug 2026',
    badge: 'Announcement',
  },
  {
    title: 'New call for papers announced for AI in Education',
    summary:
      'The portal highlights active thematic calls with clear editorial framing and accessible submission intent.',
    meta: 'Jul 2026',
    badge: 'Call for Papers',
  },
  {
    title: 'Proceedings publishing framework released for partner events',
    summary:
      'A professional conference publishing presentation is now included as part of the public platform structure.',
    meta: 'Jun 2026',
    badge: 'Update',
  },
]
