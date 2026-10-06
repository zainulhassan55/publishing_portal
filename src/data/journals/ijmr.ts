import { buildJournal, buildJournalDetail } from '../journalTemplate'
import type { JournalSpec } from '../journalTemplate'

const spec: JournalSpec = {
  slug: 'ijmr',
  title: 'International Journal of Multidisciplinary Research',
  shortTitle: 'IJMR',
  area: 'Multidisciplinary Research',
  tagline: 'Problem-driven research that integrates methods across multiple fields.',
  summary:
    'Peer-reviewed, problem-driven research across the sciences, engineering, health, business, education, and the social sciences.',
  about: [
    'The International Journal of Multidisciplinary Research (IJMR) is an international, peer-reviewed scholarly journal published by NextGenIQ Press. The journal provides a broad platform for high-quality research across the sciences, engineering, health, business, education, and the social sciences and humanities.',
    'IJMR aims to bring together research communities that address important problems from different disciplinary starting points. The journal welcomes theoretical, empirical, methodological, and applied research, including studies that combine methods and evidence from more than one field.',
    'Particular attention is given to research addressing sustainable development, health and wellbeing, technology and society, education and human development, business and economic development, environment and climate, and evidence synthesis across domains.',
    'The journal encourages contributions from all academic disciplines and is particularly open to research that is relevant to practice and policy.',
    'IJMR seeks contributions from researchers, academics, practitioners, early-career scholars, and policymakers worldwide.',
  ],
  objectives: [
    'Publish rigorous research across a broad range of academic disciplines.',
    'Promote multidisciplinary research that combines methods and perspectives from multiple fields.',
    'Examine the practical, social, and policy implications of research.',
    'Encourage open, transparent, and reproducible research practices.',
    'Provide an international platform for established and early-career researchers.',
    'Support research addressing contemporary global challenges, including the Sustainable Development Goals.',
  ],
  scope: [
    'The International Journal of Multidisciplinary Research publishes high-quality research from across the academic disciplines, with an emphasis on problem-driven studies that are relevant to society, practice, and policy.',
    'The journal is particularly interested in research that combines qualitative, quantitative, and computational evidence, and that communicates clearly to readers beyond a single specialism.',
  ],
  topics: [
    'Sustainable Development and the SDGs',
    'Health Sciences and Public Health',
    'Engineering and Technology',
    'Computing and Information Technology',
    'Artificial Intelligence and Data Science Applications',
    'Business, Management, and Economics',
    'Education and Human Development',
    'Social Sciences and Humanities',
    'Environmental Science and Climate Change',
    'Agriculture and Food Security',
    'Energy and Natural Resources',
    'Law, Governance, and Public Policy',
    'Psychology and Behavioural Science',
    'Communication and Media Studies',
    'Urban and Regional Development',
    'Technology, Society, and Human-Centred Inquiry',
    'Cross-Sector Collaboration',
    'Community-Engaged and Participatory Research',
    'Mixed-Methods Research',
    'Systematic Reviews and Evidence Synthesis',
    'Research Methods and Methodology',
    'Research Ethics and Data Governance',
    'Open Science and Reproducibility',
    'Innovation and Development Studies',
  ],
  scopeNote:
    'Contributions that combine methods or perspectives from more than one discipline, or that translate research into practice and policy, are particularly encouraged.',
  implicationsQuestion: 'Are practical, social, or policy implications meaningful?',
  specialIssueAreas: [
    'Research for the Sustainable Development Goals',
    'Artificial Intelligence Across Disciplines',
    'Health and Wellbeing',
    'Education in the Digital Age',
    'Climate Change and Society',
    'Food, Water, and Energy Security',
    'Inclusive and Sustainable Economic Development',
    'Community-Engaged Research',
    'Evidence Synthesis and Systematic Reviews',
    'Open Science Practices',
  ],
  cfpFocus:
    'sustainable development, health and wellbeing, technology and society, education, business and economics, environment and climate, evidence synthesis, and related areas across all disciplines',
}

export const ijmrJournal = buildJournal(spec)
export const ijmrDetail = buildJournalDetail(spec)
