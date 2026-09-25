import type { ReactNode } from 'react'

type SidebarPanelProps = {
  title: string
  children: ReactNode
}

function SidebarPanel({ title, children }: SidebarPanelProps) {
  return (
    <aside className="card-quiet">
      <p className="meta text-accent-700">{title}</p>
      <div className="mt-3 space-y-2.5 border-t border-line pt-3 text-sm leading-6 text-slate-600">
        {children}
      </div>
    </aside>
  )
}

export default SidebarPanel
