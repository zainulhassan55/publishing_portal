import { useEffect, useState } from 'react'
import { brand } from '../../data/siteContent'
import Container from '../layout/Container'
import ActionLink from '../shared/ActionLink'
import heroLibrary from '../../assets/home/hero-library.jpg'
import heroJournals from '../../assets/home/hero-journals.jpg'
import heroCampus from '../../assets/home/hero-campus.jpg'

const heroSlides = [
  {
    src: heroLibrary,
    alt: 'Sunlit university library with scholarly journals and books',
  },
  {
    src: heroJournals,
    alt: 'Research desk with peer-reviewed journals and manuscripts',
  },
  {
    src: heroCampus,
    alt: 'Light modern university atrium for open scholarship',
  },
]

function HomeHero() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % heroSlides.length)
    }, 7000)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <section className="home-hero relative overflow-hidden border-b border-line">
      <div className="absolute inset-0">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.src}
            className={`absolute inset-0 transition-opacity duration-[1600ms] ease-out ${
              index === active ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={slide.src}
              alt=""
              aria-hidden="true"
              className={`home-hero-image absolute inset-0 h-full w-full object-cover ${
                index === active ? 'animate-drift' : ''
              }`}
            />
          </div>
        ))}
        <div className="home-hero-veil" aria-hidden="true" />
        <div className="home-hero-grain" aria-hidden="true" />
      </div>

      <Container className="relative flex min-h-[78vh] items-end py-16 sm:items-center sm:py-24 lg:min-h-[86vh] lg:py-28">
        <div className="home-hero-copy max-w-2xl">
          <p className="animate-fade-up text-[11px] font-semibold tracking-[0.22em] text-ink-800/55 uppercase">
            {brand.tagline}
          </p>

          <h1 className="animate-fade-up-delay-1 mt-5 font-display text-[2.85rem] leading-[0.92] font-semibold tracking-tight text-ink-950 sm:text-6xl lg:text-[4.35rem]">
            {brand.name}
          </h1>

          <div className="animate-fade-up-delay-2 mt-7 flex items-center gap-4">
            <span className="home-hero-rule" aria-hidden="true" />
            <p className="max-w-md text-[1.05rem] leading-relaxed text-ink-900/80 sm:text-lg sm:leading-8">
              Peer-reviewed journals, books, and proceedings for global scholarship.
            </p>
          </div>

          <div className="animate-fade-up-delay-3 mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ActionLink to="/journals" variant="primary" className="home-hero-cta">
              Browse Journals
            </ActionLink>
            <ActionLink to="/guidelines" variant="secondary" className="home-hero-cta">
              Author Guidelines
            </ActionLink>
          </div>

          <div
            className="animate-fade-up-delay-3 mt-12 flex items-center gap-3"
            aria-label="Hero image slides"
          >
            {heroSlides.map((slide, index) => (
              <button
                key={slide.alt}
                type="button"
                aria-label={`Show image ${index + 1}`}
                aria-pressed={index === active}
                onClick={() => setActive(index)}
                className={`home-hero-marker ${index === active ? 'is-active' : ''}`}
              />
            ))}
            <span className="ml-2 text-[11px] font-semibold tracking-[0.16em] text-ink-800/45 uppercase">
              {String(active + 1).padStart(2, '0')} / {String(heroSlides.length).padStart(2, '0')}
            </span>
          </div>
        </div>
      </Container>
    </section>
  )
}

export default HomeHero
