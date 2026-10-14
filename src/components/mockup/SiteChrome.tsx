import { buildTypeaheadIndex } from '@/lib/search'
import { Header } from './Header'
import { Footer } from './Footer'

/**
 * Thin server wrapper around the replicated mockup chrome. Builds the compact
 * typeahead index on the server and hands it to the client Header as data, so
 * the header itself stays a pure replica of Header.dc.html. Async because the
 * article half of the index respects the admin show/hide gate.
 */
export async function SiteChrome({ children }: { children: React.ReactNode }) {
  const suggestions = await buildTypeaheadIndex()
  return (
    <>
      <Header suggestions={suggestions} />
      <main id="main">{children}</main>
      <Footer />
    </>
  )
}
