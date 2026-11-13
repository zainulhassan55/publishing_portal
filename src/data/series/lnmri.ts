import type { Series, SeriesVolume } from '@/types/publishing'
import { editorTable, editorialEmail, page, plain, seriesDigitalPublication, seriesFacts, seriesSameStandards } from '../pages'
import { seriesTemplates } from '../templates'

/**
 * Introduction, aims and scope, topics, the proposal and access pages follow
 * the publisher's "Book series info updates" (November 2026): volumes are
 * e-books only, each under an open access or a subscription model. Edit the
 * wording only on the publisher's instruction.
 */
const intro =
  'Lecture Notes in Multidisciplinary Research and Innovation (LNMRI) publishes research monographs, edited volumes and conference proceedings that bring together perspectives from different disciplines. The series welcomes original research, new methods and critical syntheses addressing scientific, technological and societal questions. All volumes are published exclusively as e-books. Each volume’s publication page identifies its access model and licence or reader access terms.'

const topics = [
  'Artificial intelligence, society and digital transformation',
  'Healthcare technologies, public health and wellbeing',
  'Education, learning technologies and skills development',
  'Business innovation, entrepreneurship and digital economies',
  'Sustainability, environmental research and resilient infrastructure',
  'Technology policy, governance, ethics and inclusion',
  'Digital humanities, communication and social research',
  'Research methods, open science and interdisciplinary collaboration',
]

const editors = [
  { name: 'Kwok Tai Chui', affiliation: 'Hong Kong Metropolitan University, Hong Kong' },
]

/**
 * Volumes supplied by the publisher ("Book series changes", November 2026).
 * Expected dates and page counts confirmed by the publisher (November 2026).
 * Volumes 3 (Digital Health) and 4 (Generative AI in Education) were
 * withdrawn from the list for now.
 */
const volumes: SeriesVolume[] = [
  {
    slug: 'agentic-generative-ai-intelligent-automation',
    number: 1,
    title: 'Agentic and Generative Artificial Intelligence for Intelligent Automation',
    expectedDate: 'December 2026',
    cover: '/images/covers/volumes/lnmri-v1-agentic-generative-ai-authors.jpg', // "Authors:" artwork (November 2026)
    publishedDate: null,
    doi: null,
    isbn: '978-626-93492-1-0', // assigned by the NCL ISBN Center (e-book, PDF), November 2026
    pages: 150,
    // Description, coverage, keywords, readership and biographies from the
    // publisher's "Agentic and Generative Artificial Intelligence … _new.docx" (November 2026).
    // An authored book: shown as "Authors", not "Edited by" (publisher, November 2026).
    contributorRole: 'authors',
    editors: [
      {
        name: 'Kwok Tai Chui',
        affiliation: 'Hong Kong Metropolitan University, Hong Kong',
        biography: [
          'Kwok Tai Chui (Member IEEE) is an associate professor in the Department of Electronic Engineering and Computer Science at Hong Kong Metropolitan University. He received a first-class B.Eng. in electronic and communication engineering, with a minor in business intelligence, and a Ph.D. in electronic engineering from City University of Hong Kong. He worked as a senior data scientist at an Internet of Things company before joining Hong Kong Metropolitan University as a research assistant professor in 2019, later becoming an assistant professor and then an associate professor. His research covers computational intelligence, data science, machine learning, energy monitoring and management, intelligent transportation, smart metering, and healthcare.',
          'He has published more than 300 works, including journal papers, conference papers, book chapters, and edited books. He is a managing editor of the International Journal on Semantic Web and Information Systems, a topic editor of Sensors, and an associate editor of the International Journal of Asian Business and Information Management and the International Journal of Energy Optimization and Engineering. He has also served as a guest editor for Future Generation Computer Systems, the Journal of Innovation and Knowledge, Sustainability, Sensors, Energies, Applied Sciences, and the Journal of Internet Technology. He won first prize in the IEEE Hong Kong Section postgraduate student paper contest in 2013, second prize in the 2014 IEEE Region 10 Student Paper Contest, and best-paper awards at the IEEE International Conference on Consumer Electronics–China in 2014 and 2015. In February 2025, Hong Kong Metropolitan University awarded him its Silver Prize for an enhanced transfer-learning algorithm aimed at small datasets.',
        ],
      },
      {
        name: 'Akshat Gaurav',
        affiliation: 'Ronin Institute, USA',
        biography: [
          'Akshat Gaurav is a Senior IEEE Member and a recognized researcher listed in the Stanford–Elsevier Top 2% Scientists (Single-Year 2025, 2024) in Artificial Intelligence and Image Processing. He is currently a Senior Researcher at the International Center for AI and Cyber Security Research and Innovations, Asia University, Taiwan. His research spans cybersecurity, AI-driven attack detection, phishing prevention, semantic web technologies, and intelligent IoT systems. He has authored an extensive body of research published in leading venues including IEEE Transactions, Elsevier, Springer, IGI Global, and ACM.',
          'His work has earned multiple accolades, including Best Paper Awards at IEEE/ACM Cluster, Cloud and Internet Computing, and International AI & IoT conferences, as well as Best Oral Presentation at GCCE 2025. Mr. Gaurav also plays active leadership roles in the research community. He served as Session Chair at IEEE GLOBECOM 2025 and previously as Session Co-Chair at IEEE GCCE 2022. In addition, he contributes as a Technical Program Committee (TPC) member and reviewer for premier venues, including IEEE INFOCOM, GLOBECOM, ICC, ICCE, ANTS, and several high-impact IEEE Transactions and ACM journals.',
        ],
      },
    ],
    description: [
      'Agentic and Generative Artificial Intelligence for Intelligent Automation offers a comprehensive exploration of advances in Agentic AI and Generative Artificial Intelligence (GenAI), focusing on developing intelligent, adaptive, and autonomous systems that can transform traditional automation processes. The book examines how generative models, autonomous agents, and intelligent decision-making frameworks can be integrated to enhance efficiency, flexibility, and adaptability across complex digital and industrial environments.',
      'Unlike conventional automation systems that rely on predefined rules and workflows, Agentic and Generative AI enable intelligent systems to generate content, reason, plan, make decisions, execute tasks, and dynamically respond to changing environments. This book explores the convergence of large language models (LLMs), foundation models, multi-agent systems, reinforcement learning, and intelligent workflow orchestration to support autonomous operations, collaborative problem-solving, and human–AI interaction.',
      'The book brings together fundamental concepts, advanced architectures, enabling technologies, and practical applications of Agentic and Generative AI in intelligent automation. It examines generative modeling techniques, agent-based architectures, autonomous task planning, adaptive decision-making, multi-agent collaboration, and trustworthy AI frameworks. Particular attention is given to applications in smart manufacturing, cybersecurity, healthcare, robotics, intelligent IoT, business process automation, and next-generation digital systems.',
    ],
    coverage: {
      intro: 'The many academic areas covered in this publication include, but are not limited to:',
      topics: [
        'Generative AI and autonomous agent architectures.',
        'LLMs and foundation models for automation.',
        'AI-driven content and knowledge generation.',
        'Agentic reasoning, planning, and decision-making.',
        'Multi-agent collaboration and distributed intelligence.',
        'Agentic workflows and process automation.',
        'Reinforcement learning and adaptive intelligence.',
        'Human–AI collaboration and trustworthy automation.',
        'Generative and agentic AI for smart manufacturing.',
        'Automation in cybersecurity, healthcare, robotics, and IoT.',
        'Emerging challenges and future research directions.',
      ],
    },
    keywords: [
      'Agentic Artificial Intelligence',
      'Generative Artificial Intelligence',
      'Intelligent Automation',
      'Autonomous Intelligent Agents',
      'Large Language Models',
    ],
    // Table of contents from the publisher's ToC file (November 2026).
    contents: [
      'Foundations of Intelligent Automation: Generative Models, Autonomous Agents, and Workflows',
      'Large Language Models for Automation: Prompt Design, Retrieval-Augmented Generation, and Structured Outputs',
      'Designing AI Agents: Architectures, Tool Use, Memory, and State Management',
      'Reasoning and Planning: Task Decomposition, Decision-Making, and Learning from Feedback',
      'Multi-Agent Systems: Communication, Task Allocation, and Coordination',
      'Building Agentic Workflows: Process Design, System Integration, and Error Recovery',
      'Trustworthy Automation: Security, Privacy, Explainability, and Human Oversight',
      'Evaluation and Deployment: Task Success, Reliability, Cost, and Monitoring',
      'Applied Intelligent Automation: Case Studies in Manufacturing, Healthcare, and Cyber Defense',
    ],
    readership:
      'Researchers, academics, postgraduate students, and industry professionals in agentic AI, generative artificial intelligence, intelligent automation, and intelligent decision-making.',
  },
  {
    slug: 'smart-systems-advanced-computing-syscom-2026',
    number: 2,
    title: 'Emerging Research in Smart Systems and Advanced Computing: SysCom 2026 Poster Proceedings',
    expectedDate: 'January 2027',
    cover: '/images/covers/volumes/lnmri-v2-syscom-2026.jpg',
    publishedDate: null,
    doi: null,
    isbn: null,
    pages: 400,
    // Description, coverage, keywords, readership and biographies from the
    // publisher's "Emerging Research in Smart Systems … _2.docx" (November 2026).
    editors: [
      {
        name: 'Nadia Nedjah',
        affiliation: 'State University of Rio de Janeiro, Brazil',
        biography: [
          'Nadia Nedjah is a full professor in the Department of Electronics Engineering and Telecommunications at the State University of Rio de Janeiro. She earned a computer engineering degree (1987) and a master’s degree in computer systems (1990) from the University of Annaba, Algeria, and a PhD in computation (1997) from the University of Manchester Institute of Science and Technology. Her research covers embedded systems, automatic synthesis of digital circuits, FPGA architectures, encryption hardware, intelligent systems, swarm intelligence, neural networks, machine learning, and swarm robotics. She is the author of three books, more than 120 journal articles, about 40 book chapters, and about 180 conference papers, and she has edited more than 48 books and organised about 25 journal special issues, including issues of Applied Soft Computing, Neurocomputing, and Computers and Electrical Engineering.',
          'Since 2007 she has been editor-in-chief of the International Journal of Innovative Computing Applications and the International Journal of High Performance Systems Architecture, both published by Inderscience, and she is an associate editor of journals including the Journal of Ambient Intelligence and Humanized Computing, the International Journal of Bio-inspired Computation, the International Journal of Electronics, Microprocessors and Microsystems, Integration: The VLSI Journal, and IET Computers and Digital Techniques. She has received five UERJ Prociência scholarships (2009–2024), five CNPq research-productivity scholarships (2007–2026), and three FAPERJ Scientist of Our State awards (2015–2025). She served on the board of the Brazilian Society of Computational Intelligence from 2015 to 2025, coordinated the Intelligent Systems research group in UERJ’s postgraduate programme in electronic engineering, and is a permanent member of Algeria’s National Economic, Social and Environmental Council.',
        ],
      },
      {
        name: 'Brij B. Gupta',
        affiliation: 'Asia University, Taiwan',
        biography: [
          'Brij B. Gupta (Senior Member, IEEE) is a distinguished professor in the Department of Computer Science and Information Engineering and the director of the International Center for AI and Cyber Security Research and Innovations (CCRI) at Asia University, Taiwan. He also serves as an adjunct professor at the University of Ottawa, Canada, and Korea University, South Korea. Professor Gupta has a PhD in computer science and engineering and over 20 years of academic and research experience. He has authored more than 500 high-quality research papers, over 35 books, and holds multiple patents. He is recognized globally for his outstanding research contributions, and since 2020, he has been consistently ranked among the top 2% of scientists worldwide by Stanford University and Elsevier. He is also a Clarivate Highly Cited Researcher (top 1%) in computer science, reflecting his exceptional research impact.',
          'Professor Gupta has received numerous prestigious national and international awards, including the Canadian Commonwealth Scholarship, Faculty Research Fellowship Award, IEEE GCCE Outstanding Paper Award, and multiple Best Paper and Best Faculty Awards. He actively contributes to the global research community through editorial leadership roles, serving as editor-in-chief and editorial board member for several high-impact international journals. He has also served as a Distinguished Lecturer of the IEEE Consumer Technology Society and as a Member-at-Large on its Board of Governors, along with key roles in organizing and chairing numerous top-tier IEEE conferences.',
          'His research spans artificial intelligence, cybersecurity, blockchain technologies, cloud and edge computing, intrusion detection systems, cyber-physical systems, and social network analysis. He has been actively involved in international collaborations, interdisciplinary research, and mentoring students and researchers at the undergraduate, postgraduate, and doctoral levels.',
        ],
      },
    ],
    description: [
      'Emerging Research in Smart Systems and Advanced Computing: Selected Papers from SysCom 2026 Poster Proceedings brings together selected papers from the poster programme of the 3rd International Conference on Smart System & Advanced Computing (SysCom 2026), scheduled for December 19–20, 2026, at Asia University, Taichung, Taiwan. The volume highlights emerging ideas, preliminary research findings, and practical approaches to developing efficient, adaptive, secure, and sustainable computing systems.',
      'Topics span machine learning, deep learning, generative AI, intelligent IoT, cybersecurity, cloud and edge computing, big data analytics, and advanced computational methods. The selected contributions explore applications in healthcare, transportation, industrial automation, robotics, smart cities, and sustainable digital infrastructure, addressing challenges across diverse real-world environments.',
      'Reflecting the exploratory nature of poster presentations, this collection encourages discussion, knowledge exchange, and further research. It offers researchers, academics, postgraduate students, and industry practitioners a resource for exploring emerging methods, applications, and research directions in smart systems and advanced computing.',
    ],
    coverage: {
      intro: 'The many academic areas covered in this publication include, but are not limited to:',
      topics: [
        'AI, machine learning, and deep learning.',
        'Generative AI, LLMs, and foundation models.',
        'Agentic AI and autonomous systems.',
        'Smart systems and computing architectures.',
        'IoT and industrial IoT.',
        'Cybersecurity, network security, and privacy.',
        'Cloud, edge, and fog computing.',
        'Big data analytics and decision support.',
        'Federated learning and distributed computing.',
        'Blockchain and decentralized applications.',
        'Intelligent automation and cyber-physical systems.',
        'Smart healthcare and medical AI.',
        'Intelligent transportation and smart mobility.',
        'Smart cities, homes, and sustainable infrastructure.',
        'Robotics, embedded systems, and autonomy.',
        'Computer vision and pattern recognition.',
        'NLP and intelligent information systems.',
        'Next-generation networks and 5G/6G.',
        'Digital twins and smart manufacturing.',
        'Human–computer interaction and human-centered computing.',
        'Software engineering and intelligent software.',
        'High-performance and advanced computing.',
        'Green computing and energy-efficient systems.',
        'Emerging smart systems and computing applications.',
      ],
    },
    keywords: [
      'Smart Systems',
      'Advanced Computing',
      'AI',
      'IoT',
      'Cybersecurity',
      'Cloud–Edge Computing',
      'Big Data',
      'Blockchain',
      'Robotics',
      'Digital Twins',
      'Sustainable Technologies',
    ],
    contents: [],
    readership:
      'Researchers, academics, postgraduate students, and industry professionals in smart systems, advanced computing, AI, cybersecurity, IoT, and intelligent automation.',
  },
]

export const lnmri: Series = {
  slug: 'lnmri', // was 'lnmr' until November 2026; old URLs redirect (next.config.ts)
  code: 'LNMRI',
  title: 'Lecture Notes in Multidisciplinary Research and Innovation',
  kind: 'book',
  subjectKey: 'interdisciplinary',
  scope: intro,
  topics,
  issn: null,
  profile: {
    kicker: 'LNMRI · A NextGenIQ Press Book Series',
    cover: '/images/series/cover-lnmr.svg',
    tile: '/images/covers/lnmr.jpg',
    badges: ['E-books only', 'Peer reviewed', 'Open access and subscription options'],
    intro,
    ctas: [
      { label: 'Propose a volume', pageId: 'propose-volume' },
      { label: 'Editorial board', pageId: 'editorial-board' },
      { label: 'Forthcoming volumes', pageId: 'volumes' },
    ],
    facts: seriesFacts,
    editorsLabel: 'Series editor',
    editors,
  },
  volumes,
  pages: [
    page('aims-scope', 'Aims & scope', 'Aims and scope', 'The research areas covered by LNMRI.', [
      {
        title: '',
        paragraphs: [
          'Lecture Notes in Multidisciplinary Research and Innovation (LNMRI) publishes peer-reviewed research that draws on more than one discipline to answer a shared question. A volume might examine how AI changes clinical decision-making, how digital platforms affect access to education, or how engineering and public policy shape the resilience of infrastructure.',
          'The series welcomes research monographs, edited volumes and conference proceedings in areas including:',
        ],
        bullets: topics,
        topicList: true,
        closing: [
          'Each volume should explain what the participating disciplines contribute and how their findings fit together. The intended readership includes researchers, postgraduate students, practitioners and policymakers.',
          'All volumes are published exclusively as e-books under an open access or subscription model.',
        ],
      },
    ]),
    page('editorial-board', 'Editorial board', 'Editorial board', 'The Series Editor of LNMRI.', [
      { title: 'Series editor', table: editorTable(editors), paragraphs: [] },
    ]),
    page('propose-volume', 'Propose a volume', 'Propose a volume', 'What to include in an LNMRI volume proposal.', [
      plain(
        [
          'LNMRI welcomes proposals for research monographs, edited volumes and conference proceedings throughout the year. Please describe the central research question, the disciplines involved and the readership the volume will serve.',
          'All accepted volumes are published as e-books. When submitting your proposal, please indicate your preferred publication model.',
          '**Preferred publication model**',
        ],
        {
        bullets: ['Open access', 'Subscription access', 'To be discussed with the publisher'],
        closing: [
          `Email ${editorialEmail} with the subject “LNMRI Proposal — [Title]”. Proposal approval does not guarantee acceptance of the completed manuscript.`,
        ],
        },
      ),
    ]),
    page(
      'author-editor-guidelines',
      'Author & editor guidelines',
      'Author and Editor Guidelines',
      'Manuscript requirements for LNMRI authors and volume editors.',
      [
        plain([
          'Manuscripts must be original, clearly structured, and appropriately referenced. Authors should explain specialised terminology, justify their methods, present supporting evidence, and acknowledge limitations.',
          'Contributors must disclose funding, conflicts of interest, and substantive use of generative AI. Ethical approvals, participant consent, and permissions for third-party material must be obtained where required.',
          'Volume editors coordinate contributors, maintain thematic coherence, and ensure that revisions are completed. Formatting requirements will be provided during the proposal process.',
          seriesDigitalPublication,
        ]),
        seriesTemplates('lnmri', 'LNMRI'),
      ],
    ),
    page('peer-review-ethics', 'Peer review & ethics', 'Peer review and ethics', 'How LNMRI volumes are reviewed.', [
      plain([
        'All volumes undergo editorial assessment and independent peer review. Monographs are assessed as complete works; chapters and proceedings papers are reviewed individually, alongside assessment of the volume’s overall coherence.',
        'Where appropriate, reviewers from complementary disciplines assess the contribution. Submissions involving an editor’s own work or a conflict of interest are handled independently. All contributions must comply with NextGenIQ Press publication ethics policies.',
        seriesSameStandards,
      ]),
    ]),
    // The page id (and so the URL /series/lnmri/open-access-fees) is kept so shared links keep working.
    page('open-access-fees', 'Access options & fees', 'Access options and fees', 'Access options and charges for LNMRI volumes.', [
      plain([
        'LNMRI publishes exclusively as e-books. Each volume’s page identifies how readers can access and use it.',
        '**Open access.** Anyone may read, share and adapt open access volumes under the CC BY 4.0 licence with appropriate attribution. Third-party material may carry separate terms, as indicated in its credit line.',
        '**Subscription access.** Subscribers may read these e-books online under the publisher’s subscription terms.',
        '**Fees and waivers.** There is no submission fee. NextGenIQ Press discloses any publication charges, funding arrangements and available waivers before the publishing agreement is signed. Editorial decisions are independent of payment.',
      ]),
    ]),
    page('indexing-abstracting', 'Indexing & abstracting', 'Indexing and Abstracting', 'Indexing status of LNMRI.', []), // Blank until indexing is confirmed (publisher, November 2026).
    page('volumes', 'Forthcoming volumes', 'Forthcoming volumes', 'Forthcoming volumes in LNMRI.', [
      plain([
        'The volumes of LNMRI are listed below; each links to its own page. We currently welcome proposals for monographs, edited collections, and proceedings from conferences, symposia, and workshops within the series scope.',
      ]),
    ]),
    page('contact', 'Contact', 'Contact', 'How to contact LNMRI.', [
      plain([
        `For proposals, proceedings partnerships, and editorial enquiries, contact ${editorialEmail}. Please include LNMRI in the subject line.`,
      ]),
    ]),
  ],
}
