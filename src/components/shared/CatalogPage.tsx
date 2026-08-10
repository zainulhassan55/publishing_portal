import type { ReactNode } from 'react'
import type { InfoCard } from '../../types/content'
import FeatureCard from '../shared/FeatureCard'
import FilterBar from '../shared/FilterBar'
import SidebarPanel from '../shared/SidebarPanel'
import Container from '../layout/Container'
import PageHero from '../layout/PageHero'

type CatalogPageProps = {
  eyebrow: string
  title: string
  description: string
  items: InfoCard[]
  filters?: string[]
  sidebarTitle?: string
  sidebarPoints?: string[]
  action?: ReactNode
}

function CatalogPage({
  eyebrow,
  title,
  description,
  items,
  filters,
  sidebarTitle = 'Browse guidance',
  sidebarPoints = [
    'Use clear metadata to compare titles quickly',
    'Open detail pages for scope, status, and next actions',
    'Move into guidelines or contact when ready to publish',
  ],
  action,
}: CatalogPageProps) {
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} description={description} />

      <section className="bg-paper py-14 sm:py-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              {filters ? (
                <div className="mb-6">
                  <FilterBar items={filters} />
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                {items.map((item) => (
                  <FeatureCard
                    key={item.title}
                    title={item.title}
                    description={item.summary}
                    meta={item.meta}
                    badge={item.badge}
                  >
                    {action}
                  </FeatureCard>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <SidebarPanel title={sidebarTitle}>
                {sidebarPoints.map((point) => (
                  <p key={point}>{point}</p>
                ))}
              </SidebarPanel>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}

export default CatalogPage
