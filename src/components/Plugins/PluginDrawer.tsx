import { pluginStatusLabel } from '../../data/plugins'
import type { Plugin, PluginReleaseInfo } from '../../data/types'
import { Button } from '../shared/Button'
import { Drawer } from '../shared/Drawer'
import { DemoAB } from './DemoAB'
import { priceText } from './pluginText'

interface PluginDrawerProps {
  plugin: Plugin
  n: string
  release?: PluginReleaseInfo
  onClose: () => void
}

const download = (id: string, os: 'mac' | 'win' | 'link') => `/api/plugins/${id}/download?os=${os}`

/** Detalle del plugin: captura, demo, datos técnicos y cómo conseguirlo */
export function PluginDrawer({ plugin: p, n, release, onClose }: PluginDrawerProps) {
  const hasDemo = !!(p.demoBefore && p.demoAfter)
  const installers = !p.link && p.status !== 'soon' && release ? [release.mac && 'mac', release.win && 'win'].filter(Boolean) as ('mac' | 'win')[] : []

  return (
    <Drawer kicker={`Plugin ${n} · ${p.category}`} title={p.name} subtitle={<p className="hf-plugin-drawer__status">{pluginStatusLabel[p.status]}</p>} onClose={onClose}>
      {p.image && <img className="hf-plugin-drawer__shot" src={p.image} alt={`Interfaz de ${p.name}`} loading="lazy" />}
      <p className="hf-drawer__desc">{p.description}</p>

      {hasDemo && (
        <>
          <h3 className="hf-drawer__h3">Antes y después</h3>
          <DemoAB plugin={p} bars={48} />
        </>
      )}

      <dl className="hf-plugin-drawer__specs">
        <div>
          <dt>Formatos</dt>
          <dd>{p.formats.length ? p.formats.join(' · ') : '—'}</dd>
        </div>
        <div>
          <dt>Sistemas</dt>
          <dd>{p.systems.length ? p.systems.join(' · ') : '—'}</dd>
        </div>
        <div>
          <dt>Versión</dt>
          <dd>{release?.version ?? '—'}</dd>
        </div>
        <div>
          <dt>Precio</dt>
          <dd className="hf-plugin-drawer__price">{priceText(p)}</dd>
        </div>
      </dl>

      <div className="hf-plugin-drawer__ctas">
        {p.status === 'soon' ? (
          <Button variant="primary" to="/contacto" block>Avísame cuando salga</Button>
        ) : p.link ? (
          <Button variant="primary" href={download(p.id, 'link')} target="_blank" rel="noopener" block>
            {p.status === 'beta' ? 'Unirme a la beta' : p.free ? 'Descargar' : 'Comprar'}
          </Button>
        ) : installers.length ? (
          installers.map((os, i) => (
            <Button key={os} variant={i === 0 ? 'primary' : 'ghost'} href={download(p.id, os)} block>
              Descargar para {os === 'mac' ? 'macOS' : 'Windows'}
            </Button>
          ))
        ) : (
          <Button variant="ghost" to="/contacto" block>Pregúntanos por él</Button>
        )}
      </div>
    </Drawer>
  )
}
