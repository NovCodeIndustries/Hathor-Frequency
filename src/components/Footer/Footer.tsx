import { Fragment } from 'react'
import { copyright, socials } from '../../data/site'
import { Logo } from '../shared/Logo'
import './Footer.css'

export function Footer() {
  return (
    <footer className="hf-footer">
      <div className="hf-footer__inner hf-container">
        <Logo size="footer" className="hf-footer__logo" />
        <nav className="hf-footer__social" aria-label="Redes sociales">
          {socials.map((s, i) => (
            <Fragment key={s.label}>
              {i > 0 && <span className="hf-footer__sep" aria-hidden="true">◆</span>}
              <a href={s.href} target="_blank" rel="noopener noreferrer">{s.label}</a>
            </Fragment>
          ))}
        </nav>
        <p className="hf-footer__copy">{copyright}</p>
      </div>
    </footer>
  )
}
