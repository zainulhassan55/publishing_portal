'use client'

import { useEffect, useState } from 'react'

export type SectionTocEntry = { id: string; label: string; indent?: number }

/**
 * The site's one "On this page" navigation (policies, journal and series
 * pages, publisher pages, the author hub): the active section is the last
 * `[data-sec]` element whose top has passed 140px, and the active entry gets
 * the accent rule, ink text and 600 weight. Hidden on phones by default, where
 * a sidebar list ends up below the content it indexes.
 */
export function SectionToc({ entries, label = 'On this page', hideOnMobile = true }: { entries: SectionTocEntry[]; label?: string; hideOnMobile?: boolean }) {
  const [active, setActive] = useState(entries[0]?.id ?? '')

  useEffect(() => {
    const onScroll = () => {
      const els = Array.from(document.querySelectorAll('[data-sec]'))
      let cur = els[0] && els[0].id
      for (const el of els) if (el.getBoundingClientRect().top < 140) cur = el.id
      if (cur) setActive((prevActive) => (cur !== prevActive ? cur : prevActive))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav aria-label={label} className={hideOnMobile ? 'm-hide' : undefined}>
      <style>{`.stoc a:hover{color:var(--accent,#1D5DA8)}`}</style>
      <span style={{ display: 'block', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted,#505C68)', fontWeight: 600, marginBottom: 8 }}>{label}</span>
      <div className="stoc">
        {entries.map((t) => {
          const on = t.id === active
          return (
            <a
              key={t.id}
              href={`#${t.id}`}
              aria-current={on ? 'true' : undefined}
              style={{
                display: 'block',
                fontSize: 13,
                lineHeight: 1.4,
                padding: `5px 0 5px ${t.indent ?? 12}px`,
                borderLeft: `2px solid ${on ? 'var(--accent,#1D5DA8)' : 'var(--line,#DCE1E6)'}`,
                color: on ? 'var(--ink,#101B27)' : 'var(--ink-3,#3C4854)',
                fontWeight: on ? 600 : 400,
                textDecoration: 'none',
              }}
            >
              {t.label}
            </a>
          )
        })}
      </div>
    </nav>
  )
}
