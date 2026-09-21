import { Link } from 'react-router-dom'
import Container from '../layout/Container'
import type { JournalPage } from '../../types/content'

type JournalSubnavProps = {
  journalSlug: string
  pages: JournalPage[]
  active: 'overview' | 'issues' | string
}

function tabClass(isActive: boolean) {
  return [
    'relative shrink-0 px-3.5 py-3 text-sm font-semibold transition',
    isActive
      ? 'text-accent-700 after:absolute after:right-3 after:bottom-0 after:left-3 after:h-0.5 after:rounded-full after:bg-accent-600'
      : 'text-slate-500 hover:text-ink-950',
  ].join(' ')
}

function JournalSubnav({ journalSlug, pages, active }: JournalSubnavProps) {
  return (
    <section className="sticky top-[4.5rem] z-30 border-b border-line bg-white/95 backdrop-blur-xl">
      <Container className="flex gap-1 overflow-x-auto">
        <Link to={`/journals/${journalSlug}`} className={tabClass(active === 'overview')}>
          Overview
        </Link>
        {pages.map((page) => (
          <Link
            key={page.id}
            to={`/journals/${journalSlug}/${page.id}`}
            className={tabClass(active === page.id)}
          >
            {page.label}
          </Link>
        ))}
        <Link
          to={`/journals/${journalSlug}/issues`}
          className={tabClass(active === 'issues')}
        >
          Issues
        </Link>
      </Container>
    </section>
  )
}

export default JournalSubnav
