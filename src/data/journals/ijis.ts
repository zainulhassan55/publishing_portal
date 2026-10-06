import { buildJournal, buildJournalDetail } from '../journalTemplate'
import type { JournalSpec } from '../journalTemplate'

const spec: JournalSpec = {
  slug: 'ijis',
  title: 'International Journal of Interdisciplinary Science',
  shortTitle: 'IJIS',
  area: 'Interdisciplinary Science',
  tagline: 'Integrating methods and evidence across the sciences and engineering.',
  summary:
    'Peer-reviewed research that integrates theories, methods, and evidence across the natural sciences, engineering, computing, and the social sciences.',
  about: [
    'The International Journal of Interdisciplinary Science (IJIS) is an international, peer-reviewed scholarly journal published by NextGenIQ Press. The journal provides a platform for research that integrates theories, methods, and evidence across the natural sciences, engineering, computing, and the social sciences.',
    'IJIS aims to connect disciplinary expertise in order to address complex scientific and societal problems that no single field can solve alone. The journal welcomes theoretical, empirical, methodological, and applied research that demonstrates genuine integration across disciplinary boundaries.',
    'Particular attention is given to research addressing convergence science, complex and socio-technical systems, sustainability and climate science, data science across domains, team science and research collaboration, open science, and responsible research and innovation.',
    'The journal encourages research that combines perspectives from physics, chemistry, biology, earth and environmental sciences, engineering, computer science, mathematics, health sciences, and the social sciences.',
    'IJIS seeks contributions from researchers, academics, practitioners, research managers, and policymakers worldwide.',
  ],
  objectives: [
    'Advance theoretical and practical understanding of interdisciplinary and transdisciplinary research.',
    'Promote research that integrates methods and knowledge across the sciences and engineering.',
    'Examine the scientific, societal, and ethical implications of convergent research.',
    'Encourage open, reproducible, and responsible interdisciplinary science.',
    'Provide an international platform for researchers from diverse disciplines.',
    'Support research addressing complex contemporary challenges such as climate, health, energy, and sustainability.',
  ],
  scope: [
    'The International Journal of Interdisciplinary Science publishes high-quality research that integrates two or more disciplines to generate insights, methods, or solutions beyond the reach of a single field.',
    'The journal is particularly interested in research that makes the integration explicit, explaining how disciplinary perspectives were combined and what the combination contributes.',
  ],
  topics: [
    'Theories and Frameworks of Interdisciplinary Research',
    'Convergence Science',
    'Complex Systems and Network Science',
    'Socio-Technical Systems',
    'Human–Environment Systems',
    'Sustainability Science',
    'Climate Change Science and Adaptation',
    'Energy and Environmental Systems',
    'Data Science Across Disciplines',
    'Artificial Intelligence for Scientific Discovery',
    'Computational Modelling and Simulation',
    'Multi-Scale and Multi-Model Integration',
    'Mixed-Methods Research',
    'Data Harmonization, Provenance, and Interoperability',
    'Bioinformatics and Computational Biology',
    'Materials Science and Nanotechnology',
    'One Health and Planetary Health',
    'Smart Cities and Urban Science',
    'Team Science and Research Collaboration',
    'Open Science and Research Infrastructure',
    'Science Policy and Research Governance',
    'Responsible Research and Innovation',
    'Science Communication and Public Engagement',
    'Interdisciplinary Education and Training',
    'Reproducibility and Reporting Standards',
  ],
  scopeNote:
    'Contributions that make the integration of disciplinary perspectives explicit, and that are accessible to readers outside the authors’ home disciplines, are particularly encouraged.',
  implicationsQuestion: 'Are the interdisciplinary contribution and its practical implications clearly explained?',
  specialIssueAreas: [
    'AI for Scientific Discovery',
    'Climate Change and Sustainability Science',
    'Complex Systems and Networks',
    'One Health and Planetary Health',
    'Energy Transition',
    'Smart and Sustainable Cities',
    'Open Science and Research Infrastructure',
    'Team Science and Collaboration',
    'Science Policy for Convergent Research',
    'Socio-Technical Transitions',
  ],
  cfpFocus:
    'convergence science, complex and socio-technical systems, sustainability and climate science, data science across domains, computational modelling, open science, and related areas',
}

export const ijisJournal = buildJournal(spec)
export const ijisDetail = buildJournalDetail(spec)
