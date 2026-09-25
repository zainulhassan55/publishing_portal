import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { journalCoverBySlug } from '../../data/journalCovers'
import { featuredJournals, heroMetrics } from '../../data/siteContent'
import Container from '../layout/Container'
import ActionLink from '../shared/ActionLink'
import SectionHeading from '../shared/SectionHeading'

const toneBySlug: Record<string, string> = {
  ijdh: 'portfolio-tone-mint',
  ijdm: 'portfolio-tone-sky',
  ijds: 'portfolio-tone-sage',
  ijei: 'portfolio-tone-sand',
  ijic: 'portfolio-tone-slate',
  ijis: 'portfolio-tone-seafoam',
  ijmc: 'portfolio-tone-azure',
  ijmr: 'portfolio-tone-olive',
  ijqt: 'portfolio-tone-cyan',
  ijse: 'portfolio-tone-emerald',
}

const GAP_PX = 16

function FeaturedJournalsSection() {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(true)

  const updateArrows = () => {
    const node = scrollerRef.current
    if (!node) return

    const maxScroll = node.scrollWidth - node.clientWidth
    setCanPrev(node.scrollLeft > 8)
    setCanNext(node.scrollLeft < maxScroll - 8)
  }

  useEffect(() => {
    const node = scrollerRef.current
    if (!node) return

    updateArrows()
    node.addEventListener('scroll', updateArrows, { passive: true })
    window.addEventListener('resize', updateArrows)

    return () => {
      node.removeEventListener('scroll', updateArrows)
      window.removeEventListener('resize', updateArrows)
    }
  }, [])

  const scrollByCards = (direction: -1 | 1) => {
    const node = scrollerRef.current
    if (!node) return

    // Move by one full "page" of 3 cards on desktop, 1 card on smaller screens
    const visible = window.matchMedia('(min-width: 1024px)').matches
      ? 3
      : window.matchMedia('(min-width: 640px)').matches
        ? 2
        : 1
    const card = node.querySelector<HTMLElement>('[data-journal-slide]')
    const step = card ? (card.offsetWidth + GAP_PX) * visible : node.clientWidth
    node.scrollBy({ left: direction * step, behavior: 'smooth' })
  }

  return (
    <section className="border-b border-line bg-white py-16 sm:py-20">
      <Container>
        <div className="flex flex-col gap-5 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Journals"
            title="Browse journal covers"
            description="Use the arrows to move through the portfolio. Open the Journals tab for full details."
          />
          <ActionLink to="/journals" variant="primary" size="sm">
            View all journals
          </ActionLink>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {heroMetrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-2xl border border-line bg-[#f7f9fb] px-5 py-4"
            >
              <p className="font-display text-2xl font-semibold text-ink-950">{metric.value}</p>
              <p className="mt-1 text-sm text-slate-500">{metric.label}</p>
            </div>
          ))}
        </div>

        <div className="relative mt-10">
          <button
            type="button"
            aria-label="Previous journals"
            disabled={!canPrev}
            onClick={() => scrollByCards(-1)}
            className="journal-carousel-nav absolute top-1/2 left-0 z-10 -translate-x-1/2 -translate-y-1/2 sm:-translate-x-[40%]"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
              <path
                d="M14.5 5.5 8 12l6.5 6.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <button
            type="button"
            aria-label="Next journals"
            disabled={!canNext}
            onClick={() => scrollByCards(1)}
            className="journal-carousel-nav absolute top-1/2 right-0 z-10 translate-x-1/2 -translate-y-1/2 sm:translate-x-[40%]"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
              <path
                d="M9.5 5.5 16 12l-6.5 6.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div
            ref={scrollerRef}
            className="journal-carousel flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {featuredJournals.map((journal) => {
              const cover = journalCoverBySlug[journal.slug]
              const tone = toneBySlug[journal.slug] ?? 'portfolio-tone-mint'

              return (
                <article
                  key={journal.slug}
                  data-journal-slide
                  className="journal-carousel-slide shrink-0 snap-start"
                >
                  <Link
                    to={`/journals/${journal.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-[0_10px_28px_rgba(7,19,31,0.05)] transition hover:-translate-y-1 hover:border-ink-700/20 hover:shadow-[0_18px_40px_rgba(7,19,31,0.1)]"
                  >
                    <div className={`flex h-[6.75rem] flex-col justify-between px-4 py-3 ${tone}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold tracking-[0.12em] text-ink-800 uppercase">
                          {journal.shortTitle ?? journal.slug.toUpperCase()}
                        </span>
                        <span className="rounded-md border border-ink-950/10 bg-white/70 px-2 py-0.5 text-[10px] font-semibold tracking-[0.08em] text-ink-800 uppercase">
                          {journal.access}
                        </span>
                      </div>
                      <p className="line-clamp-2 min-h-[2.6rem] font-display text-[1.02rem] leading-snug font-semibold text-ink-950">
                        {journal.title}
                      </p>
                    </div>

                    <div className="relative h-[11.5rem] shrink-0 overflow-hidden border-y border-line">
                      {cover ? (
                        <img
                          src={cover}
                          alt=""
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className={`h-full w-full ${tone}`} />
                      )}
                    </div>

                    <div className={`h-2 shrink-0 ${tone}`} aria-hidden="true" />

                    <div className="flex h-[4.25rem] flex-col justify-center px-4 py-3">
                      <p className="truncate text-[11px] font-semibold tracking-[0.1em] text-slate-500 uppercase">
                        {journal.area}
                      </p>
                      <p className="mt-1 text-sm font-medium text-accent-700 transition group-hover:text-ink-950">
                        Open journal →
                      </p>
                    </div>
                  </Link>
                </article>
              )
            })}
          </div>
        </div>
      </Container>
    </section>
  )
}

export default FeaturedJournalsSection
