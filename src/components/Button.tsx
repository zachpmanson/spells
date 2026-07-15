import { Link } from '@tanstack/react-router'
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from 'react'

interface BaseProps {
  size?: 'sm'
  className?: string
  children: ReactNode
}

type LinkOnlyProps = Omit<ComponentProps<typeof Link>, 'className' | 'children' | 'to'>

type ButtonProps =
  | (BaseProps & LinkOnlyProps & { to: ComponentProps<typeof Link>['to'] })
  | (BaseProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & { to?: undefined })

export function Button(props: ButtonProps) {
  const { size, className, children } = props
  const classes = ['btn', size === 'sm' ? 'btn-sm' : '', className ?? ''].filter(Boolean).join(' ')

  if (props.to !== undefined) {
    const { size: _size, className: _className, children: _children, to, ...linkProps } = props
    return (
      <Link to={to} className={classes} {...linkProps}>
        {children}
      </Link>
    )
  }

  const { size: _size, className: _className, children: _children, to: _to, ...buttonProps } = props
  return (
    <button type="button" className={classes} {...buttonProps}>
      {children}
    </button>
  )
}
