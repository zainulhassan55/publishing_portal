import type { ContentBlock } from '@/types/content'
import { editorialEmail, licenceShort, licenceUrl, siteName } from '@/lib/site'

/**
 * Publisher-level policies and legal pages.
 *
 * Audit finding F-14 was that policy text had two sources of truth — the portal
 * and OJS — kept in step by a sync script that was missing from the repo. The
 * rule now: **this file is the only source.** Journal-level policy pages are
 * generated from `journalTemplate.ts` and are deliberately journal-scoped
 * ("IJDH operates double-blind review"); they restate scope, not substance. If
 * a rule changes, it changes here and in the template, and the OJS copy is
 * replaced with a link to this page rather than a duplicate of it.
 */

export type PolicyPage = {
  slug: string
  title: string
  summary: string
  /** Last substantive revision. ISO 8601. */
  updatedIso: string
  blocks: ContentBlock[]
}

export const policies: PolicyPage[] = [
  {
    slug: 'publication-ethics',
    title: 'Publication ethics',
    summary: 'Integrity standards for authors, reviewers and editors across every NextGenIQ Press journal.',
    updatedIso: '2026-09-01',
    blocks: [
      {
        title: 'Principles',
        paragraphs: [
          `${siteName} follows the Core Practices of the Committee on Publication Ethics (COPE) and handles suspected misconduct using the COPE flowcharts.`,
          'These standards apply identically across every journal, book series and proceedings volume we publish.',
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
        title: 'Similarity screening',
        paragraphs: [
          'Every submission is checked with similarity-detection software before it reaches a reviewer. Overlap with published work, including the authors’ own, must be cited and justified.',
          'A similarity percentage alone does not establish misconduct. Potentially problematic overlap is assessed in context by an editor.',
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
          `Concerns about a published article should be sent to ${editorialEmail}. They are handled confidentially, and by an editor who was not involved in the original decision.`,
          'Where a concern is substantiated we publish a correction, an expression of concern or a retraction as appropriate. The article itself remains available and is clearly marked.',
        ],
      },
      {
        title: 'Complaints and appeals',
        paragraphs: [
          'Authors may appeal an editorial decision within 30 days by writing to the editorial office with a point-by-point rationale. Appeals are assessed by an editor not involved in the original decision.',
        ],
      },
    ],
  },
  {
    slug: 'open-access',
    title: 'Open access',
    summary: 'Every article is free to read and reuse from the moment it is published.',
    updatedIso: '2026-09-01',
    blocks: [
      {
        title: 'The model',
        paragraphs: [
          'All articles are freely available to read, download and reuse immediately upon publication. There is no subscription, no pay-per-view and no embargo period.',
          'There is no charge to submit. No article processing charge applies to manuscripts submitted during the launch period.',
        ],
      },
      {
        title: 'Future charges',
        paragraphs: [
          'Any future article processing charge will be announced at least six months before it takes effect and will not apply to manuscripts already submitted.',
          'When a charge is introduced, full waivers will apply to corresponding authors in countries the World Bank classifies as low-income, and partial waivers in lower-middle-income countries. Editors are not told whether a waiver has been requested.',
        ],
      },
      {
        title: 'Preprints',
        paragraphs: [
          'Authors may post preprints on a recognised server at any time, before or during review. Provide the preprint DOI at submission; reviewers are not asked to search for it.',
        ],
      },
      {
        title: 'Repositories',
        paragraphs: [
          `Because articles are published under ${licenceShort}, authors may deposit the published version in an institutional or subject repository immediately, with no embargo.`,
        ],
      },
    ],
  },
  {
    slug: 'copyright-licensing',
    title: 'Copyright and licensing',
    summary: 'Authors retain copyright. Articles are published under a Creative Commons Attribution licence.',
    updatedIso: '2026-09-01',
    blocks: [
      {
        title: 'Licence',
        paragraphs: [
          `Articles are published under the Creative Commons Attribution 4.0 International licence (${licenceShort}), available at ${licenceUrl}.`,
          'Anyone may share and adapt the work for any purpose, including commercially, provided the original is properly cited.',
        ],
      },
      {
        title: 'Copyright',
        paragraphs: [
          `Authors retain copyright in their work. They grant ${siteName} a non-exclusive licence to publish the article and to be identified as its original publisher.`,
        ],
      },
      {
        title: 'Third-party material',
        paragraphs: [
          'Authors are responsible for obtaining permission to reproduce copyrighted material from other sources, and for identifying such material clearly in the article.',
        ],
      },
    ],
  },
  {
    slug: 'generative-ai-policy',
    title: 'Generative AI policy',
    summary: 'How authors, reviewers and editors may and may not use generative AI tools.',
    updatedIso: '2026-09-01',
    blocks: [
      {
        title: 'AI cannot be an author',
        paragraphs: [
          'Generative AI systems cannot be listed as authors or co-authors. Authorship requires accountability for the work, which only a person can hold.',
        ],
      },
      {
        title: 'Authors',
        paragraphs: [
          'Authors may use AI-assisted tools for language, readability and organisation. Where such a tool has made a substantive contribution to writing, analysis, content generation or methodology, it must be disclosed in the declarations with the tool, version and purpose.',
          'Authors remain fully responsible for accuracy, originality, citations, arguments, conclusions and ethical compliance.',
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
          'Reviewers and editors must not upload manuscripts, reports or confidential correspondence to generative AI tools. Doing so breaches the confidentiality of material entrusted to them.',
          'Final editorial decisions remain a human responsibility.',
        ],
      },
      {
        title: 'Routine tools',
        paragraphs: [
          'Spelling and grammar checkers are not treated as substantive generative-AI use and need no disclosure.',
        ],
      },
    ],
  },
  {
    slug: 'research-data-policy',
    title: 'Research data policy',
    summary: 'What we expect authors to share, and what must appear in a data availability statement.',
    updatedIso: '2026-09-01',
    blocks: [
      {
        title: 'Data availability statement',
        paragraphs: [
          'Every research article includes a data availability statement. It must say where the data supporting the findings can be accessed, or why they cannot be shared — for example privacy, ethical, legal or commercial reasons. A statement is required even when no data can be shared.',
        ],
      },
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
      {
        title: 'Requests from editors',
        paragraphs: [
          'Editors may request supporting data where it is necessary to evaluate a manuscript or to examine a question of research integrity.',
        ],
      },
    ],
  },
  {
    slug: 'corrections-retractions',
    title: 'Corrections and retractions',
    summary: 'How the published record is corrected after publication.',
    updatedIso: '2026-09-01',
    blocks: [
      {
        title: 'Corrections',
        paragraphs: [
          'A correction is published when an error affects part of an article but does not invalidate its overall findings. The article is updated, marked as corrected, and linked to the correction notice.',
          'Authors who discover an error in their published article should notify the editorial office promptly.',
        ],
      },
      {
        title: 'Expressions of concern',
        paragraphs: [
          'An expression of concern is published when there are serious unresolved questions about an article that remain under investigation.',
        ],
      },
      {
        title: 'Retractions',
        paragraphs: [
          'An article is retracted when its findings are unreliable through major error or misconduct, or where plagiarism, duplicate publication or a serious ethical breach is established.',
          'Retracted articles remain online and citable, clearly marked as retracted, with a linked notice explaining the reason. We do not remove articles from the record.',
        ],
      },
    ],
  },
  {
    slug: 'privacy',
    title: 'Privacy',
    summary: 'What personal data this site collects, why, and how long it is kept.',
    updatedIso: '2026-09-01',
    blocks: [
      {
        title: 'What we collect',
        paragraphs: ['This site collects personal data in three places, and nowhere else:'],
        bullets: [
          'Account and submission data — name, email, affiliation, ORCID and manuscript files — held in the editorial system in order to operate peer review.',
          'Email alert subscriptions — your address and which alerts you chose, held until you unsubscribe.',
          'Messages you send through the contact form or a journal proposal — held so that we can reply and keep a record of the correspondence.',
        ],
      },
      {
        title: 'What we do not do',
        paragraphs: [
          'There is no advertising, no third-party analytics and no tracking across sites. We do not sell or share personal data with advertisers or data brokers.',
        ],
      },
      {
        title: 'Legal basis and retention',
        paragraphs: [
          'Submission and review data are processed to perform the publishing agreement with authors and are retained as part of the permanent record of the editorial process. Alert subscriptions are processed on consent and deleted when you unsubscribe. Contact messages are retained for two years.',
        ],
      },
      {
        title: 'Your rights',
        paragraphs: [
          `Write to ${editorialEmail} to request access to, correction of, or deletion of your personal data. One limit applies: the metadata of a published article — authors, affiliations, the article itself — is part of the scholarly record and cannot be withdrawn. That is the point of publishing it.`,
        ],
      },
      {
        title: 'Processors',
        paragraphs: [
          'Data is held on servers we operate. We use a transactional email provider to deliver notifications and confirmations, which processes recipient addresses on our behalf.',
        ],
      },
    ],
  },
  {
    slug: 'cookies',
    title: 'Cookies',
    summary: 'This site sets no tracking cookies. The two it does set are necessary ones.',
    updatedIso: '2026-09-01',
    blocks: [
      {
        title: 'What is set',
        paragraphs: ['There is no analytics, advertising or tracking cookie on this site. Two things are stored:'],
        bullets: [
          'A session cookie, set only after you sign in, which keeps you signed in. It is removed when you sign out.',
          'Your appearance preference — colour palette and light or dim mode — stored in your browser’s local storage, not sent to the server.',
        ],
      },
      {
        title: 'Consent',
        paragraphs: [
          'Both are strictly necessary or set at your own request, so there is no consent banner. If we ever add anything that requires consent, we will ask for it before setting it.',
        ],
      },
    ],
  },
  {
    slug: 'terms',
    title: 'Terms of use',
    summary: 'The terms on which this site and its content may be used.',
    updatedIso: '2026-09-01',
    blocks: [
      {
        title: 'Using the content',
        paragraphs: [
          `Articles are published under ${licenceShort}: you may read, download, redistribute and adapt them, including commercially, provided you credit the original authors and source.`,
          'Site design, navigation and non-article text are not covered by that licence and remain the property of the publisher.',
        ],
      },
      {
        title: 'Acceptable use',
        paragraphs: [
          'Automated access is welcome for legitimate research and indexing. Please use the sitemap and the OAI-PMH endpoint rather than crawling aggressively, and identify your crawler. We may rate-limit traffic that degrades the service for readers.',
        ],
      },
      {
        title: 'Accuracy and availability',
        paragraphs: [
          'The published version of record is the article as it appears here, identified by its DOI. We correct the record when we are told of an error — see corrections and retractions. The service is provided without a guarantee of uninterrupted availability.',
        ],
      },
      {
        title: 'Contact',
        paragraphs: [`Questions about these terms: ${editorialEmail}.`],
      },
    ],
  },
  {
    slug: 'accessibility',
    title: 'Accessibility',
    summary: 'What we target, what is already done, and what is not fixed yet.',
    updatedIso: '2026-09-01',
    blocks: [
      {
        title: 'Target',
        paragraphs: [
          'We aim to meet WCAG 2.2 Level AA. This statement describes the current state honestly rather than claiming conformance we have not verified with an independent audit.',
        ],
      },
      {
        title: 'In place',
        bullets: [
          'All text and interface colours are checked against AA contrast ratios in both light and dim appearance.',
          'The whole site is operable by keyboard, with a visible focus indicator and a skip link to the main content.',
          'Interactive controls carry accessible names and state; tabs, menus and disclosures follow the ARIA patterns including arrow-key navigation.',
          'Every animation respects prefers-reduced-motion, and the only auto-advancing component has a pause control.',
          'Article pages are served as rendered HTML, so assistive technology does not depend on JavaScript to read the content.',
          'Figures carry alternative text; decorative images are hidden from assistive technology.',
        ],
      },
      {
        title: 'Known gaps',
        bullets: [
          'No independent accessibility audit has been carried out yet.',
          'Author-supplied PDFs are not guaranteed to be tagged for accessibility. The HTML version of an article is the accessible version.',
          'The editorial system used for submission and peer review is third-party software whose accessibility we do not control.',
        ],
      },
      {
        title: 'Reporting a barrier',
        paragraphs: [
          `If something on this site is not usable for you, write to ${editorialEmail} describing what you were trying to do. We treat accessibility reports as defects, not feature requests, and will tell you what we are doing about it.`,
        ],
      },
    ],
  },
]

export const getPolicy = (slug: string) => policies.find((p) => p.slug === slug)
export const policySlugs = policies.map((p) => p.slug)
