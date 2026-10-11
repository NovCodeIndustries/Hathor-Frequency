import { Fragment } from 'react'
import { copyright } from '../../data/site'
import { useContent } from '../../lib/content'
import { useSeason } from '../../lib/useSeason'
import { Module } from '../shared/Module'
import { Logo } from '../shared/Logo'
import './Footer.css'

export function Footer() {
  const { socials } = useContent('sitio')
  const season = useSeason()
  return (
    <footer className="hf-footer">
      <div className="hf-footer__inner hf-container">
        <Logo size="footer" className="hf-footer__logo" />
        <Module id="global.socials">
        <nav className="hf-footer__social" aria-label="Redes sociales">
          {socials.map((s, i) => (
            <Fragment key={s.label}>
              {i > 0 && <span className="hf-footer__sep" aria-hidden="true">◆</span>}
              <a href={s.href} target="_blank" rel="noopener noreferrer">{s.label}</a>
            </Fragment>
          ))}
        </nav>
        </Module>
        <p className="hf-footer__copy">
          {copyright}
          {season && <span className="hf-footer__season">{season.page.footer}</span>}
        </p>
      </div>
    </footer>
  )
}
