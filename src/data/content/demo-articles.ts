import type { Article } from '@/types/publishing'

/**
 * Demo articles.
 *
 * These records are fictional. They exist so that the article, issue, search and
 * metrics surfaces can be built and reviewed against realistic content before
 * the first real manuscript is accepted.
 *
 * They are NEVER served in production. `src/data/content/index.ts` only loads
 * this module when NEXT_PUBLIC_DEMO_CONTENT=1, and the production path reads
 * the OJS harvest instead (empty today, which is what the launch-state empty
 * copy on each page is written for). Publishing invented articles on a real
 * publisher's site is the same credibility failure as the placeholder ISSNs
 * the platform audit flagged — see docs/PLATFORM-AUDIT.md F-03.
 */

const openAccess = 'Open access' as const
const ccby = 'CC BY 4.0'

export const demoArticles: Article[] = [
  {
    id: 'a1',
    slug: 'rppg-continuous-heart-rate-home-cardiac-rehabilitation',
    journalSlug: 'ijdh',
    type: 'Research Article',
    status: 'published',
    title:
      'Remote photoplethysmography for continuous heart-rate monitoring in home-based cardiac rehabilitation: a prospective validation study',
    authors: [
      { name: 'Amara N. Okafor', affiliationIds: ['af1'], orcid: '0000-0002-1825-0097', corresponding: true, email: 'a.okafor@example.ac.uk', roles: ['Conceptualization', 'Methodology', 'Writing – original draft'] },
      { name: 'Daniel Reyes-Morales', affiliationIds: ['af1', 'af2'], orcid: '0000-0001-5109-3700', roles: ['Software', 'Formal analysis'] },
      { name: 'Lena Hoffmann', affiliationIds: ['af2'], roles: ['Investigation', 'Data curation'] },
      { name: 'Kenji Watanabe', affiliationIds: ['af3'], roles: ['Supervision', 'Writing – review and editing'] },
    ],
    affiliations: [
      { id: 'af1', name: 'Centre for Digital Health, University of Leeds', country: 'United Kingdom', ror: '024mrxd33' },
      { id: 'af2', name: 'Department of Cardiology, Charité – Universitätsmedizin Berlin', country: 'Germany' },
      { id: 'af3', name: 'Graduate School of Medicine, Kyoto University', country: 'Japan' },
    ],
    abstract:
      'Home-based cardiac rehabilitation depends on reliable monitoring of exercise intensity, yet chest-strap sensors are frequently abandoned by patients. We evaluated a camera-based remote photoplethysmography (rPPG) pipeline against electrocardiography in 112 participants completing supervised home sessions. Mean absolute error was 2.9 beats per minute at rest and 4.6 during moderate exercise, with agreement degrading under low illumination. The findings support rPPG as an adjunct, but not a replacement, for contact sensors in remote programmes.',
    highlights: [
      'Camera-based heart-rate estimation agreed with ECG to within 2.9 bpm at rest across 112 participants.',
      'Agreement degraded to 4.6 bpm during moderate exercise and worsened below 50 lux.',
      'Skin-tone subgroup analysis found no significant difference in error after illumination adjustment.',
    ],
    keywords: ['remote photoplethysmography', 'cardiac rehabilitation', 'telemonitoring', 'computer vision', 'validation study'],
    doi: '10.63521/ijdh.2026.0014',
    volume: 1,
    issue: 2,
    pages: '45–67',
    publishedIso: '2026-06-12',
    receivedIso: '2026-01-18',
    revisedIso: '2026-04-02',
    acceptedIso: '2026-05-21',
    access: openAccess,
    licence: ccby,
    graphicalAbstract: {
      id: 'ga1',
      label: 'Graphical abstract',
      caption: 'Study pipeline: webcam capture, region-of-interest tracking, signal extraction and agreement analysis against ECG.',
      alt: 'Flow diagram showing video capture feeding a signal-processing pipeline, compared against an electrocardiogram reference.',
    },
    body: [
      {
        id: 's1',
        number: '1',
        heading: 'Introduction',
        paragraphs: [
          'Cardiac rehabilitation reduces mortality and rehospitalisation after a cardiac event, but attendance at centre-based programmes remains low. Home-based delivery widens access, and its safety depends on knowing whether a patient is exercising within a prescribed heart-rate band.',
          'Chest-strap electrocardiography is accurate but poorly tolerated over a twelve-week programme. Camera-based remote photoplethysmography (rPPG) estimates pulse rate from subtle colour changes in facial video and requires no contact with the patient, which makes it attractive for unsupervised use — provided its accuracy under realistic home conditions is established.',
        ],
      },
      {
        id: 's2',
        number: '2',
        heading: 'Methods',
        paragraphs: [
          'We recruited 112 adults enrolled in a home-based cardiac rehabilitation programme at three sites. Each participant completed four supervised sessions over two weeks while wearing a reference three-lead electrocardiogram.',
        ],
        subsections: [
          {
            id: 's2-1',
            number: '2.1',
            heading: 'Signal acquisition',
            paragraphs: [
              'Video was captured at 30 frames per second at 1280 × 720 using the participant’s own laptop or tablet camera. Illuminance at the face was logged with a calibrated lux meter at one-second intervals.',
            ],
          },
          {
            id: 's2-2',
            number: '2.2',
            heading: 'Statistical analysis',
            paragraphs: [
              'Agreement was assessed with Bland–Altman limits of agreement and mean absolute error, stratified by activity state and by illuminance quartile. Analyses were pre-registered; the protocol deviation log is in the supplementary material.',
            ],
            equation: {
              tex: 'MAE = \\frac{1}{n}\\sum_{i=1}^{n}\\left|\\hat{h}_i - h_i\\right|',
              label: 'Equation 1',
            },
          },
        ],
      },
      {
        id: 's3',
        number: '3',
        heading: 'Results',
        paragraphs: [
          'Across 448 sessions, mean absolute error was 2.9 bpm (95% limits of agreement −7.4 to 8.1) at rest and 4.6 bpm (−12.2 to 13.0) during moderate exercise.',
        ],
        table: {
          caption: 'Table 1. Agreement with electrocardiography by activity state and illuminance.',
          head: ['Activity state', 'Illuminance', 'Sessions', 'MAE (bpm)', '95% limits of agreement'],
          rows: [
            ['Rest', '≥ 200 lux', '164', '2.4', '−6.1 to 7.0'],
            ['Rest', '50–199 lux', '82', '3.6', '−9.0 to 9.8'],
            ['Rest', '< 50 lux', '28', '6.8', '−15.4 to 17.1'],
            ['Moderate exercise', '≥ 200 lux', '118', '4.1', '−11.0 to 11.8'],
            ['Moderate exercise', '< 200 lux', '56', '6.2', '−15.9 to 16.4'],
          ],
        },
      },
      {
        id: 's4',
        number: '4',
        heading: 'Discussion',
        paragraphs: [
          'Error at rest is within the ±5 bpm tolerance commonly accepted for exercise prescription, but the widening limits of agreement during exercise mean rPPG cannot be relied on alone to keep a patient inside a narrow target band.',
          'The dominant failure mode was low illumination rather than skin tone: once illuminance was adjusted for, the skin-tone subgroup difference was not significant. This matters because early rPPG work reported skin-tone disparities without controlling for lighting.',
        ],
        bullets: [
          'Use rPPG as an adjunct for adherence monitoring, not for closed-loop intensity control.',
          'Specify a minimum illuminance in any home-monitoring protocol that relies on camera-based estimation.',
          'Report illuminance alongside skin tone in future validation studies.',
        ],
      },
      {
        id: 's5',
        number: '5',
        heading: 'Conclusion',
        paragraphs: [
          'Camera-based heart-rate estimation is accurate enough to support adherence monitoring in home-based cardiac rehabilitation, and not accurate enough to replace contact sensing where exercise intensity must be controlled precisely.',
        ],
      },
    ],
    references: [
      { id: 'r1', text: 'Anderson L, Oldridge N, Thompson DR, et al. Exercise-based cardiac rehabilitation for coronary heart disease. J Am Coll Cardiol. 2016;67(1):1–12.', doi: '10.1016/j.jacc.2015.10.044' },
      { id: 'r2', text: 'Verkruysse W, Svaasand LO, Nelson JS. Remote plethysmographic imaging using ambient light. Opt Express. 2008;16(26):21434–45.', doi: '10.1364/OE.16.021434' },
      { id: 'r3', text: 'Bland JM, Altman DG. Statistical methods for assessing agreement between two methods of clinical measurement. Lancet. 1986;327(8476):307–10.' },
      { id: 'r4', text: 'Nowara EM, McDuff D, Veeraraghavan A. A meta-analysis of the impact of skin tone and gender on non-contact photoplethysmography measurements. Proc IEEE CVPR Workshops. 2020;284–5.' },
      { id: 'r5', text: 'Taylor RS, Dalal HM, McDonagh STJ. The role of cardiac rehabilitation in improving cardiovascular outcomes. Nat Rev Cardiol. 2022;19(3):180–94.', doi: '10.1038/s41569-021-00611-7' },
    ],
    declarations: {
      funding: 'Supported by the National Institute for Health and Care Research (NIHR204417). The funder had no role in study design, data collection, analysis or the decision to publish.',
      competingInterests: 'The authors declare no competing interests.',
      ethics: 'Approved by the University of Leeds School of Medicine Research Ethics Committee (MREC 23-041).',
      consent: 'All participants gave written informed consent, including consent for video capture and for anonymised data sharing.',
      dataAvailability:
        'De-identified heart-rate time series and the analysis code are available at https://doi.org/10.5281/zenodo.0000000. Raw facial video cannot be shared because it is identifiable; access requests are reviewed by the sponsor.',
      contributions:
        'A.N.O.: conceptualization, methodology, writing – original draft. D.R.-M.: software, formal analysis. L.H.: investigation, data curation. K.W.: supervision, writing – review and editing.',
      generativeAi:
        'A large language model was used to improve the readability of the discussion section. All content was verified by the authors, who accept full responsibility for it.',
    },
    supplementary: [
      { name: 'Supplementary methods and protocol deviations', kind: 'PDF', size: '412 KB' },
      { name: 'Per-session agreement data', kind: 'CSV', size: '88 KB' },
      { name: 'Example capture session (consented participant)', kind: 'MP4', size: '14.2 MB' },
    ],
    metrics: { views: 2184, downloads: 731, citations: 4 },
  },
  {
    id: 'a2',
    slug: 'calibrated-uncertainty-small-sample-medical-image-segmentation',
    journalSlug: 'ijic',
    type: 'Research Article',
    status: 'published',
    title: 'Calibrated uncertainty for small-sample medical image segmentation using conformal prediction',
    authors: [
      { name: 'Priya Raman', affiliationIds: ['af1'], corresponding: true, orcid: '0000-0003-4321-1230' },
      { name: 'Tomasz Nowak', affiliationIds: ['af2'] },
      { name: 'Sarah El-Amin', affiliationIds: ['af1'] },
    ],
    affiliations: [
      { id: 'af1', name: 'Institute for Medical Image Computing, University of Edinburgh', country: 'United Kingdom' },
      { id: 'af2', name: 'Faculty of Mathematics and Information Science, Warsaw University of Technology', country: 'Poland' },
    ],
    abstract:
      'Segmentation models trained on small clinical datasets produce over-confident masks. We adapt split conformal prediction to pixel-level outputs and report coverage guarantees on three public datasets with fewer than 300 labelled images each.',
    keywords: ['conformal prediction', 'segmentation', 'uncertainty quantification', 'medical imaging'],
    doi: '10.63521/ijic.2026.0021',
    volume: 1,
    issue: 2,
    pages: '88–109',
    publishedIso: '2026-06-03',
    receivedIso: '2026-01-09',
    acceptedIso: '2026-05-11',
    access: openAccess,
    licence: ccby,
    metrics: { views: 1620, downloads: 512, citations: 2 },
  },
  {
    id: 'a3',
    slug: 'error-mitigation-nisq-systematic-review',
    journalSlug: 'ijqt',
    type: 'Review',
    status: 'published',
    title:
      'Error mitigation on noisy intermediate-scale quantum hardware: a systematic review of methods and benchmarks, 2019–2025',
    authors: [
      { name: 'Hannah Lindqvist', affiliationIds: ['af1'], corresponding: true },
      { name: 'Rafael Okonkwo', affiliationIds: ['af2'] },
    ],
    affiliations: [
      { id: 'af1', name: 'Department of Physics, Chalmers University of Technology', country: 'Sweden' },
      { id: 'af2', name: 'Quantum Research Centre, University of Lagos', country: 'Nigeria' },
    ],
    abstract:
      'We review 214 studies of quantum error mitigation published between 2019 and 2025, classify methods into five families, and identify inconsistencies in benchmark reporting that prevent direct comparison.',
    keywords: ['quantum error mitigation', 'NISQ', 'benchmarking', 'systematic review'],
    doi: '10.63521/ijqt.2026.0009',
    volume: 1,
    issue: 2,
    pages: '12–44',
    publishedIso: '2026-05-28',
    acceptedIso: '2026-05-02',
    access: openAccess,
    licence: ccby,
    metrics: { views: 3011, downloads: 1204, citations: 7 },
  },
  {
    id: 'a4',
    slug: 'platform-dependence-pricing-autonomy-small-online-retailers',
    journalSlug: 'ijdm',
    type: 'Research Article',
    status: 'published',
    title: 'Platform dependence and pricing autonomy among small online retailers: evidence from 1,400 European firms',
    authors: [
      { name: 'Marco Bellini', affiliationIds: ['af1'], corresponding: true },
      { name: 'Ingrid Solberg', affiliationIds: ['af2'] },
      { name: 'Yusuf Demir', affiliationIds: ['af3'] },
    ],
    affiliations: [
      { id: 'af1', name: 'Department of Management, Bocconi University', country: 'Italy' },
      { id: 'af2', name: 'BI Norwegian Business School', country: 'Norway' },
      { id: 'af3', name: 'Faculty of Economics, Boğaziçi University', country: 'Türkiye' },
    ],
    abstract:
      'Using survey and transaction data from 1,400 small retailers, we estimate how reliance on a single marketplace constrains pricing decisions and how multi-homing moderates the effect.',
    keywords: ['platform economy', 'pricing', 'SMEs', 'multi-homing'],
    doi: '10.63521/ijdm.2026.0003',
    volume: 1,
    issue: 1,
    pages: '1–24',
    publishedIso: '2026-04-14',
    acceptedIso: '2026-03-20',
    access: openAccess,
    licence: ccby,
    metrics: { views: 1288, downloads: 402, citations: 1 },
  },
  {
    id: 'a5',
    slug: 'mixed-precision-preconditioned-conjugate-gradient',
    journalSlug: 'ijmc',
    type: 'Research Article',
    status: 'published',
    title: 'A mixed-precision preconditioned conjugate gradient method with provable stability bounds',
    authors: [
      { name: 'Wei Zhang', affiliationIds: ['af1'], corresponding: true },
      { name: 'Elena Petrova', affiliationIds: ['af2'] },
    ],
    affiliations: [
      { id: 'af1', name: 'School of Mathematical Sciences, University of Manchester', country: 'United Kingdom' },
      { id: 'af2', name: 'Institute of Computational Mathematics, ETH Zürich', country: 'Switzerland' },
    ],
    abstract:
      'We derive backward-error bounds for a preconditioned conjugate gradient solver that stores the preconditioner in half precision, and confirm the bounds on SuiteSparse matrices.',
    keywords: ['mixed precision', 'conjugate gradient', 'numerical stability'],
    doi: '10.63521/ijmc.2026.0017',
    volume: 1,
    issue: 2,
    pages: '110–131',
    publishedIso: '2026-06-09',
    acceptedIso: '2026-05-15',
    access: openAccess,
    licence: ccby,
    metrics: { views: 864, downloads: 299, citations: 0 },
  },
  {
    id: 'a6',
    slug: 'measuring-digital-exclusion-older-adults-instrument',
    journalSlug: 'ijds',
    type: 'Short Communication',
    status: 'published',
    title: 'Measuring digital exclusion among older adults: a validated eight-item instrument',
    authors: [
      { name: 'Fiona MacLeod', affiliationIds: ['af1'], corresponding: true },
      { name: 'Ana Carvalho', affiliationIds: ['af2'] },
    ],
    affiliations: [
      { id: 'af1', name: 'School of Social and Political Science, University of Glasgow', country: 'United Kingdom' },
      { id: 'af2', name: 'Instituto de Ciências Sociais, Universidade de Lisboa', country: 'Portugal' },
    ],
    abstract:
      'We present and validate an eight-item instrument measuring digital exclusion in adults over 65, tested with 2,016 respondents in Portugal and Scotland.',
    keywords: ['digital inclusion', 'older adults', 'psychometrics'],
    doi: '10.63521/ijds.2026.0005',
    volume: 1,
    issue: 1,
    pages: '25–33',
    publishedIso: '2026-04-20',
    acceptedIso: '2026-03-29',
    access: openAccess,
    licence: ccby,
    metrics: { views: 742, downloads: 210, citations: 0 },
  },
  {
    id: 'a7',
    slug: 'always-on-wake-word-detector-22nm-fdsoi',
    journalSlug: 'ijse',
    type: 'Research Article',
    status: 'published',
    title: 'A 0.9 µW always-on wake-word detector in 22 nm FD-SOI for battery-free sensor nodes',
    authors: [
      { name: 'Jun-ho Park', affiliationIds: ['af1'], corresponding: true },
      { name: 'Matthias Keller', affiliationIds: ['af2'] },
      { name: 'Aisha Bello', affiliationIds: ['af3'] },
      { name: 'Luis Ortega', affiliationIds: ['af2'] },
      { name: 'Sven Andersson', affiliationIds: ['af4'] },
      { name: 'Mei Lin', affiliationIds: ['af1'] },
    ],
    affiliations: [
      { id: 'af1', name: 'Department of Electrical Engineering, KAIST', country: 'Republic of Korea' },
      { id: 'af2', name: 'Integrated Systems Laboratory, RWTH Aachen University', country: 'Germany' },
      { id: 'af3', name: 'Department of Electronic Engineering, University of Ibadan', country: 'Nigeria' },
      { id: 'af4', name: 'Department of Microtechnology, Chalmers University of Technology', country: 'Sweden' },
    ],
    abstract:
      'We report an analogue-domain feature extractor and binarised classifier achieving 94.1% detection accuracy at 0.9 µW, enabling continuous keyword spotting from harvested energy.',
    keywords: ['ultra-low power', 'keyword spotting', 'FD-SOI', 'energy harvesting'],
    doi: '10.63521/ijse.2026.0019',
    volume: 1,
    issue: 2,
    pages: '132–150',
    publishedIso: '2026-06-15',
    acceptedIso: '2026-05-25',
    access: openAccess,
    licence: ccby,
    metrics: { views: 1093, downloads: 388, citations: 1 },
  },
  {
    id: 'a8',
    slug: 'scaling-university-spinout-without-venture-capital',
    journalSlug: 'ijei',
    type: 'Case Study',
    status: 'published',
    title: 'Scaling a university spin-out without venture capital: a twelve-year case study in medical devices',
    authors: [{ name: 'Rachel Adeyemi', affiliationIds: ['af1'], corresponding: true }],
    affiliations: [{ id: 'af1', name: 'Saïd Business School, University of Oxford', country: 'United Kingdom' }],
    abstract:
      'This case study traces the financing, regulatory and organisational decisions of a medical-device spin-out that reached profitability through revenue and grant funding alone.',
    keywords: ['spin-out', 'bootstrapping', 'medical devices', 'technology transfer'],
    doi: '10.63521/ijei.2026.0006',
    volume: 1,
    issue: 1,
    pages: '34–52',
    publishedIso: '2026-05-02',
    acceptedIso: '2026-04-08',
    access: openAccess,
    licence: ccby,
    metrics: { views: 615, downloads: 190, citations: 0 },
  },
  {
    id: 'a9',
    slug: 'evidence-before-adoption-editorial-agenda-digital-health',
    journalSlug: 'ijdh',
    type: 'Editorial',
    status: 'published',
    title: 'Evidence before adoption: an editorial agenda for digital health research',
    authors: [{ name: 'Editorial Office, IJDH', affiliationIds: ['af1'] }],
    affiliations: [{ id: 'af1', name: 'NextGenIQ Press', country: 'United Kingdom' }],
    abstract:
      'The inaugural editorial sets out the journal’s expectations for evaluation design, reporting standards and data availability in digital health studies.',
    keywords: ['editorial', 'evaluation', 'reporting standards'],
    doi: '10.63521/ijdh.2026.0001',
    volume: 1,
    issue: 1,
    pages: '1–3',
    publishedIso: '2026-04-01',
    access: openAccess,
    licence: ccby,
    metrics: { views: 1480, downloads: 320, citations: 2 },
  },
  {
    id: 'a10',
    slug: 'interdisciplinary-peer-review-explicit-integration-criteria',
    journalSlug: 'ijis',
    type: 'Perspective',
    status: 'published',
    title: 'Why interdisciplinary peer review needs explicit criteria for integration',
    authors: [
      { name: 'Olivia Grant', affiliationIds: ['af1'], corresponding: true },
      { name: 'Samuel Mensah', affiliationIds: ['af2'] },
    ],
    affiliations: [
      { id: 'af1', name: 'Science Policy Research Unit, University of Sussex', country: 'United Kingdom' },
      { id: 'af2', name: 'Department of Science and Technology Studies, University of Ghana', country: 'Ghana' },
    ],
    abstract:
      'We argue that reviewers of interdisciplinary work assess disciplinary components separately and rarely evaluate integration itself, and propose four criteria for doing so.',
    keywords: ['peer review', 'interdisciplinarity', 'research evaluation'],
    doi: '10.63521/ijis.2026.0012',
    volume: 1,
    issue: 2,
    pages: '60–68',
    publishedIso: '2026-05-22',
    access: openAccess,
    licence: ccby,
    metrics: { views: 930, downloads: 274, citations: 1 },
  },
  {
    id: 'a11',
    slug: 'groundwater-nitrate-trends-agricultural-policy-38-basins',
    journalSlug: 'ijmr',
    type: 'Research Article',
    status: 'published',
    title: 'Groundwater nitrate trends and agricultural policy change across 38 river basins, 2000–2024',
    authors: [
      { name: 'Karin Vos', affiliationIds: ['af1'], corresponding: true },
      { name: 'Ahmed Haddad', affiliationIds: ['af2'] },
      { name: 'Julia Brenner', affiliationIds: ['af1'] },
    ],
    affiliations: [
      { id: 'af1', name: 'Department of Environmental Sciences, Wageningen University', country: 'Netherlands' },
      { id: 'af2', name: 'National Institute of Agronomy, Tunis', country: 'Tunisia' },
    ],
    abstract:
      'Using a difference-in-differences design on monitoring-well data, we estimate the effect of nitrate-vulnerable-zone designation on groundwater concentrations.',
    keywords: ['nitrate', 'groundwater', 'agricultural policy', 'difference-in-differences'],
    doi: '10.63521/ijmr.2026.0015',
    volume: 1,
    issue: 2,
    pages: '70–96',
    publishedIso: '2026-06-05',
    access: openAccess,
    licence: ccby,
    metrics: { views: 701, downloads: 233, citations: 0 },
  },
  {
    id: 'a12',
    slug: 'evaluation-practices-retrieval-augmented-language-models',
    journalSlug: 'ijic',
    type: 'Review',
    status: 'published',
    title: 'Evaluation practices for retrieval-augmented language models: a scoping review',
    authors: [
      { name: 'Nikhil Varma', affiliationIds: ['af1'], corresponding: true },
      { name: 'Clara Dubois', affiliationIds: ['af2'] },
      { name: 'Ben Adler', affiliationIds: ['af1'] },
    ],
    affiliations: [
      { id: 'af1', name: 'Department of Computer Science, Indian Institute of Science', country: 'India' },
      { id: 'af2', name: 'Inria Paris', country: 'France' },
    ],
    abstract:
      'We map 167 evaluation studies of retrieval-augmented generation and find that fewer than a fifth report retrieval quality separately from answer quality.',
    keywords: ['retrieval-augmented generation', 'evaluation', 'scoping review'],
    doi: '10.63521/ijic.2026.0008',
    volume: 1,
    issue: 1,
    pages: '40–71',
    publishedIso: '2026-04-25',
    access: openAccess,
    licence: ccby,
    metrics: { views: 2402, downloads: 899, citations: 5 },
  },
]

export const demoIssues = [
  {
    journalSlug: 'ijdh',
    volume: 1,
    number: 2,
    year: 2026,
    current: true,
    publishedIso: '2026-06-30',
    sections: [
      { name: 'Editorial', articleIds: ['a9'] },
      { name: 'Research Articles', articleIds: ['a1'] },
    ],
  },
  {
    journalSlug: 'ijic',
    volume: 1,
    number: 2,
    year: 2026,
    current: true,
    publishedIso: '2026-06-30',
    sections: [
      { name: 'Research Articles', articleIds: ['a2'] },
      { name: 'Reviews', articleIds: ['a12'] },
    ],
  },
  {
    journalSlug: 'ijqt',
    volume: 1,
    number: 2,
    year: 2026,
    current: true,
    publishedIso: '2026-06-30',
    sections: [{ name: 'Reviews', articleIds: ['a3'] }],
  },
]
