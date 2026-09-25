type SectionHeadingProps = {
  eyebrow: string
  title: string
  description?: string
  tone?: 'light' | 'dark'
}

function SectionHeading({
  eyebrow,
  title,
  description,
  tone = 'dark',
}: SectionHeadingProps) {
  const isLight = tone === 'light'

  return (
    <div className="max-w-2xl">
      <p className={`meta ${isLight ? 'text-accent-200' : 'text-accent-700'}`}>{eyebrow}</p>
      <h2
        className={`mt-2 font-display text-[1.85rem] font-semibold tracking-tight sm:text-[2.1rem] ${
          isLight ? 'text-white' : 'text-ink-950'
        }`}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={`mt-2.5 max-w-xl text-sm leading-6 sm:text-[0.95rem] sm:leading-7 ${
            isLight ? 'text-slate-200' : 'text-slate-600'
          }`}
        >
          {description}
        </p>
      ) : null}
    </div>
  )
}

export default SectionHeading
