import type { Series, SeriesVolume } from '@/types/publishing'
import { editorTable, editorialEmail, page, plain, seriesDigitalPublication, seriesFacts, seriesSameStandards } from '../pages'
import { seriesTemplates } from '../templates'

/**
 * Text supplied by the publisher (October 2026) and reproduced as given. Aims
 * and scope, topics, the proposal and access pages follow the publisher's "Book
 * series info updates" (November 2026): volumes are e-books only, each under an
 * open access or a subscription model. Edit the wording only on the
 * publisher's instruction.
 */
const intro =
  'Studies in Intelligent Systems and Digital Technologies (SISDT) publishes research monographs, edited volumes, and conference proceedings on artificial intelligence, intelligent systems, and advanced computing. The series welcomes theoretical advances, innovative methods, and applications supported by rigorous analysis and evidence.'

const topics = [
  'Machine learning, generative AI and foundation models',
  'Agentic AI and autonomous systems',
  'Computational intelligence and optimisation',
  'Explainable, responsible, secure and privacy-preserving AI',
  'Data science, knowledge engineering and decision support',
  'Computer vision, natural language processing and multimedia intelligence',
  'Cloud, edge and distributed computing',
  'Quantum and neuromorphic computing',
  'Intelligent IoT, cyber-physical systems and digital twins',
  'Applications in healthcare, education, industry, transportation and sustainability',
]

const editors = [
  { name: 'Nadia Nedjah', affiliation: 'State University of Rio de Janeiro, Brazil' },
]

/** Biographies shared by SISDT books (publisher-supplied). */
const vijayanSugumaran = {
  name: 'Vijayan Sugumaran',
  affiliation: 'Oakland University, USA',
  biography: [
    'Vijayan Sugumaran is Distinguished University Professor and Janke Scholar of Management Information Systems at Oakland University, where he chairs the Department of Decision and Information Sciences, co-directs the Institute for Data Science, and directs the Master of Science in Business Analytics. He joined the faculty in 1999, became a professor in 2007, and was named Distinguished Professor in 2020. He received his Ph.D. in information technology from George Mason University. His research covers big data management and analytics, ontologies and the semantic web, and intelligent and multi-agent systems. He has published more than 350 peer-reviewed articles and has edited twenty books, with work in Information Systems Research, ACM Transactions on Database Systems, Communications of the ACM, and several IEEE transactions.',
    'He is editor-in-chief of the International Journal of Intelligent Information Technologies and the Journal of Web Engineering, and he serves on the editorial boards of eight journals. He is co-principal investigator on a $2 million National Science Foundation grant (2023–2028) to train students in data science and entrepreneurship, and he has also held grants from the Korea Research Foundation and the Research Grants Council of Hong Kong. In 2025 SAS named him a SAS Educator for leadership in data and artificial-intelligence education; student teams he guided won the energy track of the SAS Hackathon in 2024 and the forecasting track in 2023. He received Oakland University’s Research Excellence Award in 2010, was a Fulbright Specialist in 2012, and was a visiting professor at Sogang University in Seoul and an international expert at Shanghai University. He has chaired the Intelligent Agent and Multi-Agent Systems track at the Americas Conference on Information Systems since 1999 and has been program chair of conferences including NLDB, ACIS, and the IEEE International Conference on Big Data Service and Applications.',
  ],
}

const brijGupta = {
  name: 'Brij B. Gupta',
  affiliation: 'Asia University, Taiwan',
  biography: [
    'Brij B. Gupta (Senior Member, IEEE) is a distinguished professor in the Department of Computer Science and Information Engineering and the director of the International Center for AI and Cyber Security Research and Innovations (CCRI) at Asia University, Taiwan. He also serves as an adjunct professor at the University of Ottawa, Canada, and Korea University, South Korea. Professor Gupta has a PhD in computer science and engineering and over 20 years of academic and research experience. He has authored more than 500 high-quality research papers, over 35 books, and holds multiple patents. He is recognized globally for his outstanding research contributions, and since 2020, he has been consistently ranked among the top 2% of scientists worldwide by Stanford University and Elsevier. He is also a Clarivate Highly Cited Researcher (top 1%) in computer science, reflecting his exceptional research impact.',
    'Professor Gupta has received numerous prestigious national and international awards, including the Canadian Commonwealth Scholarship, Faculty Research Fellowship Award, IEEE GCCE Outstanding Paper Award, and multiple Best Paper and Best Faculty Awards. He actively contributes to the global research community through editorial leadership roles, serving as editor-in-chief and editorial board member for several high-impact international journals. He has also served as a Distinguished Lecturer of the IEEE Consumer Technology Society and as a Member-at-Large on its Board of Governors, along with key roles in organizing and chairing numerous top-tier IEEE conferences.',
    'His research spans artificial intelligence, cybersecurity, blockchain technologies, cloud and edge computing, intrusion detection systems, cyber-physical systems, and social network analysis. He has been actively involved in international collaborations, interdisciplinary research, and mentoring students and researchers at the undergraduate, postgraduate, and doctoral levels.',
  ],
}

/**
 * Volumes supplied by the publisher ("Book series changes", November 2026).
 * Expected dates and page counts confirmed by the publisher (November 2026).
 * Description, contents, readership and biographies follow. A fourth volume
 * (Human-Centred Industry 5.0) was withdrawn from the list for now.
 * November 2026: the first two volumes are hidden; "Quantum-Safe Cyber Defense"
 * (authored) is now volume 1 and TAIIS 2026 is volume 2.
 */
const volumes: SeriesVolume[] = [
  {
    // Publisher's "Aim and Scope (updated volume 1)" (November 2026). An authored book, not an edited volume.
    slug: 'quantum-safe-cyber-defense',
    number: 1,
    title: 'Quantum-Safe Cyber Defense: Cryptography, Protocols, and Migration Strategies',
    expectedDate: 'November 2026',
    cover: '/images/covers/volumes/sisdt-v1-quantum-safe-cyber-defense-publisher.jpg', // publisher-logo artwork, Volume badge top right (November 2026)
    publishedDate: null,
    doi: null,
    isbn: '978-626-93492-0-3', // assigned by the NCL ISBN Center (e-book, PDF), November 2026
    pages: 180,
    contributorRole: 'authors',
    editors: [brijGupta, vijayanSugumaran],
    description: [
      'Quantum-Safe Cyber Defense: Cryptography, Protocols, and Migration Strategies provides a comprehensive exploration of emerging quantum computing threats and the development of quantum-resistant cybersecurity mechanisms. The book focuses on the theoretical foundations, cryptographic algorithms, security protocols, and practical strategies required to protect modern digital infrastructures against the evolving challenges of the quantum computing era.',
      'This book brings together fundamental concepts, advanced cryptographic techniques, emerging security standards, and practical implementation strategies for quantum-safe cybersecurity. The book also explores applications in cloud computing, the Internet of Things (IoT), edge computing, industrial systems, and next-generation communication networks, highlighting implementation challenges, performance evaluation, and future research opportunities.',
    ],
    coverage: {
      intro: 'The many academic areas covered in this publication include, but are not limited to:',
      topics: [
        'Quantum computing fundamentals and cybersecurity implications.',
        'Quantum algorithms and threats to conventional cryptographic systems.',
        'Mathematical foundations of post-quantum cryptography.',
        'Lattice-based, code-based, and hash-based cryptographic algorithms.',
        'Quantum-resistant key encapsulation mechanisms and digital signatures.',
        'NIST post-quantum cryptographic standards and security frameworks.',
        'Quantum-safe authentication, key management, and digital certificates.',
        'Post-quantum TLS, VPNs, IPsec, and secure communication protocols.',
        'Quantum-resistant network security architectures and Zero Trust frameworks.',
        'Lightweight post-quantum cryptography for IoT and embedded systems.',
        'Quantum-safe security for cloud, edge, and 5G/6G networks.',
        'Cryptographic agility, hybrid cryptography, and interoperability.',
        'Quantum risk assessment and post-quantum migration strategies.',
        'Performance optimization, side-channel attacks, and security evaluation.',
        'Standardization, implementation challenges, and future research directions.',
      ],
    },
    keywords: [
      'Post-Quantum Cryptography',
      'Quantum-Safe Cybersecurity',
      'Quantum-Resistant Cryptography',
      'Quantum Computing',
      'Cryptographic Agility',
      'Lattice-Based Cryptography',
    ],
    // Table of contents from the publisher's ToC file (November 2026).
    contents: [
      'Quantum Computing and the Evolving Cybersecurity Threat Landscape: Foundations, Challenges, and Security Implications',
      'Post-Quantum Cryptography: Mathematical Foundations, Quantum-Resistant Algorithms, and Security Models',
      'Quantum-Safe Cryptographic Protocols: Key Encapsulation, Digital Signatures, and Secure Communication',
      'Quantum-Resistant Network Security Architectures: Secure Transport, Authentication, and Key Management',
      'Quantum-Safe Security for Cloud, IoT, Edge Computing, and Next-Generation Communication Networks',
      'Cryptographic Agility and Post-Quantum Migration: Risk Assessment, Hybrid Cryptography, and Transition Frameworks',
      'Implementation Challenges and Security Evaluation of Post-Quantum Cryptographic Systems: Performance, Vulnerabilities, and Deployment',
      'Emerging Trends in Quantum-Safe Cyber Defense: Standardization, Quantum-Resilient Infrastructures, and Future Research Directions',
    ],
    readership:
      'This book is intended for researchers, academicians, postgraduate students, cybersecurity professionals, cryptographers, network security engineers, and industry practitioners interested in post-quantum cryptography and quantum-resilient cybersecurity.',
  },
  {
    slug: 'agentic-ai-autonomous-systems',
    // Withdrawn from the site for now (publisher, November 2026); remove `hidden` to restore.
    hidden: true,
    number: 1,
    title: 'Agentic AI and Autonomous Systems: Architectures, Collaboration, and Applications',
    expectedDate: 'December 2026',
    cover: '/images/covers/volumes/sisdt-v1-agentic-ai.jpg',
    publishedDate: null,
    doi: null,
    isbn: null,
    pages: 200,
    // Description, coverage, keywords, readership and biographies from the
    // publisher's "Agentic AI and Autonomous Systems … _new.docx" (November 2026).
    editors: [vijayanSugumaran, brijGupta],
    description: [
      'Agentic AI and Autonomous Systems: Architectures, Collaboration, and Applications presents a comprehensive exploration of the emerging paradigm of Agentic Artificial Intelligence (AI), focusing on the design, development, coordination, and deployment of intelligent autonomous systems that can reason, plan, make decisions, and interact with dynamic environments.',
      'Unlike conventional AI systems that primarily respond to predefined instructions or perform isolated predictive tasks, Agentic AI introduces autonomous and goal-directed capabilities that enable intelligent agents to perceive their surroundings, formulate strategies, execute actions, collaborate with other agents, and adapt to changing conditions with varying degrees of human supervision.',
      'This book brings together fundamental concepts, advanced architectures, enabling technologies, and practical applications of Agentic AI and autonomous systems. It examines how to integrate large language models (LLMs), foundation models, reinforcement learning, knowledge representation, memory mechanisms, planning algorithms, and tool-augmented reasoning to develop adaptive, intelligent agent-based solutions.',
    ],
    coverage: {
      intro: 'The many academic areas covered in this publication include, but are not limited to:',
      topics: [
        'Agentic AI architectures and frameworks.',
        'Large language and foundation models for autonomous agents.',
        'Reasoning, planning, memory, and decision-making.',
        'Multi-agent communication and collaboration.',
        'Reinforcement learning and adaptive agents.',
        'Agentic workflows and human–AI collaboration.',
        'Trustworthy, explainable, and secure agentic AI.',
        'Agentic AI for cybersecurity and threat management.',
        'Multi-agent intelligence for IoT and smart networks.',
        'Agentic AI in healthcare, robotics, and industry.',
        'Emerging challenges and future research directions.',
      ],
    },
    keywords: [
      'Agentic AI',
      'Autonomous Systems',
      'Intelligent Agents',
      'Multi-Agent Systems',
      'LLMs',
      'Foundation Models',
      'Autonomous Decisions',
      'Agent Collaboration',
    ],
    contents: [],
    readership:
      'Researchers, academics, postgraduate students, and industry professionals working in AI, autonomous and multi-agent systems, robotics, cybersecurity, and IoT.',
  },
  {
    slug: 'quantum-safe-digital-systems',
    // Withdrawn from the site for now (publisher, November 2026); remove `hidden` to restore.
    hidden: true,
    number: 2,
    title: 'Quantum-Safe Digital Systems: Cryptography, Security, and Migration Strategies',
    expectedDate: 'January 2027',
    cover: '/images/covers/volumes/sisdt-v2-quantum-safe-gold.jpg',
    publishedDate: null,
    doi: null,
    isbn: null,
    pages: 230,
    // Description, coverage, keywords, readership and biographies from the
    // publisher's "Quantum-Safe Digital Systems … .docx" (November 2026).
    editors: [
      {
        name: 'Dragan Peraković',
        affiliation: 'University of Zagreb, Croatia',
        biography: [
          'Dragan Peraković is a full professor with tenure at the Faculty of Transport and Traffic Sciences, University of Zagreb, where he has headed the Department of Information and Communications Traffic since 2010 and chairs Information Communication Systems and Services Management. He earned his bachelor’s degree in 1995, his master’s degree in 2003, and his PhD in 2005 at the same faculty; his doctorate modeled how information is distributed to users of traffic systems. His research covers intelligent transport systems, the Internet of Things, cybersecurity and digital forensics, Industry 4.0, assistive technologies for people with reduced mobility, and quantum communication. He has published more than 200 papers, 18 book chapters, and has co-edited more than ten books and proceedings.',
          'He is chief editor of the International Journal of Cyber-Security and Digital Forensics and has served as guest editor for more than ten special issues in journals from Springer, IGI Global, and MDPI. He has led or evaluated European projects including CiViTAS ELAN, HINT, and GIFT, and national studies on smartphone services and on using the Internet of Things to help blind and visually impaired people move through the traffic network. In October 2025, the faculty gave him the Dean’s Award for Outstanding Achievements in Scientific Research, and a paper he co-authored received the best-paper award at EAI FABULOUS 2025; he had earlier received the best-paper award at TRDI 2015. He is general chair of the EAI FABULOUS and EAI MMS conference series, president of the Croatian Chamber of Transport Engineers, and a member of the Scientific Council for Traffic of the Croatian Academy of Sciences and Arts.',
          'He is a visiting professor at the University of Mostar and the University of East Sarajevo, and an international expert at Asia University’s Center for AI and Cyber Security Research and Innovations. He is a member of the IEEE, the International Telecommunication Union, and the European Alliance for Innovation.',
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
      {
        name: 'Ivan Cvitić',
        affiliation: 'University of Zagreb, Croatia',
        biography: [
          'Ivan Cvitić is an assistant professor in the Department of Information and Communications Traffic at the Faculty of Transport and Traffic Sciences, University of Zagreb, where he heads the Laboratory for Security and Forensic Analysis of Information and Communication Systems and holds the research rank of scientific associate. He earned his bachelor’s degree in 2011 and his master’s degree in 2013 at the same faculty, joined it as a research assistant in 2014, and was a postdoctoral researcher from 2020 until his appointment as assistant professor in 2023. His PhD, defended in 2020 under Dragan Peraković, developed a method for detecting anomalies in network traffic, including distributed denial-of-service traffic from Internet-of-Things devices, using the features of a traffic flow and the class of the device that produced it. His research covers the security of information and communication systems, network and IoT security, protection of cloud environments and of service availability, digital forensics, applied machine learning, and quantum communication. He has published more than 90 scientific and professional papers.',
          'He is an associate editor of the Journal of Cyber Security Technology, a topics editor of Electronics, and a member of the editorial board of Scientific Reports, and he has guest-edited special issues of Electronics and a Scientific Reports collection on quantum networks. He leads QRO-Route, a National Recovery and Resilience Plan project of about €117,000 on routing cryptographic keys across multi-domain quantum-key-distribution networks, with partners at the University of Aveiro, the Instituto de Telecomunicações, and the University of Rijeka. He served on the project team of Croatia’s quantum communication infrastructure project, CroQCI, and sits on the project team and security advisory body of QuGNOPs, the follow-on EuroQCI project on quantum ground nodes.',
          'He is a member of NATO Research Task Group IST-218 on multi-domain quantum key distribution for military use, of the EuroQCI thematic working group on architecture, interoperability, and standardization, and of the CEN-CENELEC Focus Group on Quantum Technologies. In 2021 the faculty recognised him for special achievements in scientific research, and a paper he co-authored with Marko Periša, Petra Zorić, and Ivan Grgurević received the best-paper award at EAI MMS 2022; he had earlier received a best-presentation award at DAAAM 2015. He is an EAI Distinguished Member, was technical program co-chair of EAI FABULOUS 2025 and EAI MMS 2025, and has served as secretary of the Innovative FET Association. He sits on the management board of the class of postal and information-communication traffic engineers and on the assembly of the Croatian Chamber of Transport Engineers, and he has been a member of Croatia’s Thematic Innovation Council for Security. He is co-founder and chief technology officer of ArQus Solutions, a Zagreb company that plans quantum-resilient networks.',
        ],
      },
    ],
    description: [
      'Quantum-Safe Digital Systems: Cryptography, Security, and Migration Strategies offers a comprehensive exploration of emerging quantum-safe security technologies, focusing on protecting digital infrastructures, communication networks, and information systems against evolving threats posed by quantum computing. The book examines vulnerabilities in conventional cryptographic mechanisms and highlights the need to develop secure, resilient, future-ready digital systems in the post-quantum era.',
      'As quantum computing advances, widely deployed public-key cryptographic algorithms face potential security risks, creating an urgent need for quantum-resistant cryptographic solutions and systematic migration strategies. This book explores post-quantum cryptography, quantum key distribution, hybrid cryptographic architectures, and security frameworks designed to protect sensitive information, digital communications, and critical infrastructures against both classical and quantum-enabled threats.',
      'The book brings together fundamental concepts, advanced cryptographic techniques, security architectures, standardization efforts, and practical migration strategies for quantum-safe digital systems. It examines the integration of lattice-based cryptography, hash-based signatures, code-based cryptography, quantum-resistant authentication, secure communication protocols, and cryptographic agility. Particular attention is given to implementation challenges, performance evaluation, interoperability, risk assessment, and the transition from conventional security infrastructures to quantum-safe environments.',
    ],
    coverage: {
      intro: 'The many academic areas covered in this publication include, but are not limited to:',
      topics: [
        'Quantum threats to cryptography and digital infrastructure.',
        'Post-quantum cryptography and quantum-resistant algorithms.',
        'Lattice-based, code-based, and hash-based cryptography.',
        'Quantum key distribution and secure communication.',
        'Hybrid cryptography and quantum-resistant protocols.',
        'Quantum-safe authentication, signatures, and identity management.',
        'Quantum-safe security and privacy in cloud, edge, and IoT.',
        'Quantum-resistant blockchain and communication networks.',
        'Cryptographic agility, standards, and compliance.',
        'Quantum-safe migration and risk assessment.',
        'Emerging challenges and future research directions.',
      ],
    },
    keywords: [
      'Quantum-Safe Cryptography and Communication',
      'Cybersecurity',
      'Post-Quantum Standards',
      'Critical Infrastructure Protection',
      'Next-Generation Digital Systems',
    ],
    contents: [],
    readership:
      'Researchers, academics, postgraduate students, and industry professionals in quantum computing, post-quantum cryptography, cybersecurity, and secure digital infrastructure.',
  },
  {
    slug: 'trustworthy-ai-intelligent-iot-taiis-2026',
    number: 2,
    title: 'Advances in Trustworthy AI and Intelligent IoT Systems: TAIIS 2026 Poster Proceedings',
    expectedDate: 'January 2027',
    cover: '/images/covers/volumes/sisdt-v2-trustworthy-ai-taipei.jpg', // "Volume 2" artwork (November 2026)
    publishedDate: null,
    doi: null,
    isbn: null,
    pages: 219,
    // Description, coverage, keywords, readership and biographies from the
    // publisher's "Advances in Trustworthy AI … _new.docx" (November 2026).
    editors: [
      {
        name: 'Kwok Tai Chui',
        affiliation: 'Hong Kong Metropolitan University, Hong Kong',
        biography: [
          'Kwok Tai Chui (Member IEEE) is an associate professor in the Department of Electronic Engineering and Computer Science at Hong Kong Metropolitan University. He received a first-class B.Eng. in electronic and communication engineering, with a minor in business intelligence, and a Ph.D. in electronic engineering from City University of Hong Kong. He worked as a senior data scientist in an Internet of Things company before joining Hong Kong Metropolitan University as a research assistant professor in 2019 and later becoming assistant professor and then associate professor. His research covers computational intelligence, data science, machine learning, energy monitoring and management, intelligent transportation, smart metering, and healthcare.',
          'He has published more than 300 works, including journal papers, conference papers, book chapters, and edited books. He is managing editor of the International Journal on Semantic Web and Information Systems, a topic editor of Sensors, and an associate editor of the International Journal of Asian Business and Information Management and the International Journal of Energy Optimization and Engineering. He has also been a guest editor of Future Generation Computer Systems, the Journal of Innovation and Knowledge, Sustainability, Sensors, Energies, Applied Sciences, and the Journal of Internet Technology. He won first prize in the IEEE Hong Kong Section postgraduate student paper contest in 2013, second prize in the 2014 IEEE Region 10 Student Paper Contest, and best-paper awards at the IEEE International Conference on Consumer Electronics–China in 2014 and 2015. In February 2025 Hong Kong Metropolitan University awarded him its Silver Prize for an enhanced transfer-learning algorithm aimed at small datasets.',
        ],
      },
      {
        name: 'Chi-Wen Lung',
        affiliation: 'Asia University, Taiwan',
        biography: [
          'Chi-Wen Lung is professor and chair of the Department of Creative Product Design at Asia University, Taichung, and a professor in the Department of Bioinformatics and Medical Engineering, where he leads the BioDesign Lab. He earned a bachelor’s degree in industrial design from Dayeh University in 1995, a master’s degree in industrial design from Tatung University in 1997, and a PhD in biomedical engineering from National Yang-Ming University in 2008. His doctorate, supervised by Sai-Wei Yang, examined how the structure of the foot affects the biomechanics of walking. He then completed postdoctoral training at the Information Technology Research Center for Sports and Health in the Institute of Intelligent Machines, Chinese Academy of Sciences, developing instruments for rehabilitation research.',
          'He has also been a visiting scholar in the Department of Kinesiology and Community Health at the University of Illinois Urbana-Champaign. Before his faculty career he spent six years in medical-product research and development and was a supervisor in the Job Accommodation Office of the Taipei City Bureau of Labor Affairs. His research covers soft-tissue biomechanics and the pressure between the body and orthoses, footwear, and wheelchair cushions, together with rehabilitation engineering, diabetic-foot care, gait analysis, and deep learning applied to medical images. He has published 89 articles indexed in Scopus, including 48 papers in SCI journals, and he has authored or edited four books. He has been a guest editor of three special issues in SCI journals, including Sensors and Frontiers in Physiology. He has filed 44 patents, 29 in Taiwan and 15 in China.',
          'Student teams he has advised have won 18 awards at international invention exhibitions, four of them gold, six silver, and eight bronze, at venues including ITEX, the Concours Lépine in Paris, and the Seoul International Invention Fair. A blood-flow velocity detection system from his group received a 2025 iF Design Award and a European Product Design Award, and a student team he advised received a 2022 iF Design Student Award. Since 2021 the National Science and Technology Council has given him its university research reward for three years. He currently leads council projects that use artificial intelligence and optical coherence tomography to assess skin and diabetic-foot wounds, including a Taiwan–India collaboration running through 2027. He is a member of the Taiwanese Society of Biomechanics.',
        ],
      },
    ],
    description: [
      'Advances in Trustworthy AI and Intelligent IoT Systems: Selected Papers from TAIIS 2026 Poster Proceedings brings together selected papers from the poster programme of the International Conference on Trustworthy AI and Intelligent IoT Systems (TAIIS 2026), scheduled for December 3–5, 2026, at Asia University, Taichung, Taiwan. The volume highlights emerging ideas, preliminary research findings, and practical approaches to developing reliable, explainable, secure, and privacy-preserving AI and IoT systems.',
      'Topics span machine learning, deep learning, generative AI, cybersecurity, intelligent IoT architectures, edge and cloud computing, and cyber-physical systems. The selected contributions explore applications in healthcare, transportation, industrial automation, smart cities, and sustainable digital infrastructure, addressing challenges in interconnected and evolving environments.',
      'Reflecting the exploratory nature of poster presentations, this collection encourages discussion, knowledge exchange, and further research. It offers researchers, academics, postgraduate students, and industry practitioners a resource for exploring emerging methods, applications, and research directions in trustworthy AI and intelligent IoT systems.',
    ],
    coverage: {
      intro: 'The many academic areas covered in this publication include, but are not limited to:',
      topics: [
        'Trustworthy, responsible, and explainable AI.',
        'AI, machine learning, and deep learning.',
        'Generative AI, LLMs, and foundation models.',
        'Agentic AI and autonomous systems.',
        'Intelligent IoT and industrial IoT.',
        'AI-driven cybersecurity and threat detection.',
        'Privacy-preserving computing and secure analytics.',
        'Edge, fog, and cloud computing.',
        'Federated learning and distributed AI.',
        'Smart sensors, embedded systems, and devices.',
        'Cyber-physical systems and automation.',
        'Blockchain and decentralized IoT security.',
        'Smart healthcare and medical IoT.',
        'Intelligent transportation and autonomous mobility.',
        'Smart cities, homes, and sustainable IoT.',
        'AI-enabled robotics.',
        'Big data analytics and decision support.',
        'Wireless communication and 5G/6G networks.',
        'Energy-efficient AI and green IoT.',
        'Digital twins and intelligent industry.',
        'Adversarial learning and robust AI.',
        'Human-centered AI and human–machine interaction.',
        'Emerging technologies for connected systems.',
      ],
    },
    keywords: [
      'Trustworthy AI',
      'Intelligent IoT',
      'Generative and Agentic AI',
      'Cybersecurity',
      'Edge–Cloud Computing',
      'Federated Learning',
      'Smart Systems',
      'Digital Twins',
      'Sustainable Computing',
    ],
    contents: [],
    readership:
      'Researchers, academics, postgraduate students, and industry professionals in AI, IoT, cybersecurity, edge–cloud computing, and next-generation networks.',
  },
]

export const aiisc: Series = {
  slug: 'aiisc',
  code: 'SISDT',
  title: 'Studies in Intelligent Systems and Digital Technologies',
  kind: 'book',
  subjectKey: 'computing',
  scope: intro,
  topics,
  issn: null,
  profile: {
    kicker: 'SISDT · A NextGenIQ Press Book Series',
    cover: '/images/series/cover-aiisc.svg',
    tile: '/images/covers/aiisc.jpg',
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
    page('aims-scope', 'Aims & scope', 'Aims and scope', 'The research areas covered by SISDT.', [
      {
        title: '',
        paragraphs: [
          'Studies in Intelligent Systems and Digital Technologies (SISDT) is a peer-reviewed book series on artificial intelligence, intelligent systems and advanced computing. The series publishes research monographs, edited volumes and conference proceedings exclusively as e-books. Each volume is published under either an open access or a subscription model, as indicated on its publication page.',
          'SISDT connects advances in computational methods with the engineering of reliable, efficient and trustworthy systems. It welcomes theoretical contributions, new methods and applications supported by rigorous analysis and evidence. Topics include:',
        ],
        bullets: topics,
        topicList: true,
        closing: ['Each volume should offer researchers, postgraduate students or practitioners a coherent treatment of its subject and explain how its findings advance research or inform practice.'],
      },
    ]),
    page('editorial-board', 'Editorial board', 'Editorial board', 'The Series Editor of SISDT.', [
      { title: 'Series editor', table: editorTable(editors), paragraphs: [] },
    ]),
    page('propose-volume', 'Propose a volume', 'Propose a volume', 'What to include in an SISDT volume proposal.', [
      plain(['We welcome proposals for research monographs, edited volumes, and conference proceedings throughout the year. All accepted volumes are published as e-books. Please indicate in your proposal whether you prefer open access or subscription publication.'], {
        closing: [
          `Email ${editorialEmail} with the subject “SISDT Proposal — [Title]”. Proposal approval does not guarantee acceptance of the completed manuscript.`,
        ],
      }),
    ]),
    page(
      'author-editor-guidelines',
      'Author & editor guidelines',
      'Author and Editor Guidelines',
      'Manuscript requirements for SISDT authors and volume editors.',
      [
        plain([
          'Manuscripts must be original, clearly organised, and appropriately referenced. Authors should explain their methods, present supporting evidence, acknowledge limitations, and provide data or code availability information where applicable.',
          'Contributors must disclose funding, conflicts of interest, and substantive use of generative AI, and obtain necessary permissions for third-party material. Volume editors coordinate contributors, maintain thematic coherence, and oversee completion of revisions.',
          seriesDigitalPublication,
        ]),
        seriesTemplates('aiisc', 'SISDT'),
      ],
    ),
    page('peer-review-ethics', 'Peer review & ethics', 'Peer review and ethics', 'How SISDT volumes are reviewed.', [
      plain([
        'All volumes undergo editorial assessment and independent peer review. Monographs are assessed as complete works; chapters and proceedings papers are reviewed individually, alongside assessment of the volume’s overall coherence.',
        'Submissions involving an editor’s own work or a conflict of interest are handled independently. All contributions must comply with NextGenIQ Press publication ethics policies.',
        seriesSameStandards,
      ]),
    ]),
    // The page id (and so the URL /series/aiisc/open-access-fees) is kept so shared links keep working.
    page('open-access-fees', 'Access options & fees', 'Access options and fees', 'Access options and charges for SISDT volumes.', [
      plain([
        'Studies in Intelligent Systems and Digital Technologies publishes exclusively as e-books. Each volume’s page identifies its access model and applicable terms.',
        '**Open access.** Readers can freely access, share, and adapt these volumes under the CC BY 4.0 licence with appropriate attribution. Third-party material may have separate terms, as indicated in its credit line.',
        '**Subscription access.** Subscribers can read these volumes online under the publisher’s subscription terms.',
        '**Fees and waivers.** There is no submission fee. The publisher discloses any publication charges, funding arrangements, and available waivers before authors or editors sign a publishing agreement. Editorial decisions are independent of payment.',
      ]),
    ]),
    page('indexing-abstracting', 'Indexing & abstracting', 'Indexing and Abstracting', 'Indexing status of SISDT.', []), // Blank until indexing is confirmed (publisher, November 2026).
    page('volumes', 'Forthcoming volumes', 'Forthcoming volumes', 'Forthcoming volumes in SISDT.', [
      plain([
        'The volumes of SISDT are listed below; each links to its own page. We currently welcome proposals for monographs, edited collections, and conference proceedings within the series scope.',
      ]),
    ]),
    page('contact', 'Contact', 'Contact', 'How to contact SISDT.', [
      plain([`For proposals and editorial enquiries, contact ${editorialEmail}. Please include SISDT in the subject line.`]),
    ]),
  ],
}
