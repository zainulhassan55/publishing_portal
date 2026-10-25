import type { PublisherSection } from '@/types/content'
import { editorialEmail } from './pages'

/**
 * Publisher-wide text supplied by the publisher (October 2026) and reproduced
 * as given: the home page, the reviewer, editor and librarian pages, and the
 * About section. Edit the wording only on the publisher's instruction.
 */

export const hero = {
  kicker: 'Peer-reviewed · Open access · Interdisciplinary research',
  headline: 'Advancing knowledge. Sharing research openly.',
  intro:
    'NextGenIQ Press publishes open-access journals, research books, monographs, and conference proceedings across digital, computational, and interdisciplinary fields. We make scholarly research freely available to readers worldwide, supported by expert editorial oversight and rigorous peer review.',
  ctas: [
    { label: 'Submit a manuscript', href: '/submit' },
    { label: 'Browse journals', href: '/journals' },
  ],
}

export type Audience = { id: string; who: string; text: string; links: { label: string; href: string }[] }

export const audiences: Audience[] = [
  {
    id: 'reviewers',
    who: 'For reviewers',
    text: 'Contribute your expertise to rigorous and constructive peer review. Explore our reviewer guidelines, ethical responsibilities, and opportunities to review submissions in your field.',
    links: [
      { label: 'Reviewer guidelines', href: '/reviewers' },
      { label: 'Become a reviewer', href: '/reviewers#apply' },
    ],
  },
  {
    id: 'editors',
    who: 'For editors',
    text: 'Help shape the direction of scholarly publishing in your field. Express your interest in joining an editorial board, propose a journal special issue, or submit a proposal for an edited book or conference proceedings.',
    links: [
      { label: 'Join an editorial board', href: '/editors#board-application' },
      { label: 'Special Issue Guidelines', href: '/editors/special-issues' },
      { label: 'Propose a special issue', href: '/editors/special-issues#proposal-form' },
      { label: 'Submit a New Journal proposal', href: '/propose-journal' },
    ],
  },
  {
    id: 'librarians',
    who: 'For librarians',
    text: 'Explore our publications and find the information needed to support discovery, access, and collection development. Consult individual title pages for indexing status, identifiers, access options, licensing terms, and available preservation information.',
    links: [
      { label: 'Browse publications', href: '/librarians#browse-publications' },
      { label: 'Indexing and discovery', href: '/librarians#indexing-and-discovery' },
      { label: 'Access and licensing', href: '/librarians#access-and-licensing' },
    ],
  },
]

export const about = {
  title: 'About NextGenIQ Press',
  paragraphs: [
    'NextGenIQ Press is an independent academic publisher dedicated to sharing research and advancing scholarly exchange. Our publishing programme includes open-access journals, research books, edited volumes, monographs, book series, and conference proceedings across established and emerging disciplines.',
    'We welcome contributions from researchers, educators, and practitioners worldwide, including interdisciplinary work connecting science, technology, healthcare, business, and society. Our aim is to make research accessible, clearly presented, and useful to both specialist and broader audiences.',
  ],
  sections: [
    {
      title: 'Editorial Quality and Integrity',
      // The publisher's draft reads "addWrittenress"; "address" is the evident intent.
      text: 'Editorial assessment and publication decisions are led by subject experts. Our policies are informed by the COPE Core Practices and address peer review, research integrity, conflicts of interest, authorship, and the correction of the scholarly record.',
      link: { label: 'Policies', href: '/policies' },
    },
    {
      title: 'Access and Discoverability',
      text: 'Individual publication pages provide information about access options, licensing, identifiers, and confirmed indexing coverage. We encourage authors to use ORCID iDs to support accurate attribution and identification of their work.',
      link: { label: 'For librarians', href: '/librarians' },
    },
    {
      title: 'Publish with Us',
      text: 'We welcome manuscript submissions, book and special issue proposals, and enquiries about conference proceedings. Researchers may also express their interest in contributing as reviewers or editors.',
      link: { label: 'For authors', href: '/authors' },
    },
  ],
  contact: editorialEmail,
}

export const reviewerGuidelines: PublisherSection[] = [
  {
    id: 'accepting-an-invitation',
    title: 'Accepting an Invitation',
    paragraphs: [
      'Accept a review invitation only if the submission falls within your expertise and you can meet the deadline. Disclose any potential conflict of interest and notify the editor promptly if you need additional time.',
    ],
  },
  {
    id: 'assessing-the-submission',
    title: 'Assessing the Submission',
    paragraphs: [
      'Evaluate its relevance, originality, methodological soundness, presentation of results, and support for its conclusions. Consider the quality of references, acknowledgement of limitations, and significance of the contribution. Provide specific, actionable suggestions for improvement.',
    ],
  },
  {
    id: 'confidentiality-and-research-integrity',
    title: 'Confidentiality and Research Integrity',
    paragraphs: [
      'Keep submissions and review correspondence confidential. Do not share unpublished material or use it for personal advantage. Report suspected plagiarism, duplicate publication, data manipulation, or other ethical concerns privately to the editor. Recommend additional citations only when they are relevant and justified.',
    ],
  },
  {
    id: 'use-of-ai-tools',
    title: 'Use of AI Tools',
    paragraphs: [
      'Do not upload confidential submissions or review materials to public or third-party generative AI tools. Follow the publisher’s Generative AI Policy and remain personally responsible for the accuracy and originality of your assessment.',
    ],
    links: [{ label: 'Generative AI Policy', href: '/policies/generative-ai-policy' }],
  },
  {
    id: 'review-recommendation',
    title: 'Review Recommendation',
    paragraphs: [
      'Select the recommendation requested by the submission system, such as Accept, Minor Revision, Major Revision, or Reject, and explain your reasoning. Keep feedback professional and distinguish essential revisions from optional suggestions.',
    ],
  },
]

export const reviewersLead =
  'Peer reviewers help maintain the quality and integrity of NextGenIQ Press publications. Reviews should be impartial, constructive, evidence-based, and submitted within the agreed timeframe.'

export const becomeReviewer = `To express your interest, register through the relevant submission system or email ${editorialEmail} with your affiliation, areas of expertise, and a brief academic profile.`

export const specialIssueLead =
  'NextGenIQ Press welcomes special issue proposals on emerging, significant, and interdisciplinary topics relevant to the scope of its journals.'

export const specialIssueGuidelines: PublisherSection[] = [
  {
    id: 'submitting-a-proposal',
    title: 'Submitting a Proposal',
    paragraphs: [`To express your interest, register through the relevant submission system or email ${editorialEmail} with:`],
    bullets: [
      'Target journal, proposed title, aims, scope, and topics of interest.',
      'Guest editors’ names, affiliations, areas of expertise, and brief biographies.',
      'Proposed timeline, anticipated number of submissions, and promotion plan.',
    ],
  },
  {
    id: 'editorial-standards',
    title: 'Editorial Standards',
    paragraphs: [
      'Proposals are subject to editorial approval. All submissions must meet the journal’s publication ethics requirements and undergo its standard peer-review process. Inclusion in a special issue does not guarantee acceptance. The Editor-in-Chief retains final editorial oversight.',
    ],
  },
  {
    id: 'guest-editor-responsibilities',
    title: 'Guest Editor Responsibilities',
    paragraphs: [
      'Guest editors help develop the issue, invite relevant submissions, and coordinate timely, impartial reviews. They must disclose conflicts of interest and must not handle or make decisions on their own submissions or those involving a conflict. Such manuscripts will be assigned to an independent editor.',
    ],
  },
]

export const librarianSections: PublisherSection[] = [
  {
    id: 'browse-publications',
    title: 'Browse publications',
    paragraphs: [
      'Explore journals, research books, edited volumes, monographs, and conference proceedings from NextGenIQ Press. Visit individual publication pages for subject coverage, editorial information, available content, and access details.',
    ],
  },
  {
    id: 'indexing-and-discovery',
    title: 'Indexing and discovery',
    paragraphs: [
      'Find title-specific information about indexing and abstracting services, ISSNs or ISBNs, and DOIs where assigned. Indexing coverage varies by publication; an application for inclusion does not constitute confirmed indexing.',
    ],
  },
  {
    id: 'access-and-licensing',
    title: 'Access and licensing',
    paragraphs: [
      `Check individual publication pages for open-access or purchase options, copyright ownership, and applicable licences. Reuse, sharing, and repository deposit are governed by the licence and terms attached to each work. For institutional enquiries, contact ${editorialEmail}.`,
    ],
  },
]
