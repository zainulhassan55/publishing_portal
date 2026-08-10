import type { ReactNode } from 'react'

type SidebarPanelProps = {
  title: string
  children: ReactNode
}

function SidebarPanel({ title, children }: SidebarPanelProps) {
  return (
    <aside className="card-quiet">
      <p className="meta text-accent-700">{title}</p>
      <div className="mt-4 space-y-3 border-t border-line pt-4 text-sm leading-7 text-slate-600">
        {children}
      </div>
    </aside>
  )
}

export default SidebarPanel
