import { NavLink } from 'react-router-dom'
import { brand, footerGroups } from '../../data/siteContent'
import ActionLink from '../shared/ActionLink'
import Container from './Container'

function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <Container className="grid gap-10 py-14 lg:grid-cols-[1.25fr_0.75fr_0.75fr_0.9fr]">
        <div>
          <p className="meta text-accent-700">{brand.shortName}</p>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink-950">
            {brand.name}
          </h2>
          <p className="mt-4 max-w-md text-sm leading-7 text-slate-600">{brand.summary}</p>
        </div>

        {footerGroups.map((group) => (
          <div key={group.title}>
            <p className="meta">{group.title}</p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              {group.links.map((link) => (
                <NavLink
                  key={link.path + link.label}
                  to={link.path}
                  className="block font-medium transition hover:text-ink-950"
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}

        <div>
          <p className="meta">For authors</p>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Review guidelines, open calls, and journal scope before submitting your manuscript.
          </p>
          <ActionLink to="/guidelines" variant="primary" className="mt-5" size="sm">
            Author Guidelines
          </ActionLink>
        </div>
      </Container>
    </footer>
  )
}

export default SiteFooter
