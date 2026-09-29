import type { ReactNode } from 'react'

type FeatureCardProps = {
  title: string
  description: string
  meta?: string
  badge?: string
  children?: ReactNode
  href?: string
}

function FeatureCard({
  title,
  description,
  meta,
  badge,
  children,
}: FeatureCardProps) {
  return (
    <article className="card">
      <div className="flex items-start justify-between gap-3">
        {meta ? <p className="meta">{meta}</p> : <span />}
        {badge ? <span className="badge">{badge}</span> : null}
      </div>

      <h3 className="mt-3 font-display text-[1.1rem] leading-snug font-semibold text-ink-950">
        {title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{description}</p>

      {children ? (
        <div className="mt-4 border-t border-line pt-3 text-sm text-slate-600">{children}</div>
      ) : null}
    </article>
  )
}

export default FeatureCard
