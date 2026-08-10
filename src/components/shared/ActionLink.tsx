import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type ActionLinkProps = {
  children: ReactNode
  to?: string
  href?: string
  variant?: 'primary' | 'secondary' | 'ghost' | 'light'
  size?: 'md' | 'sm'
  className?: string
}

const variantClass = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  light: 'btn-light',
}

function ActionLink({
  children,
  to,
  href,
  variant = 'primary',
  size = 'md',
  className = '',
}: ActionLinkProps) {
  const composedClassName = [
    'btn',
    'inline-flex',
    variantClass[variant],
    size === 'sm' ? 'btn-sm' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (to) {
    return (
      <Link to={to} className={composedClassName}>
        {children}
      </Link>
    )
  }

  return (
    <a href={href ?? '#'} className={composedClassName}>
      {children}
    </a>
  )
}

export default ActionLink
