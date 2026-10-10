type ClassValue = string | number | null | undefined | false | ClassValue[]

/**
 * Joins class names. Deliberately not tailwind-merge: nothing here relies on a
 * later utility overriding an earlier one, so conflict resolution would be cost
 * without benefit.
 */
export function cn(...values: ClassValue[]): string {
  const out: string[] = []
  for (const value of values) {
    if (!value) continue
    if (Array.isArray(value)) {
      const nested = cn(...value)
      if (nested) out.push(nested)
    } else {
      out.push(String(value))
    }
  }
  return out.join(' ')
}
