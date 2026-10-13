import { useCallback, useEffect, useRef, useState } from 'react'
import { globalModules, moduleById, pageModuleOf, pageModules } from '../../data/modules'
import { adminApi, formatStamp, type SiteState, type SiteVersionInfo } from '../../lib/adminApi'
import { WEB_ORIGIN, WEB_URL } from '../../lib/origins'
import { MaintenanceModal } from './MaintenanceModal'
import type { EditMessage } from '../../lib/siteModules'
import { useAdmin } from '../../lib/useAdmin'
import './AdminSite.css'
import { contentItemLabel } from '../../lib/content'

const PAGES = [{ path: '/', label: 'Inicio', id: undefined as string | undefined }, ...pageModules.map((m) => ({ path: m.route!, label: m.label, id: m.id }))]

const GLOBAL_DESC: Record<string, string> = {
  'global.ticker': 'Banda sobre el footer',
  'global.ufo': 'Recorre todas las vistas',
  'global.welcome': '“Sintonizando” al entrar',
  'global.seasons': 'Colores y glifos del mes',
  'global.eggs': 'Extraterrestres y concierto',
  'global.socials': 'Footer y Contacto',
}

const SECTION_PAGE: Record<string, string> = { inicio: 'Inicio' }

/** "Estudio · Equipo", "Artistas · Luna K.", "Global · Platillo volador" */
function moduleTitle(id: string): string {
  const m = moduleById.get(id)
  if (!m) {
    // Elemento creado en Contenido: "Artistas · Nuevo artista"
    const page = { artistas: 'Artistas', paquetes: 'Servicios', faq: 'FAQs', plugins: 'Plugins' }[id.split('.')[0]]
    const label = contentItemLabel(id)
    return label && page ? `${page} · ${label}` : id
  }
  if (m.kind === 'page') return `Página ${m.label}`
  if (m.kind === 'global') return `Global · ${m.label}`
  let page = SECTION_PAGE[id.split('.')[0]]
  for (let p = m.parent; p && !page; p = moduleById.get(p)?.parent) {
    const parent = moduleById.get(p)
    if (parent?.kind === 'page') page = parent.label
  }
  return page ? `${page} · ${m.label}` : m.label
}

const diff = (a: string[], b: string[]) => a.filter((id) => !b.includes(id))
const withEdit = (path: string) => `${WEB_URL}${path}${path.includes('?') ? '&' : '?'}modo=edicion`

/**
 * Panel · Sitio (diseño S1 + H2 + L + G + P, canvas https://claude.ai/artifact/D4NYHBREuqQbBVTPLUe3cS):
 * la web real en modo edición dentro de un iframe, con switches por módulo; borrador → Publicar.
 */
export function AdminSite() {
  const { refreshSummary, onError, summary } = useAdmin()
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [state, setState] = useState<SiteState | null>(null)
  const draftRef = useRef<string[]>([])
  const [src, setSrc] = useState('/')
  const [path, setPath] = useState('/')
  const [mobile, setMobile] = useState(false)
  const [panel, setPanel] = useState<'globals' | 'history' | 'publish' | 'maintenance' | null>(() =>
    new URLSearchParams(window.location.search).has('mantenimiento') ? 'maintenance' : null,
  )
  const maintenance = summary?.maintenance
  const [history, setHistory] = useState<SiteVersionInfo[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const sendDraft = useCallback((disabled: string[]) => {
    frameRef.current?.contentWindow?.postMessage({ type: 'hf-edit-draft', disabled } satisfies EditMessage, WEB_ORIGIN)
  }, [])

  const apply = useCallback(
    (s: SiteState) => {
      draftRef.current = s.draft
      setState(s)
      sendDraft(s.draft)
      refreshSummary()
    },
    [sendDraft, refreshSummary],
  )

  useEffect(() => {
    adminApi.site().then(apply).catch((err) => setError(onError(err)))
  }, [apply, onError])

  const toggle = useCallback(
    async (id: string) => {
      const cur = draftRef.current
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
      draftRef.current = next
      setState((s) => (s ? { ...s, draft: next } : s))
      sendDraft(next)
      try {
        apply(await adminApi.saveSiteDraft(next))
        setError('')
      } catch (err) {
        setError(onError(err))
      }
    },
    [apply, sendDraft, onError],
  )

  // Mensajes del iframe: lista para recibir el borrador, cambio de ruta y switches
  useEffect(() => {
    const onMessage = (e: MessageEvent<EditMessage>) => {
      if (e.origin !== WEB_ORIGIN || e.source !== frameRef.current?.contentWindow) return
      const msg = e.data
      if (msg?.type === 'hf-edit-ready') {
        setPath(msg.path.replace(/[?&]modo=edicion/, '').replace(/\?$/, '') || '/')
        sendDraft(draftRef.current)
      } else if (msg?.type === 'hf-edit-route') {
        setPath(msg.path.replace(/[?&]modo=edicion/, '').replace(/\?$/, '') || '/')
      } else if (msg?.type === 'hf-edit-toggle') {
        toggle(msg.id)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [sendDraft, toggle])

  const run = async (fn: () => Promise<SiteState>, after?: () => void) => {
    setBusy(true)
    try {
      apply(await fn())
      setError('')
      after?.()
    } catch (err) {
      setError(onError(err))
    } finally {
      setBusy(false)
    }
  }

  const openHistory = () => {
    setPanel(panel === 'history' ? null : 'history')
    adminApi.siteHistory().then(setHistory).catch((err) => setError(onError(err)))
  }

  if (!state) {
    return (
      <>
        <title>Sitio · Panel</title>
        {error ? <p className="hf-admin__error" role="alert">{error}</p> : <p className="hf-admin__empty" role="status">Cargando…</p>}
      </>
    )
  }

  const hidden = diff(state.draft, state.published)
  const shown = diff(state.published, state.draft)
  const changes = hidden.length + shown.length
  const current = PAGES.find((p) => p.path === path.split('?')[0]) ?? PAGES[0]
  const pageId = pageModuleOf(path)
  const pageOn = !pageId || !state.draft.includes(pageId)

  return (
    <>
      <title>Sitio · Panel</title>

      <div className="hf-asite__head">
        <div>
          <h1 className="hf-admin__title">
            Sitio <span className="hf-asite__gold">en modo edición</span>
          </h1>
          <p className="hf-admin__lead">
            {changes
              ? `${changes} ${changes === 1 ? 'cambio' : 'cambios'} sin publicar: la web pública aún no cambia.`
              : 'Todo publicado. Lo que ves es lo que ve el público.'}
          </p>
        </div>
        <div className="hf-asite__actions">
          <button
            type="button"
            className={`hf-admin__btn hf-admin__btn--sm ${maintenance?.enabled ? 'hf-admin__btn--primary' : 'hf-admin__btn--ghost'}`}
            aria-haspopup="dialog"
            onClick={() => setPanel('maintenance')}
          >
            {maintenance?.enabled ? 'En mantenimiento' : 'Mantenimiento'}
          </button>
          <button type="button" className="hf-admin__btn hf-admin__btn--ghost hf-admin__btn--sm" aria-expanded={panel === 'history'} onClick={openHistory}>
            Historial
          </button>
          <button type="button" className="hf-admin__btn hf-admin__btn--sm" disabled={!changes || busy} onClick={() => run(adminApi.discardSite)}>
            Descartar
          </button>
          <button
            type="button"
            className="hf-admin__btn hf-admin__btn--primary hf-admin__btn--sm"
            disabled={!changes || busy}
            onClick={() => setPanel('publish')}
          >
            Publicar{changes ? ` · ${changes}` : ''}
          </button>
        </div>
      </div>

      {error && <p className="hf-admin__error" role="alert">{error}</p>}

      <div className="hf-asite__toolbar">
        <div className="hf-asite__tabs" role="tablist" aria-label="Página">
          {PAGES.map((p) => {
            const off = !!p.id && state.draft.includes(p.id)
            return (
              <button
                key={p.path}
                type="button"
                role="tab"
                aria-selected={current.path === p.path}
                className={`hf-asite__tab ${off ? 'is-off' : ''}`}
                onClick={() => {
                  setPath(p.path)
                  setSrc(p.path)
                }}
              >
                {p.label}
                {off && ' · oculta'}
              </button>
            )
          })}
        </div>
        <div className="hf-asite__tools">
          <button
            type="button"
            className="hf-admin__btn hf-admin__btn--sm hf-asite__globals-btn"
            aria-expanded={panel === 'globals'}
            onClick={() => setPanel(panel === 'globals' ? null : 'globals')}
          >
            Globales · {globalModules.length}
          </button>
          <div className="hf-asite__device" role="group" aria-label="Dispositivo">
            <button type="button" aria-pressed={!mobile} onClick={() => setMobile(false)}>Escritorio</button>
            <button type="button" aria-pressed={mobile} onClick={() => setMobile(true)}>Móvil</button>
          </div>
        </div>
      </div>

      {/* G · Globales */}
      {panel === 'globals' && (
        <section className="hf-asite__globals" aria-label="Globales">
          <p className="hf-admin__lead">Lo que no es un bloque de una sola página. En modo edición la bienvenida, el platillo y los easter eggs no se muestran, para que no tapen.</p>
          <div className="hf-asite__globals-grid">
            {globalModules.map((g) => {
              const on = !state.draft.includes(g.id)
              return (
                <div key={g.id} className={`hf-asite__global ${on ? '' : 'is-off'}`}>
                  <span>
                    <span className="hf-asite__global-name">{g.label}</span>
                    <span className="hf-asite__muted">{GLOBAL_DESC[g.id]}</span>
                  </span>
                  <button type="button" role="switch" aria-checked={on} aria-label={`${g.label}: ${on ? 'visible' : 'oculto'}`} className="hf-asite__switch" onClick={() => toggle(g.id)}>
                    <span />
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* P · Historial */}
      {panel === 'history' && (
        <section className="hf-asite__history" aria-label="Historial">
          {history === null && <p className="hf-asite__muted">Cargando…</p>}
          {history?.length === 0 && <p className="hf-asite__muted">Todavía no hay publicaciones.</p>}
          {history?.map((h) => (
            <div key={h.id} className="hf-asite__version">
              <span>
                <span>{formatStamp(h.publishedAt)} · {h.publishedByName}</span>
                <span className="hf-asite__muted">
                  {[
                    h.hidden.length ? `Ocultó ${h.hidden.slice(0, 3).map(moduleTitle).join(', ')}${h.hidden.length > 3 ? ` y ${h.hidden.length - 3} más` : ''}` : '',
                    h.shown.length ? `Mostró ${h.shown.slice(0, 3).map(moduleTitle).join(', ')}${h.shown.length > 3 ? ` y ${h.shown.length - 3} más` : ''}` : '',
                  ]
                    .filter(Boolean)
                    .join(' · ') || 'Sin cambios'}
                </span>
              </span>
              {h.current ? (
                <span className="hf-asite__current">Publicada</span>
              ) : (
                <button type="button" className="hf-admin__btn hf-admin__btn--sm" disabled={busy} onClick={() => run(() => adminApi.restoreSite(h.id), () => setPanel(null))}>
                  Restaurar
                </button>
              )}
            </div>
          ))}
          <p className="hf-asite__muted">Restaurar copia esa versión al borrador; después revisa y publica.</p>
        </section>
      )}

      {/* Vista previa */}
      <div className="hf-asite__window">
        <div className="hf-asite__bar">
          <span className="hf-asite__muted">hathorfrequency.mx{path === '/' ? '' : path} · borrador</span>
          {pageId && (
            <label className="hf-asite__page-switch">
              Página {moduleById.get(pageId)?.label}
              <button type="button" role="switch" aria-checked={pageOn} aria-label={`Página ${moduleById.get(pageId)?.label}: ${pageOn ? 'visible' : 'oculta'}`} className="hf-asite__switch" onClick={() => toggle(pageId)}>
                <span />
              </button>
            </label>
          )}
        </div>
        <div className={`hf-asite__stage ${mobile ? 'is-mobile' : ''}`}>
          <iframe key={src} ref={frameRef} src={withEdit(src)} title={`Vista previa de ${current.label}`} className="hf-asite__frame" />
        </div>
      </div>

      {/* Mantenimiento: apagar la web completa, al instante */}
      {panel === 'maintenance' && maintenance && (
        <MaintenanceModal
          state={maintenance}
          onClose={() => setPanel(null)}
          onSaved={() => {
            setPanel(null)
            refreshSummary()
          }}
          onError={onError}
        />
      )}

      {/* P · Confirmar publicación */}
      {panel === 'publish' && (
        <div className="hf-asite__modal">
          <button type="button" className="hf-asite__backdrop" aria-label="Cerrar" tabIndex={-1} onClick={() => setPanel(null)} />
          <div className="hf-asite__confirm" role="dialog" aria-modal="true" aria-labelledby="site-publish-title">
            <h2 id="site-publish-title" className="hf-asite__confirm-title">
              ¿Publicar <span className="hf-asite__gold">{changes} {changes === 1 ? 'cambio' : 'cambios'}?</span>
            </h2>
            <ul className="hf-asite__changes">
              {hidden.map((id) => <li key={id}>{moduleTitle(id)} → oculto</li>)}
              {shown.map((id) => <li key={id}>{moduleTitle(id)} → visible</li>)}
            </ul>
            <div className="hf-asite__confirm-actions">
              <button type="button" className="hf-admin__btn" onClick={() => setPanel(null)}>Seguir editando</button>
              <button type="button" className="hf-admin__btn hf-admin__btn--primary" disabled={busy} onClick={() => run(adminApi.publishSite, () => setPanel(null))}>
                Publicar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
