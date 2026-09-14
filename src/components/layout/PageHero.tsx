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
    <section className="relative overflow-hidden border-b border-white/10 bg-ink-950 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 55% 70% at 90% 0%, rgba(20,150,140,0.22), transparent 55%), linear-gradient(145deg, #07131f 0%, #102235 60%, #0c3532 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <Container className="relative py-14 sm:py-16 lg:py-20">
        <div className={`grid gap-8 ${aside ? 'lg:grid-cols-[1.15fr_0.85fr] lg:items-end' : ''}`}>
          <div className="animate-fade-up">
            <p className="meta text-accent-300">{eyebrow}</p>
            <h1 className="mt-4 max-w-3xl font-display text-3xl leading-tight font-semibold tracking-tight sm:text-4xl lg:text-[2.85rem]">
              {title}
            </h1>
            <div className="section-rule mt-5 max-w-28" />
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              {description}
            </p>
          </div>
          {aside ? <div className="animate-fade-up-delay-1">{aside}</div> : null}
        </div>
      </Container>
    </section>
  )
}

export default PageHero
