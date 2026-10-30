import type { Subject, SubjectKey } from '@/types/publishing'

/**
 * Every subject colour sits at the same lightness (0.52) and chroma (0.11) and
 * differs only in hue, so no single subject reads as louder than the others and
 * all of them clear AA against the surface tokens.
 */
export const subjects: Record<SubjectKey, Subject> = {
  health: { key: 'health', label: 'Digital health', color: 'oklch(0.52 0.11 160)' },
  management: { key: 'management', label: 'Management', color: 'oklch(0.52 0.11 250)' },
  society: { key: 'society', label: 'Society', color: 'oklch(0.52 0.11 25)' },
  entrepreneurship: {
    key: 'entrepreneurship',
    label: 'Entrepreneurship and innovation',
    color: 'oklch(0.52 0.11 65)',
  },
  computing: { key: 'computing', label: 'Computing', color: 'oklch(0.52 0.11 220)' },
  interdisciplinary: { key: 'interdisciplinary', label: 'Interdisciplinary', color: 'oklch(0.52 0.11 310)' },
  mathematics: { key: 'mathematics', label: 'Mathematics', color: 'oklch(0.52 0.11 285)' },
  electronics: { key: 'electronics', label: 'Electronics and quantum', color: 'oklch(0.52 0.11 190)' },
  energy: { key: 'energy', label: 'Sustainable energy', color: 'oklch(0.52 0.11 125)' },
  security: { key: 'security', label: 'Security and trust', color: 'oklch(0.52 0.11 350)' },
}

export const subjectList: Subject[] = Object.values(subjects)

/**
 * Journal → subject. Kept here rather than on each journal file so those
 * files stay purely about editorial content.
 */
export const journalSubjectKey: Record<string, SubjectKey> = {
  ijic: 'computing',
  ijdm: 'management',
  jqcs: 'electronics',
  jaise: 'energy',
  sst: 'security',
}

export const subjectFor = (slug: string): Subject => subjects[journalSubjectKey[slug] ?? 'interdisciplinary']
