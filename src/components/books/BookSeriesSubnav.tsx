import { Link } from 'react-router-dom'
import Container from '../layout/Container'
import type { JournalPage } from '../../types/content'

type BookSeriesSubnavProps = {
  seriesSlug: string
  pages: JournalPage[]
  active: 'overview' | string
}

function tabClass(isActive: boolean) {
  return [
    'series-tab',
    isActive ? 'series-tab-active' : '',
  ]
    .filter(Boolean)
    .join(' ')
}

function BookSeriesSubnav({ seriesSlug, pages, active }: BookSeriesSubnavProps) {
  return (
    <section className="series-subnav sticky z-30 border-b border-line bg-white/95 backdrop-blur-xl">
      <Container className="flex items-stretch gap-0 overflow-x-auto">
        <Link to={`/books/${seriesSlug}`} className={tabClass(active === 'overview')}>
          Overview
        </Link>
        {pages.map((page) => (
          <Link
            key={page.id}
            to={`/books/${seriesSlug}/${page.id}`}
            className={tabClass(active === page.id)}
          >
            {page.label}
          </Link>
        ))}
      </Container>
    </section>
  )
}

export default BookSeriesSubnav
