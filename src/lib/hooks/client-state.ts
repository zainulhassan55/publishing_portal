'use client'

import { useSyncExternalStore } from 'react'

/**
 * Hydration-safe reads of client-only state (the clock, media queries).
 *
 * All built on `useSyncExternalStore`, which renders the server snapshot during
 * hydration and then re-renders with the client value — the one pattern that
 * avoids both a hydration mismatch and the `useState` + mount-`useEffect`
 * double-render that `react-hooks/set-state-in-effect` flags.
 */

const noopSubscribe = () => () => {}

/** False on the server and during hydration, true afterwards. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  )
}

/**
 * Today's date as YYYY-MM-DD, or null on the server.
 *
 * Statically generated pages must not bake the build date into content (a
 * "14 days left" chip computed at build time is wrong by the time it is read),
 * so anything date-derived renders nothing on the server and fills in here.
 */
export function useToday(): string | null {
  return useSyncExternalStore(
    noopSubscribe,
    () => new Date().toISOString().slice(0, 10),
    () => null,
  )
}

const subscribeToMediaQuery = (query: string) => (onChange: () => void) => {
  const list = window.matchMedia(query)
  list.addEventListener('change', onChange)
  return () => list.removeEventListener('change', onChange)
}

/** Tracks a media query live; false on the server. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    subscribeToMediaQuery(query),
    () => window.matchMedia(query).matches,
    () => false,
  )
}

export const usePrefersReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)')
