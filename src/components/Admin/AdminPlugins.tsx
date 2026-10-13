import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { pluginStatusLabel } from '../../data/plugins'
import { adminApi, formatStamp, type ContentState, type FieldIssue, type PluginRelease, type PluginStats } from '../../lib/adminApi'
import type { PreviewMessage } from '../../lib/content'
import { WEB_ORIGIN, WEB_URL } from '../../lib/origins'
import { useAdmin } from '../../lib/useAdmin'
import { useAdminLive } from '../../lib/useAdminLive'
import { ContentForm } from './ContentForm'
import { sectionForms, setAt, stable, type ItemsForm } from './contentForms'
import { MediaPicker } from './MediaPicker'
import './AdminContent.css'
import './AdminSite.css'
import './AdminPlugins.css'

type Obj = Record<string, unknown>
type Phase = 'idle' | 'saving' | 'publishing' | 'published'
type View = 'ficha' | 'versiones'

const KEY = 'plugins'
const form = sectionForms.plugins as ItemsForm
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const statusOf = (x: Obj) => pluginStatusLabel[x.status as keyof typeof pluginStatusLabel] ?? ''

/**
 * Panel · Plugins (diseño K3 = K1 + K2, canvas https://claude.ai/artifact/5kr28fDbP2c7tTmyuaTgno):
 * cifras de descargas arriba; a la izquierda la lista; a la derecha la ficha del plugin (contenido `plugins`,
 * borrador que se guarda solo y Publicar) o sus versiones (instaladores y la versión actual que se descarga).
 */
export function AdminPlugins() {
  const { refreshSummary, onError } = useAdmin()
  const [state, setState] = useState<ContentState | null>(null)
  const [draft, setDraft] = useState<Obj | null>(null)
  const [stats, setStats] = useState<PluginStats | null>(null)
  const [selected, setSelected] = useState<number | 'general'>(0)
  const [view, setView] = useState<View>('ficha')
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [preview, setPreview] = useState(false)
  const saveTimer = useRef<number | undefined>(undefined)
  const pending = useRef<Obj | null>(null)
  const frameRef = useRef<HTMLIFrameElement>(null)

  const loadStats = useCallback(() => {
    adminApi.pluginStats().then(setStats).catch(() => {})
  }, [])
  // Una descarga o una versión nueva (aquí o en otra pestaña): se actualizan las cifras
  useAdminLive(['plugins'], loadStats)

  useEffect(() => {
    adminApi
      .content(KEY)
      .then((s) => {
        setState(s)
        setDraft(s.draft as Obj)
      })
      .catch((err) => setError(onError(err)))
    loadStats()
  }, [onError, loadStats])

  // Vista previa: el borrador se manda al iframe de la web (?modo=vista), igual que en Contenido
  const sendPreview = useCallback((data: Obj | null) => {
    if (data) frameRef.current?.contentWindow?.postMessage({ type: 'hf-preview-draft', key: KEY, data } satisfies PreviewMessage, WEB_ORIGIN)
  }, [])
  useEffect(() => {
    const onMessage = (e: MessageEvent<PreviewMessage>) => {
      if (e.origin !== WEB_ORIGIN || e.source !== frameRef.current?.contentWindow) return
      if (e.data?.type === 'hf-preview-ready') sendPreview(draft)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [draft, sendPreview])

  const flush = useCallback(async () => {
    window.clearTimeout(saveTimer.current)
    const data = pending.current
    if (!data) return
    pending.current = null
    try {
      setState(await adminApi.saveContentDraft(KEY, data))
      setPhase('idle')
      refreshSummary()
    } catch (err) {
      setError(onError(err))
      setPhase('idle')
    }
  }, [refreshSummary, onError])
  useEffect(() => () => void flush(), [flush])

  const update = (next: Obj) => {
    setDraft(next)
    sendPreview(next)
    setPhase('saving')
    setError('')
    pending.current = next
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => void flush(), 600)
  }
  const onChange = (path: (string | number)[], value: unknown) => draft && update(setAt(draft, path, value))

  const publish = async () => {
    await flush()
    setPhase('publishing')
    try {
      const s = await adminApi.publishContent(KEY)
      setState(s)
      setDraft(s.draft as Obj)
      setPhase('published')
      refreshSummary()
      window.setTimeout(() => setPhase((p) => (p === 'published' ? 'idle' : p)), 4000)
    } catch (err) {
      setError(onError(err))
      setPhase('idle')
    }
  }

  const discard = async () => {
    window.clearTimeout(saveTimer.current)
    pending.current = null
    try {
      const s = await adminApi.discardContent(KEY)
      setState(s)
      setDraft(s.draft as Obj)
      sendPreview(s.draft as Obj)
      setSelected(0)
      refreshSummary()
    } catch (err) {
      setError(onError(err))
    }
  }

  const items = ((draft?.items as Obj[]) ?? [])
  const published = new Map((((state?.published as Obj)?.items as Obj[]) ?? []).map((x) => [String(x.id), x]))
  const changedIds = items.filter((x) => stable(published.get(String(x.id))) !== stable(x)).map((x) => String(x.id))
  const removed = [...published.keys()].filter((id) => !items.some((x) => String(x.id) === id))
  const introChanged = !!draft && stable(draft.intro) !== stable((state?.published as Obj)?.intro)
  const changeCount = changedIds.length + removed.length + (introChanged ? 1 : 0)
  const issues: FieldIssue[] = state?.issues ?? []
  const dirty = !!state?.dirty || phase === 'saving'
  const current = typeof selected === 'number' ? items[selected] : undefined
  const currentId = current ? String(current.id) : null

  const needle = fold(query.trim())
  const matches = (x: Obj) => !needle || fold(form.searchOf!(x)).includes(needle)

  const per = stats?.perPlugin ?? {}
  const maxLast30 = Math.max(1, ...items.map((x) => per[String(x.id)]?.last30 ?? 0))
  const top = Object.entries(per).sort((a, b) => b[1].last30 - a[1].last30)[0]
  const topName = top && top[1].last30 > 0 ? String(items.find((x) => x.id === top[0])?.name ?? top[0]) : '—'
  const inBeta = items.filter((x) => x.status === 'beta').length

  const addPlugin = () => {
    const next = form.newItem!(items)
    update({ ...draft!, items: [...items, next] })
    setSelected(items.length)
    setView('ficha')
    setQuery('')
  }

  return (
    <>
      <title>Plugins · Panel</title>

      <div className="hf-aplug__head">
        <div>
          <h1 className="hf-admin__title">Plugins</h1>
          <p className="hf-admin__lead">La ficha se publica en la web en /plugins; las versiones guardan el historial y lo que se descarga.</p>
        </div>
        <div className="hf-aplug__actions" data-guide="plugins-publish">
          <button type="button" className="hf-admin__btn hf-admin__btn--sm" aria-pressed={preview} onClick={() => setPreview((p) => !p)}>
            {preview ? 'Ocultar vista previa' : 'Vista previa'}
          </button>
          <button type="button" className="hf-admin__btn hf-admin__btn--ghost hf-admin__btn--sm" disabled={!state?.dirty || phase === 'publishing'} onClick={discard}>
            Descartar
          </button>
          <button type="button" className="hf-admin__btn hf-admin__btn--primary hf-admin__btn--sm" disabled={!dirty || issues.length > 0 || phase === 'publishing'} onClick={publish}>
            {phase === 'publishing' ? 'Publicando…' : dirty ? `Publicar · ${changeCount || 1} ${changeCount === 1 ? 'cambio' : 'cambios'}` : 'Publicado'}
          </button>
        </div>
      </div>
      <p className={`hf-aplug__status ${dirty ? 'is-dirty' : ''}`} role="status">
        {phase === 'published'
          ? 'Publicado · la web ya lo muestra'
          : phase === 'saving'
            ? 'Guardando borrador…'
            : dirty
              ? `Cambios sin publicar${issues.length ? ` · ${issues.length} ${issues.length === 1 ? 'error' : 'errores'}: corrígelos para publicar` : ''}`
              : state?.versionId
                ? 'Todo publicado'
                : 'Contenido inicial (aún no se publica desde el panel)'}
      </p>
      {error && <p className="hf-admin__error" role="alert">{error}</p>}

      {/* K2 · Cifras */}
      <div className="hf-aplug__kpis" data-guide="plugins-kpis">
        <div className="hf-aplug__kpi">
          <span className="hf-aplug__kpi-label">Descargas · 30 días</span>
          <span className="hf-aplug__kpi-value">{stats ? stats.last30 : '—'}</span>
          {stats && <span className="hf-aplug__kpi-sub">{stats.prev30} los 30 anteriores</span>}
        </div>
        <div className="hf-aplug__kpi">
          <span className="hf-aplug__kpi-label">Más descargado</span>
          <span className="hf-aplug__kpi-name">{topName}</span>
          {top && top[1].last30 > 0 && <span className="hf-aplug__kpi-sub">{top[1].last30} en 30 días</span>}
        </div>
        <div className="hf-aplug__kpi">
          <span className="hf-aplug__kpi-label">En beta</span>
          <span className="hf-aplug__kpi-value">{inBeta}</span>
          <span className="hf-aplug__kpi-sub">{inBeta === 1 ? 'plugin' : 'plugins'}</span>
        </div>
        <div className="hf-aplug__kpi">
          <span className="hf-aplug__kpi-label">Visitas a /plugins</span>
          <span className="hf-aplug__kpi-value">{stats?.visits ?? '—'}</span>
          <span className="hf-aplug__kpi-sub">{stats && stats.visits === null ? 'Sin Umami' : 'Umami · 30 días'}</span>
        </div>
      </div>

      {!draft ? (
        <p className="hf-admin__empty" role="status">Cargando…</p>
      ) : (
        <div className="hf-aplug__body">
          {/* K1 · Lista */}
          <nav className="hf-aplug__list" aria-label="Plugins" data-guide="plugins-list">
            <button type="button" className="hf-cadd hf-aplug__add" onClick={addPlugin}>+ Agregar plugin</button>
            <div className="hf-admin__search" role="search">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="7" cy="7" r="5" /><path d="m11 11 3.5 3.5" /></svg>
              <label className="sr-only" htmlFor="plugins-search">Buscar plugin</label>
              <input id="plugins-search" type="search" className="hf-admin__search-input" placeholder={form.searchHint} autoComplete="off" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Escape' && setQuery('')} />
            </div>
            <button type="button" className={`hf-aplug__item hf-aplug__item--general ${selected === 'general' ? 'is-active' : ''}`} aria-current={selected === 'general' || undefined} onClick={() => setSelected('general')}>
              <span className="hf-aplug__item-name">Textos de la página</span>
              <span className="hf-aplug__item-sub">{introChanged ? 'Con cambios sin publicar' : 'Introducción de /plugins'}</span>
            </button>
            {items.map((x, i) => {
              if (!matches(x)) return null
              const id = String(x.id)
              const d = per[id]
              const isDraft = changedIds.includes(id)
              const errors = issues.filter((it) => it.path[0] === 'items' && it.path[1] === i).length
              return (
                <button
                  key={id}
                  type="button"
                  className={`hf-aplug__item ${selected === i ? 'is-active' : ''} ${errors ? 'has-error' : ''}`}
                  aria-current={selected === i || undefined}
                  onClick={() => setSelected(i)}
                >
                  <span className="hf-aplug__item-top">
                    <span className="hf-aplug__item-name">{form.titleOf(x)}</span>
                    <span className={`hf-aplug__chip ${isDraft || x.status === 'available' ? 'is-gold' : ''}`}>{isDraft ? 'Borrador' : statusOf(x)}</span>
                  </span>
                  <span className="hf-aplug__item-sub">
                    {String(x.category || 'Sin tipo')} · {stats?.current[id]?.version ?? 'sin versión'}
                    {errors > 0 && <span className="hf-cfield__error"> · {errors} {errors === 1 ? 'error' : 'errores'}</span>}
                  </span>
                  <span className="hf-aplug__item-bar">
                    <span className="hf-aplug__bar" aria-hidden="true"><span style={{ width: `${((d?.last30 ?? 0) / maxLast30) * 100}%` }} /></span>
                    {d?.last30 ?? 0} descargas
                  </span>
                </button>
              )
            })}
          </nav>

          {/* K3 · Plugin seleccionado: Ficha / Versiones */}
          <section className="hf-aplug__card" aria-label={current ? String(current.name) : 'Textos de la página'} data-guide="plugins-card">
            {selected === 'general' ? (
              <>
                <h2 className="hf-aplug__name">Textos de la página</h2>
                <ContentForm fields={form.general} data={draft} base={[]} issues={issues} onChange={onChange} />
              </>
            ) : current ? (
              <>
                <div className="hf-aplug__card-head">
                  <div>
                    <h2 className="hf-aplug__name">{form.titleOf(current)}</h2>
                    <p className={`hf-aplug__draft ${changedIds.includes(currentId!) ? 'is-dirty' : ''}`}>
                      {changedIds.includes(currentId!) ? (published.has(currentId!) ? '● Cambios sin publicar' : '● Nuevo, sin publicar') : 'Publicado'}
                    </p>
                  </div>
                  <div className="hf-aplug__tabs" role="tablist" aria-label="Vistas del plugin" data-guide="plugins-tabs">
                    <button type="button" role="tab" aria-selected={view === 'ficha'} className="hf-aplug__tab" onClick={() => setView('ficha')}>Ficha</button>
                    <button type="button" role="tab" aria-selected={view === 'versiones'} className="hf-aplug__tab" onClick={() => setView('versiones')}>Versiones</button>
                  </div>
                </div>

                {view === 'ficha' ? (
                  <>
                    <ContentForm fields={form.itemFields} data={draft} base={['items', selected as number]} issues={issues} onChange={onChange} />
                    <div className="hf-aplug__item-actions">
                      <button type="button" className="hf-admin__btn hf-admin__btn--ghost hf-admin__btn--sm" onClick={() => setConfirmDelete(true)}>Eliminar plugin</button>
                      <Link to="/admin/sitio" className="hf-acontent__link">Ocultarlo en Sitio →</Link>
                    </div>
                  </>
                ) : (
                  <Releases key={currentId} pluginId={currentId!} name={String(current.name)} onError={onError} />
                )}
              </>
            ) : (
              <p className="hf-admin__empty">Agrega tu primer plugin.</p>
            )}
          </section>

          {preview && (
            <aside className="hf-aplug__preview" aria-label="Vista previa">
              <span className="hf-acontent__muted">Así se ve en la web · borrador</span>
              <iframe ref={frameRef} src={`${WEB_URL}/plugins?modo=vista`} title="Vista previa de Plugins" className="hf-acontent__frame" />
            </aside>
          )}
        </div>
      )}

      {confirmDelete && current && (
        <div className="hf-asite__modal">
          <button type="button" className="hf-asite__backdrop" aria-label="Cerrar" tabIndex={-1} onClick={() => setConfirmDelete(false)} />
          <div className="hf-asite__confirm" role="dialog" aria-modal="true" aria-labelledby="plugin-delete-title">
            <h2 id="plugin-delete-title" className="hf-asite__confirm-title">
              ¿Eliminar <span className="hf-asite__gold">“{form.titleOf(current)}”?</span>
            </h2>
            <p className="hf-acontent__muted">Desaparece de la web al publicar. Sus versiones y descargas se conservan.</p>
            <Link to="/admin/sitio" className="hf-acontent__link">Mejor ocultarlo en Sitio →</Link>
            <div className="hf-asite__confirm-actions">
              <button type="button" className="hf-admin__btn" onClick={() => setConfirmDelete(false)}>Cancelar</button>
              <button
                type="button"
                className="hf-admin__btn hf-admin__btn--primary"
                onClick={() => {
                  update({ ...draft!, items: items.filter((_, k) => k !== selected) })
                  setSelected(0)
                  setConfirmDelete(false)
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/** K2 · Versiones de un plugin: línea de tiempo y alta de una nueva (instaladores del HDD de medios o https) */
function Releases({ pluginId, name, onError }: { pluginId: string; name: string; onError: (err: unknown) => string }) {
  const [list, setList] = useState<PluginRelease[] | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [nv, setNv] = useState({ version: '', notes: '', macPath: '', winPath: '', current: true })
  const [picking, setPicking] = useState<'macPath' | 'winPath' | null>(null)

  const load = useCallback(() => {
    adminApi.pluginReleases(pluginId).then(setList).catch((err) => setError(onError(err)))
  }, [pluginId, onError])
  useEffect(load, [load])
  useAdminLive(['plugins'], load)

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    setError('')
    try {
      await fn()
      load()
      return true
    } catch (err) {
      setError(onError(err))
      return false
    } finally {
      setBusy(false)
    }
  }

  const save = async () => {
    if (await run(() => adminApi.createPluginRelease(pluginId, nv))) setNv({ version: '', notes: '', macPath: '', winPath: '', current: true })
  }

  const installers = (r: PluginRelease) => [r.macPath && 'macOS', r.winPath && 'Windows'].filter(Boolean).join(' · ') || 'Sin instaladores'

  return (
    <div className="hf-aplug__releases">
      {error && <p className="hf-admin__error" role="alert">{error}</p>}
      <ol className="hf-aplug__timeline" aria-label={`Versiones de ${name}`}>
        {list === null && <li className="hf-acontent__muted">Cargando…</li>}
        {list?.length === 0 && <li className="hf-acontent__muted">Aún no hay versiones. Sin versión actual, la web no ofrece descarga (salvo con link de tienda).</li>}
        {list?.map((r) => (
          <li key={r.id} className={`hf-aplug__release ${r.current ? 'is-current' : ''}`}>
            <span className="hf-aplug__dot" aria-hidden="true" />
            <div className="hf-aplug__release-head">
              <strong>{r.version}</strong>
              <span className="hf-acontent__muted">{formatStamp(r.createdAt)} · {r.createdByName}</span>
            </div>
            {r.notes && <p className="hf-aplug__notes">{r.notes}</p>}
            <p className="hf-aplug__release-meta">
              {r.current && <span className="hf-aplug__current">Actual · se descarga en la web</span>}
              <span>{installers(r)} · {r.downloads} {r.downloads === 1 ? 'descarga' : 'descargas'}</span>
            </p>
            <div className="hf-aplug__release-actions">
              {!r.current && (
                <button type="button" className="hf-admin__btn hf-admin__btn--sm" disabled={busy} onClick={() => run(() => adminApi.updatePluginRelease(r.id, { current: true }))}>
                  Marcar como actual
                </button>
              )}
              {confirmId === r.id ? (
                <>
                  <button type="button" className="hf-admin__btn hf-admin__btn--primary hf-admin__btn--sm" disabled={busy} onClick={() => run(() => adminApi.deletePluginRelease(r.id)).then(() => setConfirmId(null))}>
                    Sí, eliminar {r.version}
                  </button>
                  <button type="button" className="hf-admin__btn hf-admin__btn--ghost hf-admin__btn--sm" onClick={() => setConfirmId(null)}>Cancelar</button>
                </>
              ) : (
                <button type="button" className="hf-admin__btn hf-admin__btn--ghost hf-admin__btn--sm" onClick={() => setConfirmId(r.id)}>Eliminar</button>
              )}
            </div>
          </li>
        ))}
      </ol>

      <form
        className="hf-aplug__new"
        onSubmit={(e) => {
          e.preventDefault()
          void save()
        }}
      >
        <p className="hf-aplug__new-title">Nueva versión</p>
        <div className="hf-cform">
          <label className="hf-cfield" htmlFor="release-version">
            <span className="hf-cfield__label">Número</span>
            <input id="release-version" className="hf-cinput" required maxLength={30} placeholder="1.3.0" value={nv.version} onChange={(e) => setNv({ ...nv, version: e.target.value })} />
          </label>
          <label className="hf-cfield hf-cfield--check">
            <input type="checkbox" checked={nv.current} onChange={(e) => setNv({ ...nv, current: e.target.checked })} />
            Marcar como actual (la que se descarga)
          </label>
          <label className="hf-cfield hf-cfield--wide" htmlFor="release-notes">
            <span className="hf-cfield__label">Notas</span>
            <textarea id="release-notes" className="hf-cinput hf-cinput--area" maxLength={2000} placeholder="Qué cambió…" value={nv.notes} onChange={(e) => setNv({ ...nv, notes: e.target.value })} />
          </label>
          {(['macPath', 'winPath'] as const).map((k) => (
            <label key={k} className="hf-cfield hf-cfield--wide" htmlFor={`release-${k}`}>
              <span className="hf-cfield__label">Instalador · {k === 'macPath' ? 'macOS' : 'Windows'}</span>
              <span className="hf-cmedia__row">
                <input id={`release-${k}`} className="hf-cinput" placeholder="/media/plugins/… o https://…" value={nv[k]} onChange={(e) => setNv({ ...nv, [k]: e.target.value })} />
                <button type="button" className="hf-admin__btn hf-admin__btn--sm hf-cmedia__browse" onClick={() => setPicking(k)}>Buscar archivo</button>
              </span>
            </label>
          ))}
        </div>
        <button type="submit" className="hf-admin__btn hf-admin__btn--primary hf-admin__btn--sm" disabled={busy || !nv.version.trim()}>
          {nv.current ? 'Guardar y marcar como actual' : 'Guardar versión'}
        </button>
      </form>

      {picking && (
        <MediaPicker
          accept="file"
          current={nv[picking]}
          onClose={() => setPicking(null)}
          onPick={(path) => {
            setNv({ ...nv, [picking]: path })
            setPicking(null)
          }}
        />
      )}
    </div>
  )
}
