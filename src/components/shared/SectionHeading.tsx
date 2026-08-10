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
      <p className={`meta ${isLight ? 'text-accent-200' : 'text-accent-700'}`}>
        {eyebrow}
      </p>
      <h2
        className={`mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl ${
          isLight ? 'text-white' : 'text-ink-950'
        }`}
      >
        {title}
      </h2>
      {description ? (
        <p className={`mt-4 text-base leading-7 ${isLight ? 'text-slate-200' : 'text-slate-600'}`}>
          {description}
        </p>
      ) : null}
    </div>
  )
}

export default SectionHeading
