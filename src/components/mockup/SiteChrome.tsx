import { buildTypeaheadIndex } from '@/lib/search'
import { Header } from './Header'
import { Footer } from './Footer'

/**
 * Thin server wrapper around the replicated mockup chrome. Builds the compact
 * typeahead index at build time and hands it to the client Header as data, so
 * the header itself stays a pure replica of Header.dc.html.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header suggestions={buildTypeaheadIndex()} />
      <main id="main">{children}</main>
      <Footer />
    </>
  )
}
