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

/**
 * Thematic calls with named guest editors. Fictional — demo only, same reason
 * as the demo articles. Replace with real calls as guest editors are appointed
 * in writing; then move the entry out of the demo gate.
 */
export const demoThematicCalls: CallForPapers[] = [
  {
    id: 'c1',
    journalSlug: 'ijdh',
    theme: 'Artificial intelligence in primary care: evaluation, safety and equity',
    deadlineIso: '2026-10-31',
    guestEditor: 'Dr Helen Achterberg, Leiden University Medical Center',
    specialIssue: true,
    description:
      'We invite evaluations of AI tools deployed in primary care, including prospective studies, implementation research and analyses of equity impact.',
  },
  {
    id: 'c2',
    journalSlug: 'ijqt',
    theme: 'Quantum networking testbeds and early deployments',
    deadlineIso: '2026-11-30',
    guestEditor: 'Prof. Daniel Ostrowski, Warsaw University of Technology',
    specialIssue: true,
  },
  {
    id: 'c3',
    journalSlug: 'ijdm',
    theme: 'Generative AI and the reorganisation of knowledge work',
    deadlineIso: '2027-01-15',
    guestEditor: 'Prof. Laura Fenwick, University of Bath',
    specialIssue: true,
  },
  {
    id: 'c4',
    journalSlug: 'ijse',
    theme: 'Energy-harvesting electronics for the Internet of Things',
    deadlineIso: '2027-02-28',
    guestEditor: 'Dr Arjun Mehta, IIT Madras',
    specialIssue: true,
  },
  {
    id: 'c5',
    journalSlug: 'ijds',
    theme: 'Platform governance after the Digital Services Act',
    deadlineIso: '2027-03-31',
    guestEditor: 'Dr Sofia Lindgren, Stockholm University',
    specialIssue: true,
  },
  {
    id: 'c6',
    journalSlug: 'ijei',
    theme: 'Entrepreneurial ecosystems in secondary cities',
    deadlineIso: '2026-09-15',
    guestEditor: 'Prof. Tunde Ajayi, University of Lagos',
    specialIssue: true,
  },
]
