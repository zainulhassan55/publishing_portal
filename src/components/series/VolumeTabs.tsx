'use client'

import { useState, type ReactNode } from 'react'

type Tab = { id: string; label: string; panel: ReactNode }

/**
 * Description / Authors tabs on a volume page. Every panel is server-rendered
 * into the HTML (inactive ones carry `hidden`), so the text stays indexable.
 */
export function VolumeTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.id)
  return (
    <div>
      <div role="tablist" aria-label="Volume information" style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--line,#DCE1E6)', marginBottom: 24 }}>
        {tabs.map((t) => {
          const selected = t.id === active
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`panel-${t.id}`}
              onClick={() => setActive(t.id)}
              style={{
                appearance: 'none',
                background: 'none',
                border: 'none',
                borderBottom: `3px solid ${selected ? 'var(--accent,#0C8375)' : 'transparent'}`,
                marginBottom: -1,
                padding: '12px 18px',
                fontFamily: 'var(--font-sans)',
                fontSize: 15,
                fontWeight: selected ? 600 : 500,
                color: selected ? 'var(--ink,#101B27)' : 'var(--muted,#505C68)',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" id={`panel-${t.id}`} aria-labelledby={`tab-${t.id}`} hidden={t.id !== active}>
          {t.panel}
        </div>
      ))}
    </div>
  )
}
