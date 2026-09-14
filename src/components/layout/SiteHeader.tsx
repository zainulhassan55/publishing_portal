import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { brand, navigationItems, secondaryNavigationItems } from '../../data/siteContent'
import ActionLink from '../shared/ActionLink'
import Container from './Container'

function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)')

    const syncMenu = () => {
      if (media.matches) {
        setIsOpen(false)
      }
    }

    syncMenu()
    media.addEventListener('change', syncMenu)
    return () => media.removeEventListener('change', syncMenu)
  }, [])

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `relative py-1 text-[15px] font-semibold transition ${
      isActive
        ? 'nav-link-active'
        : 'text-slate-600 hover:text-ink-950'
    }`

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper-soft/90 backdrop-blur-xl">
      <div className="border-b border-white/10 bg-ink-950">
        <Container className="flex items-center justify-between gap-4 py-2">
          <p className="text-[11px] font-medium tracking-[0.14em] text-slate-300 uppercase">
            DMPedia · Peer-reviewed · APC-free open access
          </p>
          <nav className="hidden items-center gap-4 text-[12px] font-semibold text-slate-300 md:flex">
            <NavLink
              to="/cfp"
              className={({ isActive }) => (isActive ? 'text-white' : 'hover:text-white')}
            >
              Call for Papers
            </NavLink>
            <span className="text-slate-600">|</span>
            <NavLink
              to="/contact"
              className={({ isActive }) => (isActive ? 'text-white' : 'hover:text-white')}
            >
              Contact
            </NavLink>
          </nav>
        </Container>
      </div>

      <Container className="py-3.5">
        <div className="flex items-center justify-between gap-5">
          <NavLink to="/" className="group flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink-950 font-display text-sm font-semibold tracking-wide text-white shadow-[0_8px_20px_rgba(7,19,31,0.18)] transition group-hover:bg-ink-800">
              {brand.shortName.slice(0, 2)}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-[1.2rem] leading-tight font-semibold tracking-tight text-ink-950 sm:text-[1.35rem]">
                {brand.name}
              </span>
              <span className="mt-0.5 hidden text-[11px] tracking-[0.1em] text-slate-500 uppercase sm:block">
                {brand.tagline}
              </span>
            </span>
          </NavLink>

          <nav className="hidden items-center gap-6 lg:flex">
            {navigationItems.map((item) => (
              <NavLink key={item.path} to={item.path} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2.5 lg:flex">
            <ActionLink to="/login" variant="secondary" size="sm">
              Login
            </ActionLink>
            <ActionLink to="/login" variant="primary" size="sm">
              Submit Manuscript
            </ActionLink>
          </div>

          <button
            type="button"
            aria-expanded={isOpen}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            className="btn btn-secondary btn-icon btn-menu"
            onClick={() => setIsOpen((value) => !value)}
          >
            <span className="sr-only">{isOpen ? 'Close' : 'Menu'}</span>
            <span className="flex w-4 flex-col gap-1.5" aria-hidden="true">
              <span
                className={`h-0.5 w-full rounded-full bg-ink-950 transition ${
                  isOpen ? 'translate-y-[7px] rotate-45' : ''
                }`}
              />
              <span
                className={`h-0.5 w-full rounded-full bg-ink-950 transition ${
                  isOpen ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`h-0.5 w-full rounded-full bg-ink-950 transition ${
                  isOpen ? '-translate-y-[7px] -rotate-45' : ''
                }`}
              />
            </span>
          </button>
        </div>

        {isOpen ? (
          <div className="mobile-nav-panel mt-4 surface p-5">
            <nav className="flex flex-col gap-3">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={linkClass}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-4 border-t border-line pt-4">
              <nav className="flex flex-col gap-3 text-sm text-slate-600">
                {secondaryNavigationItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      isActive ? 'font-semibold text-ink-950' : 'hover:text-ink-950'
                    }
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>
            <div className="mt-5 flex flex-col gap-2.5">
              <ActionLink to="/login" variant="secondary">
                Login
              </ActionLink>
              <ActionLink to="/login" variant="primary">
                Submit Manuscript
              </ActionLink>
            </div>
          </div>
        ) : null}
      </Container>
    </header>
  )
}

export default SiteHeader
