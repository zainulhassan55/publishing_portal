import type { ContentBlock } from '@/types/content'
import { editorialEmail, licenceShort, licenceUrl, siteName } from '@/lib/site'

/**
 * Publisher-level policies and legal pages.
 *
 * Audit finding F-14 was that policy text had two sources of truth — the portal
 * and OJS — kept in step by a sync script that was missing from the repo. The
 * rule now: **this file is the only source.** Journal and series pages state how
 * a title applies these policies; they do not restate them. If a rule changes,
 * it changes here, and the OJS copy is replaced with a link to this page rather
 * than a duplicate of it.
 *
 * Each `summary` is the publisher's own statement of the policy (October 2026).
 * It leads the policy page and is what the /policies index shows. Privacy,
 * terms, cookies and accessibility carry the publisher's full text as given.
 */

export type PolicyGroup = 'Publishing ethics' | 'Access and data' | 'Publisher policies'

export const policyGroups: PolicyGroup[] = ['Publishing ethics', 'Access and data', 'Publisher policies']

export type PolicyPage = {
  slug: string
  title: string
  group: PolicyGroup
  summary: string
  /** Opening paragraph on the policy page, where the publisher's page text differs from its index summary. */
  intro?: string
  /** Last substantive revision. ISO 8601. */
  updatedIso: string
  blocks: ContentBlock[]
}

const OCT_2026 = '2026-10-25'

export const policies: PolicyPage[] = [
  /* ---------------------------- Publishing ethics --------------------------- */
  {
    slug: 'publication-ethics',
    title: 'Publication Ethics',
    group: 'Publishing ethics',
    summary:
      'NextGenIQ Press expects authors, reviewers, and editors to uphold research integrity, accurate reporting, and responsible authorship. Plagiarism, fabricated or manipulated findings, duplicate publication, and undisclosed conflicts of interest are unacceptable. Concerns are assessed fairly, with reference to relevant COPE guidance.',
    updatedIso: OCT_2026,
    blocks: [
      {
        title: 'Principles',
        paragraphs: [
          `${siteName} follows the Core Practices of the Committee on Publication Ethics (COPE) and handles suspected misconduct using the COPE flowcharts.`,
          'These standards apply identically across every journal and book series we publish.',
        ],
      },
      {
        title: 'Author responsibilities',
        bullets: [
          'Submit original work that is not under consideration elsewhere.',
          'Credit all contributors and cite sources accurately.',
          'Disclose all funding and competing interests.',
          'Report errors discovered after publication promptly.',
          'Obtain ethical approval and consent where the research requires it.',
        ],
      },
      {
        title: 'Authorship',
        paragraphs: [
          'Authorship is limited to those who made a meaningful scholarly contribution. Guest, gift and ghost authorship are not acceptable.',
          'All listed authors must approve the submitted manuscript and accept responsibility for their contributions. Requests to add, remove or reorder authors after submission require a written explanation and the agreement of all affected authors.',
        ],
      },
      {
        title: 'Investigating concerns',
        paragraphs: [
          `Concerns about a published work should be sent to ${editorialEmail}. They are handled confidentially, and by an editor who was not involved in the original decision.`,
          'Where a concern is substantiated we publish a correction, an expression of concern or a retraction as appropriate. Appeals and complaints follow the Complaints and Appeals policy.',
        ],
      },
    ],
  },
  {
    slug: 'peer-review-policy',
    title: 'Peer Review Policy',
    group: 'Publishing ethics',
    summary:
      'Submissions undergo editorial screening and peer review appropriate to the publication type. Reviewers assess originality, methodological soundness, clarity, and the strength of the evidence. Each title specifies its review model, and editorial decisions are based on scholarly merit independently of publication payments.',
    updatedIso: OCT_2026,
    blocks: [],
  },
  {
    slug: 'generative-ai-policy',
    title: 'Generative AI Policy',
    group: 'Publishing ethics',
    summary:
      'Authors must disclose substantive use of generative AI and remain responsible for the accuracy, originality, and integrity of their submissions. AI tools cannot be credited as authors. Editors and reviewers must not upload confidential submissions or review materials to public or third-party generative AI services.',
    updatedIso: OCT_2026,
    blocks: [
      {
        title: 'Authors',
        paragraphs: [
          'Authors may use AI-assisted tools for language, readability and organisation. Where such a tool has made a substantive contribution to writing, analysis, content generation or methodology, it must be disclosed in the declarations with the tool, version and purpose.',
        ],
        bullets: [
          'Verify every bibliographic reference against the source. Fabricated references are a serious breach.',
          'Describe AI used as part of the research methodology in enough detail to be reproducible.',
          'Identify AI-generated or synthetic images and data clearly.',
          'Never use AI tools to alter research data, images or results deceptively.',
        ],
      },
      {
        title: 'Reviewers and editors',
        paragraphs: [
          'Uploading a manuscript, report or confidential correspondence to a generative AI tool breaches the confidentiality of material entrusted to reviewers and editors. Final editorial decisions remain a human responsibility.',
        ],
      },
      {
        title: 'Routine tools',
        paragraphs: ['Spelling and grammar checkers are not treated as substantive generative-AI use and need no disclosure.'],
      },
    ],
  },
  {
    slug: 'corrections-retractions',
    title: 'Corrections and Retractions',
    group: 'Publishing ethics',
    summary:
      'Errors or concerns affecting published work are investigated and addressed through corrections, expressions of concern, or retractions, as appropriate. Notices explain the reason for the action and are linked to the original publication. Retractions are clearly identified to maintain a transparent scholarly record.',
    updatedIso: OCT_2026,
    blocks: [
      {
        title: 'Corrections',
        paragraphs: [
          'A correction is published when an error affects part of a work but does not invalidate its overall findings. Authors who discover an error in their published work should notify the editorial office promptly.',
        ],
      },
      {
        title: 'Expressions of concern',
        paragraphs: [
          'An expression of concern is published when there are serious unresolved questions about a work that remain under investigation.',
        ],
      },
      {
        title: 'Retractions',
        paragraphs: [
          'A work is retracted when its findings are unreliable through major error or misconduct, or where plagiarism, duplicate publication or a serious ethical breach is established. Retracted works remain online, clearly marked as retracted, with a linked notice explaining the reason.',
        ],
      },
    ],
  },

  /* ----------------------------- Access and data ---------------------------- */
  {
    slug: 'open-access',
    title: 'Open Access and Licensing',
    group: 'Access and data',
    summary:
      'NextGenIQ Press publications are freely available to read online. Each publication identifies its applicable licence and permitted uses. Where a Creative Commons licence applies, readers may reuse the material according to its conditions, including appropriate attribution.',
    updatedIso: OCT_2026,
    blocks: [
      {
        title: 'Article processing charges',
        paragraphs: [
          'Any introduction of, or change to, article processing charges (APCs) will be announced at least six months before taking effect and will apply only to manuscripts submitted on or after the effective date. Full or partial waivers will be available under the publisher’s published waiver policy, with priority given to authors based in low- and lower-middle-income countries and those facing financial hardship. Waiver requests will be handled confidentially by the publishing office and will not be disclosed to handling editors or reviewers. Editorial decisions will be made independently of authors’ ability to pay.',
        ],
      },
      {
        title: 'Licence',
        paragraphs: [
          `Journal articles and book series volumes are published under the Creative Commons Attribution 4.0 International licence (${licenceShort}), available at ${licenceUrl}, unless the work states otherwise.`,
        ],
      },
    ],
  },
  {
    slug: 'copyright-licensing',
    title: 'Copyright and Permissions',
    group: 'Access and data',
    summary:
      'Copyright ownership and publishing rights are specified in the applicable publishing agreement and displayed with the work. Authors must obtain permission for third-party material where required. Reuse beyond the applicable licence requires permission from the relevant rights holder.',
    updatedIso: OCT_2026,
    blocks: [],
  },
  {
    slug: 'research-data-policy',
    title: 'Research Data Policy',
    group: 'Access and data',
    summary:
      'Authors are encouraged to make supporting data, code, and research materials available through suitable repositories and include a data availability statement where applicable. Restrictions arising from privacy, consent, confidentiality, or legal obligations should be explained. Individual publications may set additional requirements.',
    updatedIso: OCT_2026,
    blocks: [
      {
        title: 'Deposit and citation',
        paragraphs: [
          'Where possible, deposit data in a recognised repository and cite it in the reference list with a persistent identifier. Code needed to reproduce an analysis should be shared through a public repository with an archived release.',
        ],
      },
      {
        title: 'Personal and sensitive data',
        paragraphs: [
          'Data involving human participants or identifiable personal information must be handled in accordance with the applicable ethical approvals, consent and data-protection requirements, and anonymised where appropriate.',
        ],
      },
    ],
  },
  {
    slug: 'archiving-preservation',
    title: 'Archiving and Preservation',
    group: 'Access and data',
    summary:
      'Long-term access arrangements are described on individual publication pages. These identify any preservation services in use and the content they cover. Authors should consult the applicable licence and repository policy when depositing copies of their work.',
    updatedIso: OCT_2026,
    blocks: [],
  },

  /* --------------------------- Publisher policies --------------------------- */
  {
    slug: 'complaints-appeals',
    title: 'Complaints and Appeals',
    group: 'Publisher policies',
    summary: `Authors may appeal editorial decisions by providing a reasoned explanation and supporting evidence. Complaints about publishing practices or ethical conduct should include sufficient details for investigation. Appeals and complaints are reviewed impartially, with independent editorial involvement where a conflict exists. Contact ${editorialEmail}.`,
    updatedIso: OCT_2026,
    blocks: [],
  },
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    group: 'Publisher policies',
    summary:
      'This policy explains how personal information is collected and used when people visit our website, submit manuscripts, review content, or contact us. It also describes service-provider access, data retention, security measures, and how individuals can raise privacy concerns or exercise applicable rights.',
    intro: 'This policy applies to NextGenIQ Press journals and series.',
    updatedIso: OCT_2026,
    blocks: [
      {
        title: 'Information We Collect and Use',
        paragraphs: [
          'We collect information provided when you create an account, submit or review a manuscript, subscribe to alerts, or contact us. This may include your name, email address, affiliation, ORCID iD, submission materials, and correspondence. We use it to manage publishing activities, deliver requested communications, and respond to enquiries.',
        ],
      },
      {
        title: 'Sharing and Retention',
        paragraphs: [
          'Relevant information may be shared with editors, reviewers, and service providers as needed to support publishing, subject to confidentiality requirements. We do not sell personal data. Information is retained as necessary for editorial administration, research integrity, and applicable legal obligations. You may unsubscribe from alerts at any time.',
        ],
      },
      {
        title: 'Your Rights',
        paragraphs: [
          `To request access, correction, or deletion of your personal information, contact ${editorialEmail}. Requests are considered under applicable law. Some information may need to be retained to preserve the scholarly record or meet legal obligations; changes to published content are handled through the relevant editorial policies.`,
        ],
      },
    ],
  },
  {
    slug: 'terms',
    title: 'Terms of Use',
    group: 'Publisher policies',
    summary: 'The terms on which the NextGenIQ Press website and its content may be used.',
    intro: 'These terms apply to the NextGenIQ Press website and its journals and series.',
    updatedIso: OCT_2026,
    blocks: [
      {
        title: 'Content and Licensing',
        paragraphs: [
          'Published content may be accessed and reused under the licence stated on each work. Content licensed under CC BY 4.0 may be shared and adapted, including commercially, with appropriate attribution, a link to the licence, and an indication of any changes. Third-party material may carry separate restrictions. Website design and other publisher-owned material are not covered unless expressly stated.',
        ],
      },
      {
        title: 'Acceptable Use',
        paragraphs: [
          'Use the website lawfully and avoid disrupting its operation or compromising its security. Automated access for research and indexing should respect published access instructions and reasonable rate limits. Access may be restricted where activity affects service performance or security.',
        ],
      },
      {
        title: 'Accuracy and Availability',
        paragraphs: [
          'Concerns about published content are addressed through our corrections and retractions policy. We aim to maintain reliable access but cannot guarantee uninterrupted availability.',
        ],
      },
      {
        title: 'Contact',
        paragraphs: [`For questions about these terms, email ${editorialEmail}.`],
      },
    ],
  },
  {
    slug: 'cookies',
    title: 'Cookies and Local Storage',
    group: 'Publisher policies',
    summary: 'The cookie and browser storage this website uses. We do not use analytics, advertising, or cross-site tracking cookies.',
    intro: 'This policy applies to the NextGenIQ Press website and its journals and series.',
    updatedIso: OCT_2026,
    blocks: [
      {
        title: 'What We Use',
        paragraphs: [
          'We use a session cookie to keep you signed in. It is removed when you sign out. Your selected appearance settings, such as colour palette and display mode, are saved in your browser’s local storage and are not sent to our servers.',
          'We do not use analytics, advertising, or cross-site tracking cookies.',
        ],
      },
      {
        title: 'Your Choices',
        paragraphs: [
          'You can manage cookies and clear local storage through your browser settings. Blocking the session cookie may prevent sign-in features from working, while clearing local storage will reset your appearance preferences.',
          'If we introduce technologies that require consent, we will request it before activating them.',
        ],
      },
      {
        title: 'Contact',
        paragraphs: [`For questions, email ${editorialEmail}.`],
      },
    ],
  },
  {
    slug: 'advertising',
    title: 'Advertising Policy',
    group: 'Publisher policies',
    summary:
      'Any advertising or sponsored content must be clearly identified and distinguishable from scholarly material. Advertising does not influence peer review, editorial decisions, or publication priority. The publisher may decline or remove misleading, inappropriate, or conflicting advertisements.',
    updatedIso: OCT_2026,
    blocks: [],
  },
  {
    slug: 'accessibility',
    title: 'Accessibility Statement',
    group: 'Publisher policies',
    summary: `NextGenIQ Press aims to make its website and publications accessible to a broad readership. We welcome reports of accessibility barriers and requests for assistance. Please contact ${editorialEmail}, identifying the page or publication and describing the difficulty encountered.`,
    intro:
      'NextGenIQ Press aims to make its website and publications accessible to all users. This statement applies to our journals and series.',
    updatedIso: OCT_2026,
    blocks: [
      {
        title: 'Our Approach',
        paragraphs: [
          'We aim to meet WCAG 2.2 Level AA, with attention to readable text, colour contrast, keyboard navigation, accessible controls, image descriptions, and reduced-motion preferences. Independent verification of conformance has not yet been completed.',
        ],
      },
      {
        title: 'Current Limitations',
        paragraphs: [
          'Some author-supplied PDFs may lack accessibility features. Where available, readers may find the HTML version more accessible. Third-party submission and peer-review systems may also have limitations.',
        ],
      },
      {
        title: 'Report an Accessibility Issue',
        paragraphs: [
          `Please email ${editorialEmail} with the relevant page or publication, the difficulty encountered, and any assistance you need. We will review your report and explain the steps we can take to help.`,
        ],
      },
    ],
  },
]

export const getPolicy = (slug: string) => policies.find((p) => p.slug === slug)
export const policySlugs = policies.map((p) => p.slug)
