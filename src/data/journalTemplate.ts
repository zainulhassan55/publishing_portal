import type { ContentBlock, Journal, JournalDetail, JournalMenuGroup, JournalPage } from '../types/content'
import { electronicIssn, issnLabel, printIssn } from './issn'

export const editorialEmail = 'contact@nextgeniqpress.com'
const siteUrl = 'https://www.nextgeniqpress.com'

export type JournalSpec = {
  slug: string
  title: string
  shortTitle: string
  area: string
  tagline: string
  /** One-sentence description used on journal cards. */
  summary: string
  /** "About the Journal" paragraphs; the first one is also the overview summary. */
  about: string[]
  objectives: string[]
  /** Opening paragraphs of "Aims and Scope". */
  scope: string[]
  topics: string[]
  /** Closing paragraph shown after the topics list. */
  scopeNote: string
  /** Typical main-text structure of a research article; defaults to an empirical structure. */
  articleStructure?: string[]
  /** Journal-specific reviewer question about implications. */
  implicationsQuestion: string
  specialIssueAreas: string[]
  /** Phrase completing "... invites original research and review articles addressing emerging developments in". */
  cfpFocus: string
}

const defaultArticleStructure = [
  'Introduction',
  'Literature Review / Related Work',
  'Theoretical Background',
  'Research Methodology',
  'Results',
  'Discussion',
  'Theoretical Implications',
  'Practical Implications',
  'Limitations',
  'Future Research',
  'Conclusion',
]

export const journalMenu: JournalMenuGroup[] = [
  {
    label: 'About',
    items: [
      { kind: 'page', id: 'about' },
      { kind: 'page', id: 'aims-scope' },
      { kind: 'page', id: 'editorial-board' },
      { kind: 'page', id: 'indexing' },
      { kind: 'page', id: 'news' },
      { kind: 'page', id: 'editorial-office' },
    ],
  },
  {
    label: 'Authors',
    items: [
      { kind: 'page', id: 'author-instructions' },
      { kind: 'page', id: 'article-types' },
      { kind: 'page', id: 'peer-review-process' },
      { kind: 'page', id: 'apc' },
      { kind: 'submit', label: 'Submit Manuscript' },
      { kind: 'page', id: 'reviewer-guidelines' },
      { kind: 'page', id: 'special-issue-guidelines' },
    ],
  },
  {
    label: 'Policies',
    items: [
      { kind: 'page', id: 'publication-ethics' },
      { kind: 'page', id: 'open-access' },
      { kind: 'page', id: 'copyright-licensing' },
      { kind: 'page', id: 'generative-ai-policy' },
      { kind: 'page', id: 'research-data-policy' },
      { kind: 'page', id: 'corrections-retractions' },
    ],
  },
  {
    label: 'Content',
    items: [
      { kind: 'page', id: 'current-issue' },
      { kind: 'page', id: 'articles-in-press' },
      { kind: 'archive', label: 'Archive' },
      { kind: 'page', id: 'special-issues' },
      { kind: 'page', id: 'call-for-papers' },
    ],
  },
]

function page(id: string, label: string, title: string, summary: string, blocks: ContentBlock[]): JournalPage {
  return { id, label, title, summary, blocks }
}

function aboutPages(j: JournalSpec): JournalPage[] {
  const t = j.title
  const s = j.shortTitle

  return [
    page('about', 'About the Journal', 'About the Journal', `Mission, objectives, and key facts about ${s}.`, [
      { title: 'About the Journal', paragraphs: j.about },
      { title: 'Journal Objectives', paragraphs: ['The journal aims to:'], bullets: j.objectives },
      {
        title: 'Journal Information',
        bullets: [
          `Full title: ${t} (${s})`,
          'Publisher: NextGenIQ Press',
          'Peer review: Double-blind peer review',
          'Access model: Open access',
          'License: Creative Commons Attribution 4.0 International (CC BY 4.0)',
          'Publication model: Continuous online publication',
          'Language: English',
          'Submission fee: None',
        ],
      },
    ]),
    page('aims-scope', 'Aims & Scope', 'Aims and Scope', `The research areas and topics published by ${s}.`, [
      { title: 'Aims and Scope', paragraphs: j.scope },
      {
        title: 'Topics of Interest',
        paragraphs: [`${s} welcomes submissions in areas including, but not limited to:`],
        bullets: j.topics,
      },
      { title: 'Interdisciplinary Contributions', paragraphs: [j.scopeNote] },
    ]),
    page('editorial-board', 'Editorial Board', 'Editorial Board', `The international Editorial Board guiding ${s}.`, [
      {
        title: 'Editorial Board',
        paragraphs: [
          `The ${t} is supported by an international Editorial Board comprising researchers and professionals with expertise across ${j.area.toLowerCase()} and related disciplines.`,
          "The Editorial Board contributes to the journal's academic development, peer-review quality, international visibility, and strategic direction.",
        ],
      },
      {
        title: 'Board Structure',
        bullets: [
          'Editor-in-Chief',
          'Co-Editor-in-Chief',
          'Senior Editors',
          'Associate Editors',
          'Editorial Board Members',
          'International Advisory Board',
        ],
      },
      {
        title: 'Board Members',
        paragraphs: [
          'Editorial Board appointments are being finalised. Each member will be listed with their photograph, position, affiliation, country, research interests, and ORCID or Google Scholar profile as appointments are confirmed.',
        ],
      },
      {
        title: 'Join the Editorial Board',
        paragraphs: [
          `Researchers with an established publication record in the journal's scope who are interested in serving on the Editorial Board are invited to contact the Editorial Office at ${editorialEmail} with a short CV and a statement of research interests.`,
        ],
      },
    ]),
    page('indexing', 'Indexing & Abstracting', 'Indexing & Abstracting', `Discoverability and indexing status of ${s}.`, [
      {
        title: 'Indexing & Abstracting',
        paragraphs: [
          `The ${t} is a developing international scholarly journal committed to increasing the discoverability, accessibility, and long-term visibility of its published research.`,
          'As the journal develops its publication record, applications will be considered for relevant scholarly indexing and abstracting services in accordance with their respective eligibility requirements and evaluation procedures.',
          "The journal's indexing information will be updated on this page as services confirm coverage.",
        ],
      },
      { title: 'Current Indexing', paragraphs: ['To be updated.'] },
    ]),
    page('news', 'News', 'News & Announcements', `The latest developments from ${s}.`, [
      {
        title: 'News & Announcements',
        paragraphs: [
          `Stay informed about the latest developments from the ${t}. This section provides updates concerning:`,
        ],
        bullets: [
          'Calls for Papers',
          'New Issues',
          'Special Issues',
          'Editorial Board Appointments',
          'Journal Milestones',
          'Submission Deadlines',
          'Awards and Recognitions',
          'Partnerships and Collaborations',
          'New Journal Policies',
          `Conferences and Research Activities relevant to ${s}`,
        ],
      },
      {
        title: 'Latest News',
        subsections: [
          {
            title: `Call for Papers — ${t}`,
            paragraphs: [
              'October 2026',
              `${s} invites original research and review articles addressing emerging developments in ${j.cfpFocus}. See Call for Papers for details.`,
            ],
          },
        ],
      },
    ]),
    page('editorial-office', 'Editorial Office', 'Editorial Office', `How to contact the ${s} Editorial Office.`, [
      {
        title: 'Contact the Editorial Office',
        paragraphs: [
          `The Editorial Office of the ${t} provides assistance concerning manuscript submissions, peer review, journal policies, special issues, publication procedures, and other journal-related enquiries.`,
        ],
      },
      {
        title: 'General Enquiries',
        paragraphs: [t, 'NextGenIQ Press', `Email: ${editorialEmail}`, `Website: ${siteUrl}/journals/${j.slug}`],
      },
      {
        title: 'Manuscript Enquiries',
        paragraphs: [
          `For questions regarding submissions, manuscript status, revisions, or peer review, please contact the Editorial Office at ${editorialEmail}, quoting the manuscript ID where available.`,
        ],
      },
      {
        title: 'Technical Support',
        paragraphs: [
          `For difficulties with the submission platform, account access, manuscript uploads, or other technical issues, please contact the technical support team at ${editorialEmail}.`,
        ],
      },
      {
        title: 'Special Issue Enquiries',
        paragraphs: [
          'Researchers interested in proposing a Special Issue should contact the Editorial Office with the proposed title, scope, Guest Editor information, and preliminary topic list.',
        ],
      },
    ]),
  ]
}

function authorPages(j: JournalSpec): JournalPage[] {
  const t = j.title
  const s = j.shortTitle
  const structure = j.articleStructure ?? defaultArticleStructure

  return [
    page(
      'author-instructions',
      'Instructions for Authors',
      'Instructions for Authors',
      `How to prepare a manuscript for submission to ${s}.`,
      [
        {
          title: 'General Guidelines',
          paragraphs: [
            `Authors submitting manuscripts to ${s} should ensure that their work is original, academically rigorous, clearly written, and relevant to the aims and scope of the journal.`,
            `Manuscripts must not be simultaneously submitted to another journal while under consideration by ${s}.`,
          ],
        },
        {
          title: 'Manuscript Structure',
          paragraphs: ['Research articles should normally contain:'],
          subsections: [
            {
              title: 'Title',
              paragraphs: ['The title should be concise, informative, and accurately represent the study.'],
            },
            {
              title: 'Abstract',
              paragraphs: [
                'The abstract should clearly summarize the research problem, methodology, principal findings, and implications of the study.',
              ],
            },
            { title: 'Keywords', paragraphs: ['Authors should normally provide 4–8 keywords.'] },
            {
              title: 'Main Text',
              paragraphs: [
                'A typical research article may include the sections below. The exact structure may vary according to the nature of the manuscript.',
              ],
              bullets: structure.map((section, index) => `${index + 1}. ${section}`),
            },
          ],
        },
        {
          title: 'References',
          paragraphs: [
            'Authors should ensure that all references cited in the manuscript appear in the reference list and vice versa.',
            'References should be complete, accurate, and preferably include DOI information where available.',
          ],
        },
        {
          title: 'Figures and Tables',
          paragraphs: ['Figures and tables should:'],
          bullets: [
            'Be numbered consecutively.',
            'Have descriptive captions.',
            'Be referenced within the manuscript.',
            'Be of sufficient quality for publication.',
            'Clearly identify reproduced or adapted material where applicable.',
          ],
        },
        {
          title: 'Copyrighted Material',
          paragraphs: ['Authors are responsible for obtaining permission for copyrighted material when necessary.'],
        },
        {
          title: 'Language',
          paragraphs: [
            'Manuscripts should be written in clear academic English.',
            'Authors are responsible for ensuring that the manuscript is adequately proofread before submission.',
          ],
        },
        {
          title: 'Anonymised Manuscript',
          paragraphs: [
            `${s} uses double-blind peer review. The manuscript file must not reveal the authors' identities: remove author names, affiliations, acknowledgements, and self-identifying references from the file, and enter author details in the submission form instead.`,
          ],
        },
        {
          title: 'Declarations',
          paragraphs: ['Where applicable, manuscripts should include the following statements before the reference list:'],
          bullets: [
            'Author contributions',
            'Funding',
            'Conflicts of interest',
            'Data availability',
            'Ethical approval and informed consent',
            'Use of generative AI (see Generative AI Policy)',
          ],
        },
        {
          title: 'Submission',
          paragraphs: [
            `Manuscripts are submitted through the journal's online submission system. Authors need to register an account before submitting. There is no charge for manuscript submission.`,
          ],
        },
      ],
    ),
    page('article-types', 'Article Types', 'Article Types', `The categories of manuscripts published by ${s}.`, [
      {
        title: 'Article Types',
        paragraphs: [`${s} may publish the following categories of manuscripts:`],
      },
      {
        title: 'Research Articles',
        paragraphs: [
          "Original theoretical, empirical, computational, or applied research addressing significant problems within the journal's scope.",
        ],
      },
      {
        title: 'Review Articles',
        paragraphs: [
          `Comprehensive and critical analyses of established or emerging areas of ${j.area.toLowerCase()}.`,
          'Systematic literature reviews, bibliometric studies, and meta-analyses are welcome where they provide substantial scholarly insight.',
        ],
      },
      {
        title: 'Editorials',
        paragraphs: [
          'Invited contributions from editors or recognized experts addressing important developments relevant to the journal community.',
        ],
      },
    ]),
    page(
      'peer-review-process',
      'Peer Review Process',
      'Editorial and Peer Review Process',
      `How manuscripts submitted to ${s} are assessed, from submission to publication.`,
      [
        {
          title: 'Overview',
          paragraphs: [`${s} is committed to maintaining a rigorous, fair, constructive, and transparent editorial process.`],
        },
        {
          title: 'Step 1 — Manuscript Submission',
          paragraphs: ["Authors submit their manuscript through the journal's online submission system."],
        },
        {
          title: 'Step 2 — Administrative Screening',
          paragraphs: [
            'The Editorial Office checks the submission for completeness, formatting, required declarations, and basic compliance with journal requirements.',
          ],
        },
        {
          title: 'Step 3 — Editorial Assessment',
          paragraphs: ['The Editor-in-Chief or a designated editor evaluates the manuscript for:'],
          bullets: [
            `Relevance to ${s}'s scope`,
            'Academic quality',
            'Originality',
            'Contribution to knowledge',
            'Methodological appropriateness',
            'Overall suitability for peer review',
          ],
          subsections: [
            {
              title: 'Desk decisions',
              paragraphs: [
                "Manuscripts that clearly fall outside the journal's scope or quality requirements may be declined without external review.",
              ],
            },
          ],
        },
        {
          title: 'Step 4 — Peer Review',
          paragraphs: [
            'Suitable manuscripts are sent to independent experts for double-blind peer review.',
            'Reviewers evaluate aspects such as originality, methodological rigor, validity, clarity, significance, literature coverage, and contribution to the field.',
          ],
        },
        {
          title: 'Step 5 — Editorial Decision',
          paragraphs: ['Following peer review, the editor may recommend:'],
          bullets: ['Accept', 'Minor Revision', 'Major Revision', 'Reject'],
          subsections: [
            {
              title: 'Basis of decisions',
              paragraphs: [
                "Editorial decisions are based on the manuscript's scholarly merit and reviewer assessments. Reviewers provide recommendations, while the final publication decision remains with the responsible editor.",
              ],
            },
          ],
        },
        {
          title: 'Step 6 — Revision',
          paragraphs: [
            'Authors receiving a revision decision should submit a revised manuscript together with a point-by-point response explaining how reviewer and editor comments have been addressed.',
          ],
        },
        {
          title: 'Step 7 — Final Decision',
          paragraphs: [
            'The revised manuscript may be accepted, returned for additional revision, sent for further peer review, or rejected.',
          ],
        },
        {
          title: 'Step 8 — Production',
          paragraphs: [
            'Accepted manuscripts undergo production processes that may include copyediting, typesetting, metadata preparation, author proofing, and final publication.',
          ],
        },
      ],
    ),
    page('apc', 'APC', 'Article Processing Charge (APC)', `Publication charges, waivers, and discounts for ${s}.`, [
      {
        title: 'Article Processing Charge (APC)',
        paragraphs: [
          `The ${t} follows an open-access publishing model.`,
          'Information regarding Article Processing Charges, applicable discounts, institutional arrangements, and waiver policies will be provided transparently on this page.',
        ],
      },
      {
        title: 'Current APC',
        paragraphs: [
          'To be announced.',
          'There is no charge for manuscript submission.',
          'Where an APC applies, payment will only be requested following acceptance of the manuscript and will not influence the editorial or peer-review decision.',
        ],
      },
      {
        title: 'Waivers and Discounts',
        paragraphs: [
          'NextGenIQ Press may establish waiver or discount mechanisms based on author circumstances, institutional arrangements, geographic considerations, or special publishing initiatives.',
          'Requests for eligible waivers or discounts are considered independently of editorial decisions.',
        ],
      },
    ]),
    page('reviewer-guidelines', 'Reviewer Guidelines', 'Guidelines for Reviewers', `Expectations and evaluation criteria for ${s} peer reviewers.`, [
      {
        title: 'Guidelines for Reviewers',
        paragraphs: [
          `Peer reviewers play an essential role in maintaining the scholarly quality and integrity of ${s}.`,
          'Reviewers should provide objective, constructive, evidence-based, and timely assessments.',
        ],
      },
      {
        title: 'Evaluation Criteria',
        paragraphs: ['Reviewers should consider:'],
        bullets: [
          `Is the manuscript relevant to ${s}?`,
          'Is the research problem clearly defined?',
          'Does the manuscript provide an original contribution?',
          'Is the literature review adequate and current?',
          'Is the methodology appropriate?',
          'Are the results presented clearly?',
          'Are the conclusions supported by the evidence?',
          'Are theoretical implications adequately discussed?',
          j.implicationsQuestion,
          'Are limitations appropriately acknowledged?',
          'Is the manuscript clearly written and organized?',
        ],
      },
      {
        title: 'Confidentiality',
        paragraphs: [
          'Manuscripts received for review must be treated as confidential documents.',
          'Reviewers should not share unpublished manuscripts or use unpublished information for personal or professional advantage.',
        ],
      },
      {
        title: 'Conflict of Interest',
        paragraphs: [
          'Reviewers should decline an invitation when a financial, professional, personal, institutional, or other conflict could compromise impartiality.',
        ],
      },
      {
        title: 'Ethical Concerns',
        paragraphs: [
          'Reviewers should inform the responsible editor if they identify possible plagiarism, duplicate publication, fabricated or manipulated data, unethical research practices, or other serious integrity concerns.',
        ],
      },
      {
        title: 'Use of AI Tools',
        paragraphs: [
          'Reviewers should not upload confidential manuscripts into public or third-party generative AI systems. Reviewers remain personally responsible for their assessments. See the Generative AI Policy for details.',
        ],
      },
      {
        title: 'Recommendation',
        paragraphs: ['Reviewers may recommend:'],
        bullets: ['Accept', 'Minor Revision', 'Major Revision', 'Reject'],
        subsections: [
          {
            title: 'Supporting comments',
            paragraphs: [
              'The recommendation should be supported by clear comments for the editor and constructive feedback for the authors.',
            ],
          },
        ],
      },
      {
        title: 'Become a Reviewer',
        paragraphs: [
          `Researchers with expertise in the journal's scope are welcome to register as reviewers through the journal's submission system, or to contact the Editorial Office at ${editorialEmail}.`,
        ],
      },
    ]),
    page(
      'special-issue-guidelines',
      'Special Issue Guidelines',
      'Special Issue Guidelines',
      `How to propose and manage a Special Issue in ${s}.`,
      [
        {
          title: 'Proposing a Special Issue',
          paragraphs: [
            `${s} welcomes proposals for Special Issues addressing important, emerging, and interdisciplinary topics within the journal's scope.`,
            `Proposals should be sent to the Editorial Office at ${editorialEmail}. A proposal should normally contain:`,
          ],
          bullets: [
            'Proposed Title',
            'Aim and Scope',
            'Topics of Interest',
            'Guest Editor(s)',
            'Affiliation(s)',
            'Short Biography',
            'Proposed Timeline',
            'Expected Number of Papers',
            'Promotion and Dissemination Plan',
          ],
        },
        {
          title: 'Editorial Standards',
          paragraphs: [
            "All Special Issue manuscripts undergo the journal's normal editorial and double-blind peer-review standards.",
          ],
        },
        {
          title: 'Guest Editor Conflicts of Interest',
          paragraphs: [
            'Guest Editors should not independently make final decisions on their own manuscripts or manuscripts where a significant conflict of interest exists. Such submissions are handled by an independent editor.',
          ],
        },
      ],
    ),
  ]
}

function policyPages(j: JournalSpec): JournalPage[] {
  const t = j.title
  const s = j.shortTitle

  return [
    page('publication-ethics', 'Publication Ethics', 'Publication Ethics', `Integrity standards for authors, editors, and reviewers at ${s}.`, [
      {
        title: 'Publication Ethics',
        paragraphs: [
          `${s} is committed to maintaining high standards of integrity, transparency, fairness, and accountability throughout the scholarly publishing process.`,
          'The journal expects authors, editors, and reviewers to follow recognized principles of responsible research and publication.',
        ],
      },
      {
        title: 'Originality and Plagiarism',
        paragraphs: [
          'Submissions must represent original work.',
          'Plagiarism, inappropriate text reuse, data fabrication, data falsification, image manipulation, citation manipulation, and other forms of research misconduct are not acceptable.',
          'Similarity-detection software may be used as part of the editorial screening process. A similarity percentage alone does not determine misconduct; potentially problematic overlap is assessed in context by an editor.',
        ],
      },
      {
        title: 'Duplicate Submission',
        paragraphs: ['Authors must not submit the same manuscript simultaneously to multiple journals.'],
      },
      {
        title: 'Authorship',
        paragraphs: [
          'Authorship should be limited to individuals who have made meaningful scholarly contributions to the research.',
          'Guest, gift, and ghost authorship are not acceptable.',
          'All listed authors should approve the submitted manuscript and accept responsibility for their contributions.',
        ],
      },
      {
        title: 'Changes in Authorship',
        paragraphs: [
          'Requests to add, remove, or reorder authors after submission should be accompanied by a clear explanation and agreement from the relevant authors.',
        ],
      },
      {
        title: 'Conflicts of Interest',
        paragraphs: [
          'Authors, editors, and reviewers must disclose relationships or interests that could reasonably influence their work or judgment.',
        ],
      },
      {
        title: 'Research Integrity',
        paragraphs: [
          'Fabrication, falsification, deliberate misrepresentation of results, manipulation of research materials, or deceptive reporting constitute serious breaches of research integrity.',
        ],
      },
      {
        title: 'Human Participants',
        paragraphs: [
          'Research involving human participants or identifiable personal data should comply with applicable institutional, national, and international ethical requirements.',
          'Where required, authors should report ethical approval and informed consent.',
        ],
      },
      {
        title: 'Data Integrity',
        paragraphs: [
          'Authors are responsible for the accuracy and integrity of their research data and should retain appropriate research records.',
          'Editors may request supporting data where necessary to evaluate questions concerning research integrity.',
        ],
      },
      {
        title: 'Corrections and Retractions',
        paragraphs: [
          `When significant errors or misconduct are identified after publication, ${s} may publish an appropriate correction, expression of concern, retraction, or other editorial notice. Such actions preserve the integrity and transparency of the scholarly record.`,
        ],
      },
      {
        title: 'Complaints and Appeals',
        paragraphs: [
          'Authors may submit reasoned appeals concerning editorial decisions.',
          `Complaints concerning editorial conduct, peer review, ethics, or publication processes should be directed to the Editorial Office at ${editorialEmail} and are handled objectively and confidentially.`,
        ],
      },
    ]),
    page('open-access', 'Open Access', 'Open Access Policy', `How ${s} makes its research freely available.`, [
      {
        title: 'Open Access Policy',
        paragraphs: [
          `The ${t} is intended to support broad dissemination of scholarly research through open access.`,
          'Published open-access articles are freely accessible online, enabling researchers, practitioners, policymakers, students, and the public to access scholarly work without subscription barriers.',
        ],
      },
      {
        title: 'Reader Rights',
        paragraphs: [
          'Readers may read, download, copy, distribute, print, search, and link to the full texts of published articles, and reuse them under the terms of the article license, provided appropriate attribution is given.',
        ],
      },
      {
        title: 'Charges',
        paragraphs: [
          'There are no subscription or pay-per-view charges for readers and no charge for manuscript submission. See Article Processing Charge (APC) for publication charges.',
        ],
      },
    ]),
    page('copyright-licensing', 'Copyright & Licensing', 'Copyright & Licensing', `Author rights and the license used for ${s} articles.`, [
      {
        title: 'Copyright',
        paragraphs: [
          'Authors retain copyright in their published work while granting NextGenIQ Press the right to publish and identify itself as the original publisher of the article.',
        ],
      },
      {
        title: 'Licensing',
        paragraphs: [
          `Articles published in ${s} are distributed under the Creative Commons Attribution 4.0 International (CC BY 4.0) license.`,
          'Under CC BY 4.0, published material may be shared and adapted provided appropriate attribution is given to the original authors and source.',
        ],
      },
      {
        title: 'Third-Party Material',
        paragraphs: [
          'Authors are responsible for obtaining permission to reproduce copyrighted material from other sources and for identifying such material clearly in the article.',
        ],
      },
    ]),
    page(
      'generative-ai-policy',
      'Generative AI Policy',
      'Generative Artificial Intelligence Policy',
      `Responsible use of generative AI by authors, reviewers, and editors of ${s}.`,
      [
        {
          title: 'Generative Artificial Intelligence Policy',
          paragraphs: [
            `${s} recognizes that generative artificial intelligence and AI-assisted technologies are increasingly used in academic research and scholarly communication.`,
            'The journal supports responsible use of these technologies while maintaining human accountability, transparency, originality, confidentiality, and research integrity.',
          ],
        },
        {
          title: 'AI Cannot Be an Author',
          paragraphs: [
            'Generative AI systems, large language models, chatbots, and other AI tools cannot be listed as authors or co-authors.',
            'Authorship requires accountability for the work, which can only be assumed by human authors.',
          ],
        },
        {
          title: 'AI-Assisted Writing',
          paragraphs: [
            'Authors may use AI-assisted technologies to support activities such as language improvement, readability, grammar correction, or organization of text.',
            'Authors remain fully responsible for:',
          ],
          bullets: ['Accuracy', 'Originality', 'Citations', 'Arguments', 'Conclusions', 'Ethical compliance', 'Final manuscript content'],
          subsections: [
            { title: 'Verification', paragraphs: ['Authors should carefully verify AI-generated information.'] },
          ],
        },
        {
          title: 'Disclosure',
          paragraphs: [
            'Where generative AI has made a substantive contribution to manuscript preparation, data analysis, content generation, or research methodology, authors should transparently disclose its use. A disclosure may include:',
          ],
          bullets: ['AI tool used', 'Purpose of use', 'How the output was verified by the authors'],
          subsections: [
            {
              title: 'Routine tools',
              paragraphs: [
                'Routine spelling or grammar-checking tools need not be treated in the same manner as substantive generative-AI use.',
              ],
            },
          ],
        },
        {
          title: 'AI-Generated References',
          paragraphs: [
            'Authors must verify every bibliographic reference against reliable scholarly sources.',
            'Fabricated, nonexistent, inaccurate, or misleading references generated by AI tools are unacceptable.',
          ],
        },
        {
          title: 'AI in Research Methodology',
          paragraphs: [
            'When AI-generated data, synthetic data, generative models, LLMs, AI agents, or related systems form part of the actual research methodology, their use should be described sufficiently for readers to understand and, where practicable, reproduce the study.',
          ],
        },
        {
          title: 'AI-Generated Images and Data',
          paragraphs: [
            'Authors must clearly identify AI-generated or synthetically generated research material where relevant.',
            'AI tools must not be used to deceptively alter research data, images, experimental evidence, or results.',
          ],
        },
        {
          title: 'Reviewers and AI',
          paragraphs: [
            'Reviewers should not upload confidential manuscripts into public or third-party generative AI systems where doing so could compromise manuscript confidentiality, intellectual property, or author information.',
            'Reviewers remain personally responsible for their assessments.',
          ],
        },
        {
          title: 'Editors and AI',
          paragraphs: [
            "Editors should protect the confidentiality of submitted manuscripts and should not disclose confidential manuscript information to external AI systems in a manner inconsistent with the journal's confidentiality obligations.",
            'Final editorial decisions must remain under human editorial responsibility.',
          ],
        },
      ],
    ),
    page('research-data-policy', 'Research Data Policy', 'Research Data Policy', `How ${s} expects research data to be reported, shared, and retained.`, [
      {
        title: 'Research Data Policy',
        paragraphs: [
          `${s} supports transparency and reproducibility. Authors are responsible for the accuracy and integrity of their research data and should retain appropriate research records.`,
        ],
      },
      {
        title: 'Data Availability Statement',
        paragraphs: [
          'Research articles should include a Data Availability Statement explaining where and how the data supporting the findings can be accessed, or why the data cannot be shared, for example for privacy, ethical, legal, or commercial reasons.',
        ],
      },
      {
        title: 'Data Sharing',
        paragraphs: [
          'Authors are encouraged to deposit data, code, and other research materials in recognized public repositories and to cite them in the reference list, where this is consistent with ethical and legal obligations.',
        ],
      },
      {
        title: 'Personal and Sensitive Data',
        paragraphs: [
          'Data involving human participants or identifiable personal information must be handled in accordance with applicable ethical approvals, consent, and data-protection requirements, and anonymised where appropriate.',
        ],
      },
      {
        title: 'Requests from Editors',
        paragraphs: [
          'Editors may request supporting data where necessary to evaluate a manuscript or to examine questions concerning research integrity.',
        ],
      },
    ]),
    page(
      'corrections-retractions',
      'Corrections & Retractions',
      'Corrections & Retractions',
      `How ${s} corrects the scholarly record after publication.`,
      [
        {
          title: 'Corrections & Retractions',
          paragraphs: [
            `When significant errors or misconduct are identified after publication, ${s} may publish an appropriate correction, expression of concern, retraction, or other editorial notice. Such actions preserve the integrity and transparency of the scholarly record.`,
          ],
        },
        {
          title: 'Corrections',
          paragraphs: [
            'A correction is published when an error affects part of an article but does not invalidate its overall findings. Authors who discover an error in their published article should notify the Editorial Office promptly.',
          ],
        },
        {
          title: 'Expressions of Concern',
          paragraphs: [
            'An expression of concern may be published when there are serious questions about an article that remain under investigation.',
          ],
        },
        {
          title: 'Retractions',
          paragraphs: [
            'An article may be retracted when its findings are unreliable because of major error or research misconduct, or when it involves plagiarism, duplicate publication, or serious ethical breaches. Retracted articles remain accessible, clearly marked as retracted and linked to the retraction notice.',
          ],
        },
        {
          title: 'Reporting a Concern',
          paragraphs: [`Concerns about a published article should be sent to the Editorial Office at ${editorialEmail}.`],
        },
      ],
    ),
  ]
}

function contentPages(j: JournalSpec): JournalPage[] {
  const t = j.title
  const s = j.shortTitle

  return [
    page('current-issue', 'Current Issue', 'Current Issue', `The latest issue of ${s}.`, [
      {
        title: 'Current Issue',
        paragraphs: [
          `The inaugural issue of the ${t} is in preparation. Accepted articles will appear here as the issue is published.`,
          'Authors are invited to submit original research and review articles for consideration.',
        ],
      },
    ]),
    page('articles-in-press', 'Articles in Press', 'Articles in Press', `Accepted ${s} articles published online ahead of their issue.`, [
      {
        title: 'Articles in Press',
        paragraphs: [
          'Articles in Press are peer-reviewed, accepted articles that are published online before they are assigned to an issue.',
          'There are no articles in press at present.',
        ],
      },
    ]),
    page('special-issues', 'Special Issues', 'Special Issues', `Current and proposed Special Issues of ${s}.`, [
      {
        title: 'Special Issues',
        paragraphs: [
          `${s} welcomes proposals for Special Issues addressing important, emerging, and interdisciplinary topics within the journal's scope.`,
          `Special Issues provide an opportunity to bring together high-quality research around rapidly developing themes in ${j.area.toLowerCase()}.`,
        ],
      },
      { title: 'Potential Areas', paragraphs: ['Examples include:'], bullets: j.specialIssueAreas },
      {
        title: 'Open Special Issues',
        paragraphs: [
          'There are no open Special Issues at present. To propose one, see the Special Issue Guidelines.',
        ],
      },
    ]),
    page('call-for-papers', 'Call for Papers', 'Call for Papers', `${s} is accepting submissions.`, [
      {
        title: `Call for Papers — ${t}`,
        paragraphs: [
          `${s} invites original research and review articles addressing emerging developments in ${j.cfpFocus}.`,
        ],
      },
      { title: 'Topics of Interest', bullets: j.topics },
      {
        title: 'Why Publish With Us',
        bullets: [
          'Double-blind peer review',
          'Open access under CC BY 4.0',
          'No submission fee',
          'Continuous online publication after acceptance',
        ],
      },
      {
        title: 'How to Submit',
        paragraphs: [
          "Prepare your manuscript according to the Instructions for Authors and submit it through the journal's online submission system.",
        ],
      },
    ]),
  ]
}

export function buildJournal(j: JournalSpec): Journal {
  return {
    slug: j.slug,
    title: j.title,
    shortTitle: j.shortTitle,
    issn: issnLabel(electronicIssn(j.slug)),
    area: j.area,
    access: 'Open Access',
    frequency: 'Continuous',
    editor: 'Editorial Board',
    reviewType: 'Double-blind peer review',
    summary: j.summary,
  }
}

export function buildJournalDetail(j: JournalSpec): JournalDetail {
  return {
    slug: j.slug,
    title: j.title,
    shortTitle: j.shortTitle,
    tagline: j.tagline,
    issn: issnLabel(printIssn(j.slug)),
    eIssn: issnLabel(electronicIssn(j.slug)),
    area: j.area,
    access: 'Open Access',
    frequency: 'Continuous publication',
    publisher: 'NextGenIQ Press',
    ownership: 'The journal is owned and published by NextGenIQ Press.',
    editor: 'Editorial Board',
    reviewType: 'Double-blind peer review',
    license: 'CC BY 4.0',
    scope: j.about[0],
    overview: j.about.slice(0, 2),
    metrics: [
      { label: 'Access model', value: 'Open access' },
      { label: 'License', value: 'CC BY 4.0' },
      { label: 'Review model', value: 'Double-blind' },
      { label: 'Submission fee', value: 'None' },
    ],
    board: [
      `${j.shortTitle} is guided by an international Editorial Board of researchers and professionals in ${j.area.toLowerCase()} and related fields.`,
      'Board member profiles will be published as appointments are confirmed.',
    ],
    topics: j.topics,
    quickLinks: [],
    pages: [...aboutPages(j), ...authorPages(j), ...policyPages(j), ...contentPages(j)],
  }
}
