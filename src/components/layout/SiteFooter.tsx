import { NavLink } from 'react-router-dom'
import { brand, footerGroups } from '../../data/siteContent'
import ActionLink from '../shared/ActionLink'
import Container from './Container'

function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-ink-950 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 50% 60% at 0% 100%, rgba(20,150,140,0.25), transparent 55%)',
        }}
      />

      <Container className="relative grid gap-10 py-14 lg:grid-cols-[1.3fr_0.7fr_0.7fr_0.9fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white font-display text-sm font-semibold text-ink-950">
              {brand.shortName.slice(0, 2)}
            </span>
            <div>
              <p className="meta text-accent-300">{brand.shortName}</p>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-white">
                {brand.name}
              </h2>
            </div>
          </div>
          <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">{brand.summary}</p>
        </div>

        {footerGroups.map((group) => (
          <div key={group.title}>
            <p className="meta text-accent-300">{group.title}</p>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              {group.links.map((link) => (
                <NavLink
                  key={link.path + link.label}
                  to={link.path}
                  className="block font-medium transition hover:text-white"
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}

        <div>
          <p className="meta text-accent-300">For authors</p>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Review guidelines, open calls, and journal scope before submitting your manuscript.
          </p>
          <ActionLink to="/guidelines" variant="light" className="mt-5" size="sm">
            Author Guidelines
          </ActionLink>
        </div>
      </Container>

      <div className="relative border-t border-white/10">
        <Container className="flex flex-col gap-2 py-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Digital Manuscriptpedia. All rights reserved.</p>
          <p>Independent academic publishing · APC-free open access</p>
        </Container>
      </div>
    </footer>
  )
}

export default SiteFooter
