'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

/**
 * The Cloudflare Turnstile widget. Checked server-side by src/lib/captcha.ts.
 *
 * Renders nothing when NEXT_PUBLIC_TURNSTILE_SITE_KEY is unset, and callers
 * then send no token; `captchaRequired` tells them which case they are in.
 * Tokens are single-use, so a caller must `reset()` after every submission
 * the server answered, successful or not, before the person can send again.
 */

export const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || ''
export const captchaRequired = turnstileSiteKey !== ''

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string
  reset: (id: string) => void
  remove: (id: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

let loading: Promise<TurnstileApi> | null = null

/** Loads Cloudflare's script once per page, however many widgets mount. */
function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (loading) return loading
  loading = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile missing')))
    script.onerror = () => {
      loading = null
      script.remove()
      reject(new Error('turnstile failed to load'))
    }
    document.head.appendChild(script)
  })
  return loading
}

export type TurnstileHandle = { reset: () => void }

export const Turnstile = forwardRef<TurnstileHandle, {
  /** Called with a fresh token, and with null when it expires or the check errors. */
  onToken: (token: string | null) => void
  /** Labels the attempt in Cloudflare's analytics, e.g. "sign-in". */
  action: string
}>(function Turnstile({ onToken, action }, ref) {
  const box = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)
  // Kept in a ref so a new callback identity on each parent render does not
  // tear the widget down and re-run the check.
  const onTokenRef = useRef(onToken)
  onTokenRef.current = onToken

  useImperativeHandle(ref, () => ({
    reset: () => {
      onTokenRef.current(null)
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current)
    },
  }))

  useEffect(() => {
    if (!captchaRequired) return
    let cancelled = false
    loadTurnstile()
      .then((api) => {
        if (cancelled || !box.current) return
        widgetId.current = api.render(box.current, {
          sitekey: turnstileSiteKey,
          action,
          theme: 'light',
          size: 'flexible',
          callback: (token: string) => onTokenRef.current(token),
          'expired-callback': () => onTokenRef.current(null),
          'error-callback': () => onTokenRef.current(null),
        })
      })
      .catch(() => onTokenRef.current(null))
    return () => {
      cancelled = true
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current)
      widgetId.current = null
    }
  }, [action])

  if (!captchaRequired) return null
  return <div ref={box} style={{ minHeight: 65 }} />
})
