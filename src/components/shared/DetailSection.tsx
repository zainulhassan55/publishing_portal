import type { ReactNode } from 'react'

type DetailSectionProps = {
  title: string
  children: ReactNode
}

function DetailSection({ title, children }: DetailSectionProps) {
  return (
    <section className="card-quiet p-7 sm:p-8">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-ink-950">
        {title}
      </h2>
      <div className="mt-4 border-t border-line pt-4 text-base leading-8 text-slate-700">
        {children}
      </div>
    </section>
  )
}

export default DetailSection
