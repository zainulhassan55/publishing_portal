import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Container from '../layout/Container'
import { journalMenu } from '../../data/journalTemplate'
import { ojsSubmitUrl } from '../../lib/ojs'
import type { JournalMenuGroup, JournalMenuItem, JournalPage } from '../../types/content'

type JournalSubnavProps = {
  journalSlug: string
  pages: JournalPage[]
  active: 'overview' | 'issues' | string
}

function tabClass(isActive: boolean) {
  return ['series-tab', isActive ? 'series-tab-active' : ''].filter(Boolean).join(' ')
}

function itemIsActive(item: JournalMenuItem, active: string) {
  return (item.kind === 'page' && item.id === active) || (item.kind === 'archive' && active === 'issues')
}

function groupIsActive(group: JournalMenuGroup, active: string) {
  return group.items.some((item) => itemIsActive(item, active))
}

const itemClass =
  'block rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-paper-soft hover:text-ink-950'
const activeItemClass = 'block rounded-md bg-paper-soft px-3 py-2 text-sm font-semibold text-accent-700'

function JournalSubnav({ journalSlug, pages, active }: JournalSubnavProps) {
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const pageLabels = new Map(pages.map((page) => [page.id, page.label]))

  useEffect(() => {
    setOpenGroup(null)
  }, [location.pathname])

  useEffect(() => {
    if (!openGroup) return
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === 'Escape' : !navRef.current?.contains(event.target as Node)) {
        setOpenGroup(null)
      }
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [openGroup])

  const renderItem = (item: JournalMenuItem) => {
    const className = itemIsActive(item, active) ? activeItemClass : itemClass
    if (item.kind === 'submit') {
      return (
        <a href={ojsSubmitUrl(journalSlug)} className={className}>
          {item.label} ↗
        </a>
      )
    }
    if (item.kind === 'archive') {
      return (
        <Link to={`/journals/${journalSlug}/issues`} className={className}>
          {item.label}
        </Link>
      )
    }
    const label = pageLabels.get(item.id)
    if (!label) return null
    return (
      <Link to={`/journals/${journalSlug}/${item.id}`} className={className}>
        {label}
      </Link>
    )
  }

  return (
    <section className="series-subnav sticky z-30 border-b border-line bg-white/95 backdrop-blur-xl">
      <Container className="relative flex items-stretch gap-0">
        <div ref={navRef} className="flex flex-wrap items-stretch">
          <Link to={`/journals/${journalSlug}`} className={tabClass(active === 'overview')}>
            Overview
          </Link>
          {journalMenu.map((group) => {
            const isOpen = openGroup === group.label
            return (
              <div key={group.label} className="sm:relative">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                  onClick={() => setOpenGroup(isOpen ? null : group.label)}
                  className={`${tabClass(groupIsActive(group, active))} h-full gap-1 max-sm:px-2.5`}
                >
                  {group.label}
                  <span aria-hidden="true" className={`text-[10px] transition ${isOpen ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                {isOpen ? (
                  <div className="absolute top-full right-3 left-3 z-40 mt-px rounded-xl border border-line bg-white p-2 shadow-[0_18px_40px_rgba(7,19,31,0.12)] sm:right-auto sm:left-0 sm:w-64">
                    <ul className="grid gap-0.5">
                      {group.items.map((item) => (
                        <li key={item.kind === 'page' ? item.id : item.kind}>{renderItem(item)}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}

export default JournalSubnav
