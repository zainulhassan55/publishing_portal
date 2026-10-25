/**
 * ISSN registry.
 *
 * Audit finding F-03: the portal previously shipped the literal strings
 * "ISSN Sample" / "eISSN Sample" on every live journal page, which reads to
 * a cautious author as evidence of an unserious operation.
 *
 * The honest state today is that registration is in progress, so this map is
 * empty and every surface renders "Applied for" via `issnLabel`. As the ISSN
 * National Centre assigns numbers, add them here — one line per journal — and
 * the journal pages, citation metadata and JSON-LD all pick them up.
 *
 * Only add a number that has actually been assigned. An invented ISSN is worse
 * than no ISSN: it is checkable, and it fails the check.
 */
export const journalIssn: Record<string, { print?: string; electronic?: string }> = {
  // ijic: { electronic: '0000-0000' },
}

export const seriesIssn: Record<string, { print?: string; electronic?: string }> = {}

export const PENDING_ISSN_LABEL = 'Applied for'

export const issnLabel = (issn: string | null | undefined) => issn ?? PENDING_ISSN_LABEL

export const electronicIssn = (slug: string): string | null => journalIssn[slug]?.electronic ?? null
export const printIssn = (slug: string): string | null => journalIssn[slug]?.print ?? null
