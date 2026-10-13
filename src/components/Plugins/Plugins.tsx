import { useRef, useState } from 'react'
import { pluginModule } from '../../data/modules'
import { useContent } from '../../lib/content'
import { usePluginReleases } from '../../lib/usePluginReleases'
import { useMediaQuery } from '../../lib/useMediaQuery'
import { useModuleFilter } from '../../lib/siteModules'
import { Button } from '../shared/Button'
import { EditItem } from '../shared/EditFrame'
import { Eyebrow } from '../shared/Eyebrow'
import { GoldText } from '../shared/GoldText'
import { Module } from '../shared/Module'
import { DemoAB } from './DemoAB'
import { PluginDrawer } from './PluginDrawer'
import { PluginPedal } from './PluginPedal'
import { PluginRackUnit } from './PluginRackUnit'
import { pluginNumber } from './pluginText'
import './Plugins.css'

const FREE = '__gratis'

/**
 * /plugins (canvas https://claude.ai/artifact/5kr28fDbP2c7tTmyuaTgno): en escritorio la pedalera (P2) con la
 * demo "Antes y después"; en móvil el rack (P1) con filtros por tipo. Cada plugin abre su panel de detalle.
 */
export function Plugins() {
  const { intro, items } = useContent('plugins')
  const { slogan } = useContent('sitio')
  const releases = usePluginReleases()
  const isOn = useModuleFilter()
  const mobile = useMediaQuery('(max-width: 767px)')
  const [filter, setFilter] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [demoId, setDemoId] = useState<string | null>(null)
  const trigger = useRef<HTMLButtonElement | null>(null)

  // El número de cada plugin sale de su lugar en la lista completa (no cambia al filtrar)
  const visible = items.map((p, i) => ({ p, n: pluginNumber(i) })).filter(({ p }) => isOn(pluginModule(p.id)))
  const categories = [...new Set(visible.map(({ p }) => p.category).filter(Boolean))]
  const hasFree = visible.some(({ p }) => p.free && p.status !== 'soon')
  const shown = visible.filter(({ p }) => !filter || (filter === FREE ? p.free && p.status !== 'soon' : p.category === filter))
  const withDemo = visible.filter(({ p }) => p.demoBefore && p.demoAfter)
  const demo = withDemo.find(({ p }) => p.id === demoId) ?? withDemo[0]
  const open = visible.find(({ p }) => p.id === openId)

  const openPlugin = (id: string, button: HTMLButtonElement) => {
    trigger.current = button
    setOpenId(id)
  }
  const close = () => {
    setOpenId(null)
    trigger.current?.focus()
  }

  if (!visible.length) {
    return (
      <section className="hf-plugins hf-container" aria-labelledby="plugins-title">
        <div className="hf-plugins__head">
          <Eyebrow both>Plugins</Eyebrow>
          <h1 id="plugins-title" className="hf-h2">Pronto <GoldText>los publicamos.</GoldText></h1>
        </div>
      </section>
    )
  }

  return (
    <section className="hf-plugins hf-container" aria-labelledby="plugins-title">
      {mobile ? (
        <div className="hf-plugins__head hf-plugins__head--rack">
          <Eyebrow>Hechos en el estudio</Eyebrow>
          <h1 id="plugins-title" className="hf-h2">
            Las herramientas <GoldText>que usamos al mezclar.</GoldText>
          </h1>
          <p className="hf-lead">{intro}</p>
        </div>
      ) : (
        <div className="hf-plugins__head">
          <p className="hf-plugins__kick">Plugins · Hathor Frequency</p>
          <h1 id="plugins-title" className="hf-h2">
            Pisa el pedal.
            <br />
            <GoldText>Cambia el sonido.</GoldText>
          </h1>
          <p className="hf-lead">{intro}</p>
          <p className="hf-plugins__slogan">{slogan}</p>
        </div>
      )}

      {mobile && categories.length + (hasFree ? 1 : 0) > 1 && (
        <div className="hf-plugins__filters" role="group" aria-label="Filtrar por tipo">
          <button type="button" className="hf-plugins__filter" aria-pressed={!filter} onClick={() => setFilter(null)}>Todos</button>
          {categories.map((c) => (
            <button key={c} type="button" className="hf-plugins__filter" aria-pressed={filter === c} onClick={() => setFilter(c)}>{c}</button>
          ))}
          {hasFree && <button type="button" className="hf-plugins__filter" aria-pressed={filter === FREE} onClick={() => setFilter(FREE)}>Gratis</button>}
        </div>
      )}

      {mobile ? (
        <div className="hf-rack" aria-label="Rack de plugins">
          {shown.map(({ p, n }) => (
            <EditItem key={p.id} id={pluginModule(p.id)}>
              <PluginRackUnit plugin={p} n={n} onOpen={(b) => openPlugin(p.id, b)} />
            </EditItem>
          ))}
        </div>
      ) : (
        <div className="hf-pedalboard" aria-label="Pedalera de plugins">
          {shown.map(({ p }) => (
            <EditItem key={p.id} id={pluginModule(p.id)}>
              <PluginPedal plugin={p} onOpen={(b) => openPlugin(p.id, b)} />
            </EditItem>
          ))}
        </div>
      )}

      {mobile ? (
        <div className="hf-plugins__cta">
          <p className="hf-plugins__cta-title">¿Los quieres probar en una sesión?</p>
          <Button variant="primary" to="/reservar" block>Reservar sesión</Button>
        </div>
      ) : (
        demo && (
          <Module id="plugins.demo">
            <div className="hf-plugins__demo">
              <div className="hf-plugins__demo-text">
                <p className="hf-plugins__kick">Escúchalo</p>
                <h2 className="hf-plugins__demo-title">Antes y después</h2>
                <p className="hf-plugins__demo-lead">La misma toma, con el plugin apagado y encendido.</p>
                {withDemo.length > 1 && (
                  <div className="hf-plugins__demo-pick" role="group" aria-label="Plugin de la demo">
                    {withDemo.map(({ p }) => (
                      <button key={p.id} type="button" className="hf-plugins__filter" aria-pressed={p.id === demo.p.id} onClick={() => setDemoId(p.id)}>{p.name}</button>
                    ))}
                  </div>
                )}
              </div>
              <DemoAB key={demo.p.id} plugin={demo.p} />
            </div>
          </Module>
        )
      )}

      {open && <PluginDrawer plugin={open.p} n={open.n} release={releases[open.p.id]} onClose={close} />}
    </section>
  )
}
