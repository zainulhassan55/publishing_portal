import type { ReactNode } from 'react'
import Container from './Container'

type PageHeroProps = {
  eyebrow: string
  title: string
  description: string
  aside?: ReactNode
}

function PageHero({ eyebrow, title, description, aside }: PageHeroProps) {
  return (
    <section className="border-b border-white/10 bg-ink-950 text-white">
      <Container className="py-14 sm:py-16 lg:py-20">
        <div className={`grid gap-8 ${aside ? 'lg:grid-cols-[1.15fr_0.85fr] lg:items-end' : ''}`}>
          <div>
            <p className="meta text-accent-300">{eyebrow}</p>
            <h1 className="mt-4 max-w-3xl font-display text-3xl leading-tight font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              {description}
            </p>
          </div>
          {aside ? <div>{aside}</div> : null}
        </div>
      </Container>
    </section>
  )
}

export default PageHero
