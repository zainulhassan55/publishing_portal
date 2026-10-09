'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { SessionUser } from '@/lib/auth/session'

type SessionState = {
  user: SessionUser | null
  /** True until the first /api/session response lands. */
  loading: boolean
  refresh: () => void
}

const SessionContext = createContext<SessionState>({ user: null, loading: true, refresh: () => {} })

/**
 * Session is fetched client-side rather than passed down from a server
 * component on purpose: every public page is statically generated, so it has no
 * per-request identity to hand over. Keeping the signed-in state to one small
 * client fetch is what lets the article and journal pages stay static — which
 * is the whole point of the rebuild (audit F-01).
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const response = await fetch('/api/session', { cache: 'no-store' })
        const data = (await response.json()) as { user: SessionUser | null }
        if (!cancelled) setUser(data.user ?? null)
      } catch {
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [tick])

  return (
    <SessionContext.Provider value={{ user, loading, refresh: () => setTick((t) => t + 1) }}>
      {children}
    </SessionContext.Provider>
  )
}

export const useSession = () => useContext(SessionContext)
