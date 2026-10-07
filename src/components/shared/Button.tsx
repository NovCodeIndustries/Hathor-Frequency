import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router'
import './Button.css'

type Variant = 'primary' | 'ghost' | 'outline-gold'

interface BaseProps {
  variant?: Variant
  /** Ancho completo */
  block?: boolean
  children: ReactNode
  className?: string
}

/** Navegación interna (ruta de la app) */
type RouteProps = BaseProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: string; href?: undefined }
/** Enlace externo */
type AnchorProps = BaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; to?: undefined }
type NativeButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined; to?: undefined }

export type ButtonProps = RouteProps | AnchorProps | NativeButtonProps

export function Button(props: ButtonProps) {
  const { variant = 'primary', block = false, className = '', children, ...rest } = props
  const cls = `hf-btn hf-btn--${variant} ${block ? 'hf-btn--block' : ''} ${className}`

  if (rest.to !== undefined) {
    const { to, ...anchor } = rest as RouteProps
    return (
      <Link className={cls} to={to} {...anchor}>
        {children}
      </Link>
    )
  }
  if (rest.href !== undefined) {
    return (
      <a className={cls} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    )
  }
  return (
    <button className={cls} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  )
}
