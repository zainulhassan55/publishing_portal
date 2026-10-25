import type { CallForPapers } from '@/types/publishing'
import { journalSlugs } from '../registry'

/**
 * Standing calls. Every journal is open for submissions on any topic inside its
 * scope, which is true today and needs no guest editor, so these ship in
 * production.
 */
export const standingCalls: CallForPapers[] = journalSlugs.map((slug) => ({
  id: `standing-${slug}`,
  journalSlug: slug,
  theme: 'Open call: original research and reviews across the full scope of the journal',
  // A standing call has no deadline. A far-future date keeps the sort stable
  // while `isStanding` suppresses any countdown in the UI.
  deadlineIso: '2099-12-31',
  description:
    'Manuscripts are considered year-round. Articles are published continuously, so there is no issue deadline to work back from.',
}))

export const isStanding = (cfp: CallForPapers) => cfp.id.startsWith('standing-')
