import type { NewsItem } from '@/types/publishing'

/**
 * Publisher news. These are statements about the platform itself, so they are
 * verifiable and ship in production. Keep it that way: an announcement about an
 * editorial appointment goes in only once the appointment is accepted in
 * writing, and an indexing claim only once the service confirms coverage.
 */
export const news: NewsItem[] = [
  {
    slug: 'all-journals-open-for-submissions',
    dateIso: '2026-09-02',
    type: 'Announcement',
    title: 'All ten NextGenIQ Press journals are now accepting submissions',
    body: [
      'Every journal in the portfolio is open for submissions across its full scope. Manuscripts are reviewed double-blind by a minimum of two independent reviewers.',
      'There is no submission fee, and no article processing charge applies to manuscripts submitted during the launch period.',
    ],
  },
  {
    slug: 'founding-editorial-board-applications',
    dateIso: '2026-07-29',
    type: 'Editorial',
    title: 'Applications open for founding editorial board members',
    body: [
      'We are appointing founding Editors-in-Chief, Senior Editors and Associate Editors across all ten journals.',
      'Applicants should hold a doctorate and an established publication record in the journal’s scope. Send a CV, your ORCID iD and a short statement of the topics you are qualified to assess to the editorial office.',
    ],
  },
  {
    slug: 'continuous-publication-model',
    dateIso: '2026-07-10',
    type: 'Announcement',
    title: 'Journals publish continuously rather than in fixed issues',
    body: [
      'Each article is published online as soon as it has been accepted, copy-edited and typeset, and is citable from that date. Articles are then collected into the current volume.',
      'Authors do not wait for an issue to close, and there is no deadline to work back from when preparing a submission.',
    ],
  },
]
