import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { brand, navigationItems, secondaryNavigationItems } from '../../data/siteContent'
import { ojsLoginUrl } from '../../lib/ojs'
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

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const primaryLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'site-nav-link',
      isActive ? 'site-nav-link-active' : '',
    ]
      .filter(Boolean)
      .join(' ')

  return (
    <header className="site-header sticky top-0 z-40 border-b border-line/80 bg-paper-soft/95 backdrop-blur-xl">
      <div className="border-b border-white/10 bg-ink-950">
        <Container className="flex h-9 items-center justify-between gap-4">
          <p className="truncate text-[11px] font-medium tracking-[0.12em] text-slate-300 uppercase">
            DMPedia · Peer-reviewed · APC-free open access
          </p>
          <nav className="hidden items-center gap-5 text-[12px] font-medium text-slate-300 md:flex">
            {secondaryNavigationItems.slice(0, 4).map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  isActive ? 'text-white' : 'transition hover:text-white'
                }
              >
                {item.label}
              </NavLink>
            ))}
            <span className="h-3 w-px bg-slate-600" aria-hidden="true" />
            <NavLink
              to="/contact"
              className={({ isActive }) =>
                isActive ? 'text-white' : 'transition hover:text-white'
              }
            >
              Contact
            </NavLink>
          </nav>
        </Container>
      </div>

      <Container>
        <div className="flex h-[4.25rem] items-center gap-4 lg:gap-6">
          <NavLink to="/" className="group flex min-w-0 shrink-0 items-center gap-3" end>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink-950 font-display text-sm font-semibold tracking-wide text-white shadow-[0_8px_20px_rgba(7,19,31,0.18)] transition group-hover:bg-ink-800">
              {brand.shortName.slice(0, 2)}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-[1.15rem] leading-tight font-semibold tracking-tight text-ink-950 sm:text-[1.3rem]">
                {brand.name}
              </span>
              <span className="mt-0.5 hidden text-[10px] tracking-[0.12em] text-slate-500 uppercase xl:block">
                {brand.tagline}
              </span>
            </span>
          </NavLink>

          <nav
            aria-label="Primary"
            className="ml-auto hidden h-full items-stretch lg:flex"
          >
            {navigationItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={primaryLinkClass}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            <ActionLink href={ojsLoginUrl} variant="secondary" size="sm">
              Login
            </ActionLink>
            <ActionLink to="/journals" variant="primary" size="sm">
              Submit
            </ActionLink>
          </div>

          <button
            type="button"
            aria-expanded={isOpen}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            className="btn btn-secondary btn-icon btn-menu ml-auto lg:hidden"
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
      </Container>

      {isOpen ? (
        <div className="border-t border-line bg-white lg:hidden">
          <Container className="py-4">
            <nav aria-label="Mobile primary" className="flex flex-col">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    [
                      'border-b border-line px-1 py-3.5 text-[15px] font-semibold transition',
                      isActive ? 'text-accent-700' : 'text-ink-950',
                    ].join(' ')
                  }
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <nav aria-label="Mobile secondary" className="mt-4 grid gap-1">
              {secondaryNavigationItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    [
                      'rounded-lg px-2 py-2 text-sm font-medium transition',
                      isActive
                        ? 'bg-accent-50 text-accent-700'
                        : 'text-slate-600 hover:bg-paper hover:text-ink-950',
                    ].join(' ')
                  }
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <ActionLink href={ojsLoginUrl} variant="secondary" className="w-full justify-center">
                Login
              </ActionLink>
              <ActionLink to="/journals" variant="primary" className="w-full justify-center">
                Submit
              </ActionLink>
            </div>
          </Container>
        </div>
      ) : null}
    </header>
  )
}

export default SiteHeader
