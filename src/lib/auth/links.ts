/**
 * Sign-in and registration links that bring the person back to `next`
 * afterwards. Kept apart from ./require so client components can import them
 * without pulling in next/headers.
 */
export const signInHref = (next: string) => `/sign-in?next=${encodeURIComponent(next)}`

export const registerHref = (next: string) => `/register?next=${encodeURIComponent(next)}`

/** Only same-origin absolute paths are followed, so `?next=` cannot be an open redirect. */
export const safeNext = (value: string | null | undefined, fallback = '/dashboard'): string => {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback
  return value
}
