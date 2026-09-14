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
  ServiceItem,
  ValueItem,
} from '../types/content'

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
  { label: 'Books', path: '/books' },
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
  { value: '6', label: 'Active journals' },
  { value: 'APC-free', label: 'Open access model' },
  { value: '2', label: 'Proceedings series' },
  { value: 'Global', label: 'Author community' },
]

export const publisherServices: ServiceItem[] = [
  {
    title: 'Publishing',
    summary:
      'Peer-reviewed journals, books, and conference proceedings across computing, engineering, health, business, sustainability, and forensic science.',
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
  {
    slug: 'race',
    title: 'Revolutionary Advances in Computing and Electronics',
    shortTitle: 'RACE',
    issn: 'ISSN forthcoming',
    area: 'Computing & Electronics',
    access: 'Open Access',
    frequency: 'Continuous',
    editor: 'Editorial Board',
    reviewType: 'Single-blind peer review',
    summary:
      'Original research on AI, cybersecurity, embedded systems, IoT, robotics, quantum computing, communication networks, and sustainable engineering.',
  },
  {
    slug: 'jses',
    title: 'Journal of Smart Engineering Systems',
    shortTitle: 'JSES',
    issn: 'ISSN forthcoming',
    area: 'Smart Engineering',
    access: 'Open Access',
    frequency: 'Continuous',
    reviewType: 'Single-blind peer review',
    summary:
      'Bridges fundamental advances and practical applications across civil, mechanical, energy, and materials engineering with AI-driven and IoT-enabled systems.',
  },
  {
    slug: 'jbcsi',
    title: 'Journal of Business Cultures and Strategic Innovation',
    shortTitle: 'JBCSI',
    issn: 'ISSN forthcoming',
    area: 'Business & Strategy',
    access: 'Open Access',
    frequency: 'Continuous',
    reviewType: 'Double-blind peer review',
    summary:
      'Peer-reviewed research on ESG strategies, digital transformation, cross-cultural leadership, organizational resilience, and sustainable business models.',
  },
  {
    slug: 'joha',
    title: 'Journal of One Health Advances',
    shortTitle: 'JOHA',
    issn: 'ISSN forthcoming',
    area: 'One Health',
    access: 'Open Access',
    frequency: 'Continuous',
    reviewType: 'Single-blind peer review',
    summary:
      'Interdisciplinary work connecting human, animal, and environmental health—including zoonoses, antimicrobial stewardship, and precision livestock farming.',
  },
  {
    slug: 'jssgt',
    title: 'Journal of Sustainable Systems and Green Tech',
    shortTitle: 'JSSGT',
    issn: 'ISSN forthcoming',
    area: 'Sustainability',
    access: 'Open Access',
    frequency: 'Continuous',
    reviewType: 'Single-blind peer review',
    summary:
      'Research on renewable energy, circular economy, climate-resilient infrastructure, sustainable materials, and SDG-aligned policy frameworks.',
  },
  {
    slug: 'facts',
    title: 'Journal of Forensic Analysis, Crime, Technology & Science',
    shortTitle: 'FACTS',
    issn: 'ISSN forthcoming',
    area: 'Forensic Science',
    access: 'Open Access',
    frequency: 'Continuous',
    reviewType: 'Double-blind peer review',
    summary:
      'Covers forensic biology, digital forensics, crime scene investigation, cybercrime, legal medicine, and emerging forensic technologies.',
  },
]

export const latestArticles: Article[] = [
  {
    slug: 'edge-ai-framework-iot-industrial-monitoring',
    title: 'An Edge-AI Framework for Real-Time Industrial IoT Monitoring',
    journal: 'Revolutionary Advances in Computing and Electronics',
    meta: 'Vol. 1 No. 2 • Sep 2026',
    type: 'Research Article',
    doi: '10.0000/race.2026.1201',
    excerpt:
      'Proposes a lightweight edge inference pipeline that reduces latency for multi-sensor industrial monitoring while preserving model accuracy under bandwidth constraints.',
    authors: 'A. Rahman, L. Chen, M. Okonkwo',
  },
  {
    slug: 'ai-driven-structural-health-monitoring-bridges',
    title: 'AI-Driven Structural Health Monitoring for Urban Bridges',
    journal: 'Journal of Smart Engineering Systems',
    meta: 'Vol. 1 No. 1 • Aug 2026',
    type: 'Research Article',
    doi: '10.0000/jses.2026.1104',
    excerpt:
      'Demonstrates an IoT-enabled sensing and anomaly detection approach for continuous bridge monitoring with field validation across three metropolitan corridors.',
    authors: 'S. Patel, N. Wong, D. Alvarez',
  },
  {
    slug: 'esg-disclosure-organizational-resilience',
    title: 'ESG Disclosure Quality and Organizational Resilience in Emerging Markets',
    journal: 'Journal of Business Cultures and Strategic Innovation',
    meta: 'Vol. 1 No. 1 • Aug 2026',
    type: 'Research Article',
    doi: '10.0000/jbcsi.2026.1108',
    excerpt:
      'Examines how transparent ESG reporting practices correlate with strategic resilience during technology and regulatory disruption.',
    authors: 'E. Collins, F. Santos, J. Ibrahim',
  },
  {
    slug: 'antimicrobial-stewardship-one-health-surveillance',
    title: 'Integrated Antimicrobial Stewardship Through One Health Surveillance',
    journal: 'Journal of One Health Advances',
    meta: 'Vol. 1 No. 1 • Jul 2026',
    type: 'Research Article',
    doi: '10.0000/joha.2026.1102',
    excerpt:
      'Presents a cross-sector surveillance model linking veterinary, clinical, and environmental data for earlier antimicrobial resistance response.',
    authors: 'R. Teo, H. Banerjee, C. Moreau',
  },
  {
    slug: 'circular-economy-waste-valorization-cities',
    title: 'Circular Economy Pathways for Urban Waste Valorization',
    journal: 'Journal of Sustainable Systems and Green Tech',
    meta: 'Vol. 1 No. 1 • Jul 2026',
    type: 'Review Article',
    doi: '10.0000/jssgt.2026.1105',
    excerpt:
      'Synthesizes techno-economic and life-cycle evidence for industrial symbiosis models that convert municipal waste streams into higher-value materials.',
    authors: 'M. Hasan, K. Silva',
  },
  {
    slug: 'digital-forensics-cloud-artifact-integrity',
    title: 'Preserving Cloud Artifact Integrity in Digital Forensic Investigations',
    journal: 'Journal of Forensic Analysis, Crime, Technology & Science',
    meta: 'Vol. 1 No. 1 • Jun 2026',
    type: 'Research Article',
    doi: '10.0000/facts.2026.1103',
    excerpt:
      'Evaluates chain-of-custody and integrity verification methods for volatile cloud evidence in multi-tenant environments.',
    authors: 'J. Cruz, A. Petrov, L. Mendoza',
  },
]

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
  {
    slug: 'race',
    title: 'Revolutionary Advances in Computing and Electronics',
    issn: 'ISSN forthcoming',
    eIssn: 'E-ISSN forthcoming',
    area: 'Computing & Electronics',
    access: 'Open Access',
    frequency: 'Continuous',
    editor: 'Editorial Board',
    reviewType: 'Single-blind peer review',
    license: 'CC BY 4.0',
    scope:
      'RACE publishes original, peer-reviewed research addressing foundational and cutting-edge developments in computing and electronics—including AI, cybersecurity, embedded systems, IoT, electronics design, robotics, quantum computing, communication networks, antenna and 6G systems, sustainable engineering, and interdisciplinary applications.',
    metrics: [
      { label: 'Access model', value: 'APC-free OA' },
      { label: 'License', value: 'CC BY 4.0' },
      { label: 'Review model', value: 'Single-blind' },
    ],
    board: [
      'Editor-in-Chief: Appointed editorial leadership',
      'Associate Editors: Computing systems and electronics',
      'International advisory board across AI, networks, and embedded systems',
    ],
    topics: [
      'Artificial intelligence and machine learning',
      'Cybersecurity and secure systems',
      'Embedded systems and IoT',
      'Robotics and quantum computing',
      'Communication networks and 6G',
      'Sustainable and interdisciplinary engineering',
    ],
    quickLinks: ['Aims & Scope', 'Current Issue', 'Author Guidelines', 'Submit Manuscript'],
  },
  {
    slug: 'jses',
    title: 'Journal of Smart Engineering Systems',
    issn: 'ISSN forthcoming',
    eIssn: 'E-ISSN forthcoming',
    area: 'Smart Engineering',
    access: 'Open Access',
    frequency: 'Continuous',
    editor: 'Editorial Board',
    reviewType: 'Single-blind peer review',
    license: 'CC BY 4.0',
    scope:
      'JSES provides a platform for peer-reviewed research bridging fundamental advances and practical applications across civil, mechanical, energy, and materials engineering, with emphasis on AI-driven infrastructure, IoT-enabled monitoring, renewable energy systems, smart materials, and ethical governance of engineered systems.',
    metrics: [
      { label: 'Access model', value: 'APC-free OA' },
      { label: 'License', value: 'CC BY 4.0' },
      { label: 'Review model', value: 'Single-blind' },
    ],
    board: [
      'Editor-in-Chief: Appointed editorial leadership',
      'Associate Editors: Civil, mechanical, and energy systems',
      'Board members spanning smart infrastructure and materials',
    ],
    topics: [
      'AI-driven infrastructure',
      'IoT-enabled structural monitoring',
      'Renewable energy systems',
      'Smart materials',
      'Human-centric automation',
      'Ethical governance of engineered systems',
    ],
    quickLinks: ['Aims & Scope', 'Issue Archive', 'Policies', 'Submit Manuscript'],
  },
  {
    slug: 'jbcsi',
    title: 'Journal of Business Cultures and Strategic Innovation',
    issn: 'ISSN forthcoming',
    eIssn: 'E-ISSN forthcoming',
    area: 'Business & Strategy',
    access: 'Open Access',
    frequency: 'Continuous',
    editor: 'Editorial Board',
    reviewType: 'Double-blind peer review',
    license: 'CC BY 4.0',
    scope:
      'JBCSI publishes theoretical and applied research on ESG strategies, behavioral economics, digital workplaces, cross-cultural leadership, sustainable business models, digital transformation, and organizational resilience.',
    metrics: [
      { label: 'Access model', value: 'Platinum OA' },
      { label: 'License', value: 'CC BY 4.0' },
      { label: 'Review model', value: 'Double-blind' },
    ],
    board: [
      'Editor-in-Chief: Appointed editorial leadership',
      'Associate Editors: Strategy, culture, and innovation',
      'International board across management and organizational studies',
    ],
    topics: [
      'ESG and sustainable business models',
      'Cross-cultural leadership',
      'Digital transformation',
      'Organizational resilience',
      'Behavioral economics',
      'Strategic innovation',
    ],
    quickLinks: ['Aims & Scope', 'Current Issue', 'Author Guidelines', 'Submit Manuscript'],
  },
  {
    slug: 'joha',
    title: 'Journal of One Health Advances',
    issn: 'ISSN forthcoming',
    eIssn: 'E-ISSN forthcoming',
    area: 'One Health',
    access: 'Open Access',
    frequency: 'Continuous',
    editor: 'Editorial Board',
    reviewType: 'Single-blind peer review',
    license: 'CC BY 4.0',
    scope:
      'JOHA advances One Health research spanning zoonotic disease prevention, antimicrobial stewardship, precision livestock farming, veterinary innovation, and environmental health—bridging human medicine, veterinary science, and ecosystem studies.',
    metrics: [
      { label: 'Access model', value: 'APC-free OA' },
      { label: 'First decision', value: '~21 days avg.' },
      { label: 'Review model', value: 'Interdisciplinary' },
    ],
    board: [
      'Editor-in-Chief: Appointed editorial leadership',
      'Dual-domain review across medical and veterinary expertise',
      'Advisors in epidemiology, environmental health, and livestock systems',
    ],
    topics: [
      'Zoonotic disease prevention',
      'Antimicrobial stewardship',
      'Precision livestock farming',
      'Veterinary telemedicine and diagnostics',
      'Environmental health and climate adaptation',
      'Pandemic preparedness',
    ],
    quickLinks: ['Aims & Scope', 'Current Issue', 'Author Guidelines', 'Submit Manuscript'],
  },
  {
    slug: 'jssgt',
    title: 'Journal of Sustainable Systems and Green Tech',
    issn: 'ISSN forthcoming',
    eIssn: 'E-ISSN forthcoming',
    area: 'Sustainability',
    access: 'Open Access',
    frequency: 'Continuous',
    editor: 'Editorial Board',
    reviewType: 'Single-blind peer review',
    license: 'CC BY 4.0',
    scope:
      'JSSGT publishes actionable sustainability research on renewable energy systems, circular economy, climate-resilient infrastructure, sustainable materials, and policy frameworks aligned with the Sustainable Development Goals.',
    metrics: [
      { label: 'Access model', value: 'APC-free OA' },
      { label: 'License', value: 'CC BY 4.0' },
      { label: 'Focus', value: 'Impact-ready research' },
    ],
    board: [
      'Editor-in-Chief: Appointed editorial leadership',
      'Associate Editors: Energy, materials, and policy',
      'Board spanning sustainability science and green technology',
    ],
    topics: [
      'Renewable energy and storage',
      'Circular economy and waste valorization',
      'Climate-resilient infrastructure',
      'Sustainable materials',
      'Carbon policy and just transition',
      'Life-cycle and techno-economic analysis',
    ],
    quickLinks: ['Aims & Scope', 'Issue Archive', 'Policies', 'Submit Manuscript'],
  },
  {
    slug: 'facts',
    title: 'Journal of Forensic Analysis, Crime, Technology & Science',
    issn: 'ISSN forthcoming',
    eIssn: 'E-ISSN forthcoming',
    area: 'Forensic Science',
    access: 'Open Access',
    frequency: 'Continuous',
    editor: 'Editorial Board',
    reviewType: 'Double-blind peer review',
    license: 'CC BY 4.0',
    scope:
      'FACTS covers forensic biology, digital forensics, crime scene investigation, forensic chemistry, forensic medicine, criminalistics, cybercrime investigation, behavioral forensics, forensic anthropology, legal medicine, and emerging forensic technologies.',
    metrics: [
      { label: 'Access model', value: 'APC-free OA' },
      { label: 'License', value: 'CC BY 4.0' },
      { label: 'Review model', value: 'Double-blind' },
    ],
    board: [
      'Editor-in-Chief: Appointed editorial leadership',
      'Associate Editors: Digital forensics and forensic science',
      'Board members across crime analysis, law, and laboratory science',
    ],
    topics: [
      'Digital forensics and cybercrime',
      'Crime scene investigation',
      'Forensic biology and chemistry',
      'Forensic medicine and anthropology',
      'Evidence evaluation frameworks',
      'Emerging forensic technologies',
    ],
    quickLinks: ['Aims & Scope', 'Current Issue', 'Author Guidelines', 'Submit Manuscript'],
  },
]

export const issueArchives: IssueArchive[] = [
  {
    journalSlug: 'race',
    volume: 'Volume 1',
    issue: 'Issue 2',
    year: '2026',
    highlight: 'Special cluster on edge AI, secure IoT, and next-generation networks.',
  },
  {
    journalSlug: 'race',
    volume: 'Volume 1',
    issue: 'Issue 1',
    year: '2026',
    highlight: 'Inaugural issue on computing systems and electronics innovation.',
  },
  {
    journalSlug: 'jses',
    volume: 'Volume 1',
    issue: 'Issue 1',
    year: '2026',
    highlight: 'Smart infrastructure monitoring and sustainable engineering systems.',
  },
  {
    journalSlug: 'jbcsi',
    volume: 'Volume 1',
    issue: 'Issue 1',
    year: '2026',
    highlight: 'ESG strategy, digital workplaces, and organizational resilience.',
  },
  {
    journalSlug: 'joha',
    volume: 'Volume 1',
    issue: 'Issue 1',
    year: '2026',
    highlight: 'One Health surveillance and antimicrobial stewardship.',
  },
  {
    journalSlug: 'jssgt',
    volume: 'Volume 1',
    issue: 'Issue 1',
    year: '2026',
    highlight: 'Circular economy and renewable energy systems.',
  },
  {
    journalSlug: 'facts',
    volume: 'Volume 1',
    issue: 'Issue 1',
    year: '2026',
    highlight: 'Digital forensic integrity and crime-technology interfaces.',
  },
]

export const articleDetails: ArticleDetail[] = [
  {
    slug: 'edge-ai-framework-iot-industrial-monitoring',
    title: 'An Edge-AI Framework for Real-Time Industrial IoT Monitoring',
    authors: ['A. Rahman', 'L. Chen', 'M. Okonkwo'],
    journal: 'Revolutionary Advances in Computing and Electronics',
    doi: '10.0000/race.2026.1201',
    published: 'September 2026',
    volumeIssue: 'Vol. 1 No. 2',
    type: 'Research Article',
    abstract:
      'Industrial monitoring increasingly depends on low-latency inference close to the sensor edge. This paper presents an Edge-AI framework that coordinates on-device models, selective cloud escalation, and bandwidth-aware telemetry. Experiments across multi-sensor factory deployments show reduced response time while maintaining classification performance under constrained network conditions.',
    keywords: ['Edge AI', 'Industrial IoT', 'Real-time monitoring', 'Latency optimization'],
  },
  {
    slug: 'ai-driven-structural-health-monitoring-bridges',
    title: 'AI-Driven Structural Health Monitoring for Urban Bridges',
    authors: ['S. Patel', 'N. Wong', 'D. Alvarez'],
    journal: 'Journal of Smart Engineering Systems',
    doi: '10.0000/jses.2026.1104',
    published: 'August 2026',
    volumeIssue: 'Vol. 1 No. 1',
    type: 'Research Article',
    abstract:
      'This study develops an AI-assisted structural health monitoring approach for urban bridges using distributed IoT sensing and anomaly detection. Field validation across three metropolitan corridors demonstrates practical detection of early structural deviations and supports maintenance prioritization.',
    keywords: ['Structural health monitoring', 'Smart infrastructure', 'IoT', 'Anomaly detection'],
  },
  {
    slug: 'esg-disclosure-organizational-resilience',
    title: 'ESG Disclosure Quality and Organizational Resilience in Emerging Markets',
    authors: ['E. Collins', 'F. Santos', 'J. Ibrahim'],
    journal: 'Journal of Business Cultures and Strategic Innovation',
    doi: '10.0000/jbcsi.2026.1108',
    published: 'August 2026',
    volumeIssue: 'Vol. 1 No. 1',
    type: 'Research Article',
    abstract:
      'Using multi-country firm evidence, this article analyzes the relationship between ESG disclosure quality and organizational resilience amid technological and regulatory disruption. Findings highlight governance transparency and cross-cultural leadership practices as key mediators of strategic adaptation.',
    keywords: ['ESG', 'Organizational resilience', 'Disclosure quality', 'Emerging markets'],
  },
  {
    slug: 'antimicrobial-stewardship-one-health-surveillance',
    title: 'Integrated Antimicrobial Stewardship Through One Health Surveillance',
    authors: ['R. Teo', 'H. Banerjee', 'C. Moreau'],
    journal: 'Journal of One Health Advances',
    doi: '10.0000/joha.2026.1102',
    published: 'July 2026',
    volumeIssue: 'Vol. 1 No. 1',
    type: 'Research Article',
    abstract:
      'Antimicrobial resistance requires coordinated surveillance across human, animal, and environmental domains. This paper proposes an integrated One Health stewardship model and evaluates its feasibility for earlier detection and response in mixed clinical–veterinary settings.',
    keywords: ['One Health', 'Antimicrobial resistance', 'Surveillance', 'Stewardship'],
  },
  {
    slug: 'circular-economy-waste-valorization-cities',
    title: 'Circular Economy Pathways for Urban Waste Valorization',
    authors: ['M. Hasan', 'K. Silva'],
    journal: 'Journal of Sustainable Systems and Green Tech',
    doi: '10.0000/jssgt.2026.1105',
    published: 'July 2026',
    volumeIssue: 'Vol. 1 No. 1',
    type: 'Review Article',
    abstract:
      'This review synthesizes techno-economic and life-cycle evidence for urban waste valorization pathways. It compares industrial symbiosis models and identifies policy conditions that improve environmental and social outcomes in city-scale circular systems.',
    keywords: ['Circular economy', 'Waste valorization', 'Life-cycle assessment', 'Urban sustainability'],
  },
  {
    slug: 'digital-forensics-cloud-artifact-integrity',
    title: 'Preserving Cloud Artifact Integrity in Digital Forensic Investigations',
    authors: ['J. Cruz', 'A. Petrov', 'L. Mendoza'],
    journal: 'Journal of Forensic Analysis, Crime, Technology & Science',
    doi: '10.0000/facts.2026.1103',
    published: 'June 2026',
    volumeIssue: 'Vol. 1 No. 1',
    type: 'Research Article',
    abstract:
      'Cloud environments challenge traditional forensic acquisition because evidence can be volatile, distributed, and multi-tenant. This article evaluates integrity verification and chain-of-custody methods for cloud artifacts and proposes practical controls for investigative reliability.',
    keywords: ['Digital forensics', 'Cloud evidence', 'Chain of custody', 'Integrity verification'],
  },
]

export const cfpItems: InfoCard[] = [
  {
    title: 'Large Language Models for Intelligent Healthcare',
    summary:
      'Invites original research on LLMs for clinical decision support, biomedical text mining, and trustworthy AI in healthcare settings.',
    meta: 'Deadline: 31 Dec 2026 · JOHA / Computing track',
    badge: 'Open',
  },
  {
    title: 'Smart Infrastructure and Sustainable Cities',
    summary:
      'Welcomes interdisciplinary papers on AI-driven infrastructure, climate resilience, and green urban systems.',
    meta: 'Deadline: 20 Jan 2027 · JSES / JSSGT',
    badge: 'Open',
  },
  {
    title: 'Digital Transformation and Organizational Resilience',
    summary:
      'Seeks contributions on ESG strategy, cross-cultural leadership, and innovation under technological disruption.',
    meta: 'Deadline: 15 Feb 2027 · JBCSI',
    badge: 'Open',
  },
  {
    title: 'Advances in Digital Forensics and Cybercrime Investigation',
    summary:
      'Calls for research on cloud forensics, evidence integrity, cybercrime analytics, and emerging forensic technologies.',
    meta: 'Deadline: 28 Feb 2027 · FACTS',
    badge: 'Open',
  },
]

export const books: InfoCard[] = [
  {
    title: 'Handbook of Digital Scholarship Systems',
    summary:
      'A reference volume on platform design, metadata workflows, peer-review operations, and digital dissemination for academic publishers.',
    meta: 'ISBN 978-1-0000-2026-4',
    badge: 'Forthcoming',
  },
  {
    title: 'Research Methods for Interdisciplinary Innovation',
    summary:
      'Practical guidance for mixed-methods research across computing, engineering, health, and social sciences.',
    meta: 'ISBN 978-1-0000-2026-8',
    badge: '2026 Release',
  },
  {
    title: 'Open Knowledge and Ethical Publishing Practice',
    summary:
      'Explores COPE-aligned ethics, open licensing, author rights, and responsible dissemination in modern scholarly communication.',
    meta: 'ISBN 978-1-0000-2027-1',
    badge: 'Monograph',
  },
]

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
  {
    title: 'International Conference on Digital Learning Systems 2027',
    summary:
      'Partner proceedings volume for peer-reviewed conference papers on educational systems, AI, and interactive platforms.',
    meta: 'Kuala Lumpur • Mar 2027',
    badge: 'Open CFP',
  },
]

export const specialIssues: InfoCard[] = [
  {
    title: 'Large Language Models for Intelligent Healthcare',
    summary:
      'Explores LLM methods for bioinformatics, clinical decision support, and trustworthy intelligent healthcare systems.',
    meta: 'Submission deadline: 31 Dec 2026',
    badge: 'Open',
  },
  {
    title: 'Smart Infrastructure and Sustainable Cities',
    summary:
      'Links engineering systems, civic planning, renewable energy, and climate-resilient urban design.',
    meta: 'Submission deadline: 20 Jan 2027',
    badge: 'Open',
  },
  {
    title: 'Digital Transformation and Organizational Resilience',
    summary:
      'Focuses on ESG strategy, cultural leadership, and innovation under technological disruption.',
    meta: 'Submission deadline: 15 Feb 2027',
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
    title: 'DMPedia public publishing portal refreshed for journal discovery',
    summary:
      'The new portal presents journals, articles, policies, and proceedings with clearer navigation and stronger academic presentation.',
    meta: 'Sep 2026',
    badge: 'Announcement',
  },
  {
    title: 'Open call: LLMs for Intelligent Healthcare',
    summary:
      'A thematic call invites research on trustworthy AI methods for clinical and biomedical applications.',
    meta: 'Sep 2026',
    badge: 'Call for Papers',
  },
  {
    title: 'Conference series DMP-LNCSE and DMP-LNMR open for partner events',
    summary:
      'Organizers can publish peer-reviewed proceedings with ISBN assignment and optional DOI support.',
    meta: 'Aug 2026',
    badge: 'Update',
  },
]
