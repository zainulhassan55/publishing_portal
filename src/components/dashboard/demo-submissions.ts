import type { ReviewInvitation, Submission } from '@/types/publishing'

/**
 * Demo submissions and review invitations.
 *
 * These records are fictional, and they exist for one reason: the author
 * workspace has to be built and reviewed against a populated workflow, but
 * there is no endpoint that can return a real one. OJS owns submissions,
 * review rounds and decisions, and the per-user workflow read is Phase 4 in
 * docs/OJS-INTEGRATION.md — so today the only real rows the dashboard can show
 * are wizard drafts from /api/drafts.
 *
 * They are NEVER served in production. The dashboard page only passes them to
 * the client when NEXT_PUBLIC_DEMO_CONTENT=1 (`demoContentEnabled` in
 * src/data/content/index.ts), and the UI labels them as demo data when it does.
 * The policy is the same as src/data/content/demo-articles.ts: showing invented
 * manuscripts as if they were a researcher's own work would be a worse
 * credibility failure than an empty list, which is why the default state here is
 * an honest empty one.
 *
 * `stage` is the 0-based index into the track that StatusTimeline draws, so a
 * fixture's stage and status must agree: 1 Submitted, 2 Under review,
 * 3 Decision, 4 Accepted (or Rejected on the rejection track), 5 In production,
 * 6 Published.
 */
export const demoSubmissions: Submission[] = [
  {
    id: 'NGIQ-IJDH-2026-0142',
    journalSlug: 'ijdh',
    type: 'Research Article',
    title:
      'Remote photoplethysmography for continuous heart-rate monitoring in home-based cardiac rehabilitation',
    status: 'Revisions requested',
    submittedIso: '2026-08-03',
    updatedIso: '2026-09-28',
    coauthors: ['Daniel Reyes-Morales', 'Lena Hoffmann', 'Kenji Watanabe'],
    nextAction: 'Revision due 27 November 2026',
    stage: 3,
    decisionLetter: {
      dateIso: '2026-09-28',
      summary: 'major revision',
      body: [
        'Both reviewers found the study well designed but requested additional analysis by skin type and lighting condition, and clarification of how motion artefacts were excluded. Please submit your revision with a point-by-point response.',
        'Sincerely, Editorial Office, International Journal of Digital Health',
      ],
      reviews: [
        {
          reviewer: 'Reviewer 1',
          recommendation: 'Major revision',
          comments: [
            'The validation design is appropriate. Please report agreement stratified by Fitzpatrick skin type and add a sensitivity analysis excluding sessions with more than 20% motion-flagged frames.',
          ],
        },
        {
          reviewer: 'Reviewer 2',
          recommendation: 'Minor revision',
          comments: [
            'Clarify the illumination thresholds and provide the per-participant Bland–Altman data as supplementary material. The discussion should temper claims about clinical readiness.',
          ],
        },
      ],
    },
  },
  {
    id: 'NGIQ-IJIC-2026-0207',
    journalSlug: 'ijic',
    type: 'Research Article',
    title: 'Federated fine-tuning of clinical language models under label scarcity',
    status: 'Under review',
    submittedIso: '2026-09-02',
    updatedIso: '2026-09-19',
    coauthors: ['Priya Raman', 'Tomasz Nowak'],
    stage: 2,
  },
  {
    id: 'NGIQ-IJDS-2026-0098',
    journalSlug: 'ijds',
    type: 'Short Communication',
    title: 'Older adults’ trust in app-only banking: a two-country survey',
    status: 'In production',
    submittedIso: '2026-06-21',
    updatedIso: '2026-09-30',
    coauthors: ['Fiona MacLeod'],
    nextAction: 'Proof expected by 10 October 2026',
    stage: 5,
  },
  {
    id: 'NGIQ-IJSE-2026-0019',
    journalSlug: 'ijse',
    type: 'Review',
    title: 'Energy-aware scheduling for edge inference: a systematic review',
    status: 'Published',
    submittedIso: '2026-01-14',
    updatedIso: '2026-07-02',
    coauthors: ['Mateo Ferraro'],
    stage: 6,
  },
  {
    id: 'NGIQ-IJMR-2026-0051',
    journalSlug: 'ijmr',
    type: 'Research Article',
    title: 'Seasonal variation in wearable step counts across 14 countries',
    status: 'Rejected',
    submittedIso: '2026-05-08',
    updatedIso: '2026-06-24',
    coauthors: ['Karin Vos'],
    stage: 4,
    decisionLetter: {
      dateIso: '2026-06-24',
      summary: 'decline after review',
      body: [
        'The reviewers agreed that the dataset is valuable but that the analysis does not separate seasonal effects from device-upgrade effects, which limits the contribution.',
      ],
      reviews: [
        {
          reviewer: 'Reviewer 1',
          recommendation: 'Reject',
          comments: ['Device cohorts change mid-series and are not controlled for.'],
        },
      ],
    },
  },
]

export const demoInvitations: ReviewInvitation[] = [
  {
    id: 'NGIQ-IJIC-2026-0233',
    journalSlug: 'ijic',
    title: 'Contrastive pre-training for low-resource clinical named-entity recognition',
    type: 'Research Article',
    invitedBy: 'Associate Editor',
    invitedIso: '2026-10-04',
    respondByIso: '2026-10-11',
    dueIso: '2026-11-01',
    status: 'pending',
    abstract:
      'A contrastive pre-training scheme for clinical named-entity recognition in languages with few annotated corpora.',
  },
  {
    id: 'NGIQ-IJDH-2026-0176',
    journalSlug: 'ijdh',
    title: 'Usability of a voice-based symptom checker among adults over 70',
    type: 'Research Article',
    invitedBy: 'Editorial Office',
    invitedIso: '2026-09-15',
    respondByIso: '2026-09-22',
    dueIso: '2026-10-13',
    status: 'accepted',
  },
]
