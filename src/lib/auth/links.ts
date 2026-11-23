/**
 * Sign-in and registration links that bring the person back to `next`
 * afterwards. Kept apart from ./require so client components can import them
 * without pulling in next/headers.
 */
export const signInHref = (next: string) => `/sign-in?next=${encodeURIComponent(next)}`

export const registerHref = (next: string) => `/register?next=${encodeURIComponent(next)}`

/**
 * Only same-origin absolute paths are followed, so `?next=` cannot be an open
 * redirect. A backslash is refused anywhere: URL parsers and browsers read
 * `/\evil.com` as `//evil.com`, another host. So are control characters,
 * which parsers strip (a tab inside `/<tab>/evil.com` vanishes, leaving `//evil.com`).
 */
export const safeNext = (value: string | null | undefined, fallback = '/dashboard'): string => {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return fallback
  return value
}
