import { Link } from 'react-router-dom'
import { bookCoverBySlug } from '../../data/bookCovers'
import { journalCoverBySlug } from '../../data/journalCovers'
import ActionLink from './ActionLink'

const toneBySlug: Record<string, string> = {
  ijdh: 'portfolio-tone-mint',
  ijdm: 'portfolio-tone-sky',
  ijds: 'portfolio-tone-sage',
  ijei: 'portfolio-tone-sand',
  ijic: 'portfolio-tone-slate',
  ijis: 'portfolio-tone-seafoam',
  ijmc: 'portfolio-tone-azure',
  ijmr: 'portfolio-tone-olive',
  ijqt: 'portfolio-tone-cyan',
  ijse: 'portfolio-tone-emerald',
  isri: 'portfolio-tone-amber',
  lnisi: 'portfolio-tone-steel',
}

type PortfolioCardProps = {
  slug: string
  shortTitle: string
  title: string
  summary?: string
  area: string
  access: string
  frequency: string
  reviewType?: string
  to: string
  actionLabel: string
}

function PortfolioCard({
  slug,
  shortTitle,
  title,
  summary,
  area,
  access,
  frequency,
  reviewType,
  to,
  actionLabel,
}: PortfolioCardProps) {
  const toneClass = toneBySlug[slug] ?? 'portfolio-tone-mint'
  const coverImage = journalCoverBySlug[slug] ?? bookCoverBySlug[slug]

  return (
    <article className="portfolio-card group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-white shadow-[0_8px_22px_rgba(7,19,31,0.04)] transition hover:-translate-y-0.5 hover:border-ink-700/20 hover:shadow-[0_14px_30px_rgba(7,19,31,0.08)]">
      <div className={`relative px-4 py-3.5 ${toneClass}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-800/70 uppercase">
              {area}
            </p>
            <h3 className="mt-1 font-display text-[1.05rem] leading-snug font-semibold tracking-tight text-ink-950">
              <Link to={to} className="transition hover:opacity-80">
                {title}
              </Link>
            </h3>
          </div>
          <span className="shrink-0 rounded-md border border-ink-950/10 bg-white/70 px-2 py-0.5 text-[10px] font-semibold tracking-[0.08em] text-ink-800 uppercase">
            {access}
          </span>
        </div>
        <div className="mt-2.5 flex items-center justify-between gap-3 text-[11px] text-ink-800/65">
          <span className="font-semibold tracking-[0.1em] uppercase">{shortTitle}</span>
          <span>ISSN Sample</span>
        </div>
      </div>

      {coverImage ? (
        <Link to={to} className="relative block overflow-hidden border-y border-line">
          <img
            src={coverImage}
            alt=""
            className="aspect-[16/10] h-auto w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        </Link>
      ) : (
        <div className={`relative aspect-[16/10] border-y border-line ${toneClass}`} />
      )}

      <div className={`h-1.5 ${toneClass}`} aria-hidden="true" />

      <div className="flex flex-1 flex-col px-4 pt-3.5 pb-4">
        {summary ? (
          <p className="mb-3 line-clamp-2 text-sm leading-6 text-slate-600">{summary}</p>
        ) : null}

        <div className="mt-auto grid grid-cols-2 gap-2 text-xs text-slate-500">
          <div>
            <p className="font-semibold tracking-[0.06em] text-slate-400 uppercase">Frequency</p>
            <p className="mt-1 font-medium text-ink-950">{frequency}</p>
          </div>
          <div>
            <p className="font-semibold tracking-[0.06em] text-slate-400 uppercase">Review</p>
            <p className="mt-1 font-medium text-ink-950">{reviewType ?? 'Peer review'}</p>
          </div>
        </div>

        <div className="mt-4">
          <ActionLink to={to} variant="secondary" size="sm" className="w-full justify-center">
            {actionLabel}
          </ActionLink>
        </div>
      </div>
    </article>
  )
}

export default PortfolioCard
