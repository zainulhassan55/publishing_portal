'use client'

import { useEffect } from 'react'

/**
 * Scroll-reveal, ported from the mockups' motion.js.
 *
 * One observer for the whole document, re-scanning on DOM change so client-side
 * navigation and conditionally rendered sections pick up without each page
 * wiring its own effect. Elements reveal once and are then unobserved.
 *
 * Under prefers-reduced-motion nothing is observed at all and the CSS leaves
 * `.reveal` fully visible, so content is never hidden behind an animation that
 * will not run.
 */
export function RevealObserver() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.setAttribute('data-revealed', 'true')
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )

    const scan = () => {
      for (const el of document.querySelectorAll('.reveal:not([data-revealed])')) {
        observer.observe(el)
      }
    }

    scan()

    const mutations = new MutationObserver(scan)
    mutations.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      mutations.disconnect()
    }
  }, [])

  return null
}
