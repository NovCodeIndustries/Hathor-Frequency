import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { contentSections, type ContentKey } from '../../data/content'
import { adminApi, formatStamp, type ContentState, type ContentVersionInfo, type FieldIssue } from '../../lib/adminApi'
import { WEB_ORIGIN, WEB_URL } from '../../lib/origins'
import type { PreviewMessage } from '../../lib/content'
import { useAdmin } from '../../lib/useAdmin'
import { ContentForm } from './ContentForm'
import { sectionForms, setAt, type ItemsForm } from './contentForms'
import './AdminContent.css'
import { useAdminLive } from '../../lib/useAdminLive'

type Obj = Record<string, unknown>
type Phase = 'idle' | 'saving' | 'publishing' | 'published'

const isKey = (k: string | null): k is ContentKey => contentSections.some((s) => s.key === k)
const PREVIEW_KEY = 'hf-content-preview'
const withPreview = (path: string) => `${WEB_URL}${path}${path.includes('?') ? '&' : '?'}modo=vista`

/**
 * Panel · Contenido (diseño C1 + vista previa C2 + F1–F6, canvas https://claude.ai/artifact/1m6tKaTUujXp6FNuj1q4fL):
 * cada sección con su lista y formulario, borrador que se guarda solo y Publicar por sección.
 */
export function AdminContent() {
  const [params, setParams] = useSearchParams()
  const key: ContentKey = isKey(params.get('seccion')) ? (params.get('seccion') as ContentKey) : 'paquetes'
  // Una instancia por sección: al cambiar de pestaña el editor arranca limpio
  return <SectionEditor key={key} sectionKey={key} onSection={(k) => setParams({ seccion: k })} />
}

function SectionEditor({ sectionKey: key, onSection }: { sectionKey: ContentKey; onSection: (k: ContentKey) => void }) {
  const { refreshSummary, onError } = useAdmin()
  const section = contentSections.find((s) => s.key === key)!
  const form = sectionForms[key]

  const [state, setState] = useState<ContentState | null>(null)
  const [draft, setDraft] = useState<Obj | null>(null)
  const [selected, setSelected] = useState<number | string>(() =>
    form.type === 'groups' ? form.groups[0].id : form.general.length ? 'general' : 0,
  )
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState('')
  const [dirtyKeys, setDirtyKeys] = useState<string[]>([])
  const [panel, setPanel] = useState<'history' | null>(null)
  const [history, setHistory] = useState<ContentVersionInfo[] | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  // Buscador de la lista (Artistas): filtra por nombre, género o código, sin acentos
  const [query, setQuery] = useState('')
  // Vista previa abierta por defecto; si la cierras, se recuerda en este navegador
  const [preview, setPreviewState] = useState(() => {
    try {
      return localStorage.getItem(PREVIEW_KEY) !== 'off'
    } catch {
      return true
    }
  })
  const setPreview = (fn: (p: boolean) => boolean) =>
    setPreviewState((p) => {
      const next = fn(p)
      try {
        localStorage.setItem(PREVIEW_KEY, next ? 'on' : 'off')
      } catch {
        // sin almacenamiento: solo dura esta visita
      }
      return next
    })
  const frameRef = useRef<HTMLIFrameElement>(null)
  const saveTimer = useRef<number | undefined>(undefined)
  const pending = useRef<{ key: ContentKey; data: Obj } | null>(null)

  const loadDirty = useCallback(() => {
    adminApi.contentDirty().then((r) => setDirtyKeys(r.dirty)).catch(() => {})
  }, [])
  // Otra pestaña guardó o publicó: se actualizan los puntos de las pestañas (el borrador que editas no se toca)
  useAdminLive(['content'], loadDirty)

  // Al cambiar de sección: cargar su estado
  useEffect(() => {
    let alive = true
    adminApi
      .content(key)
      .then((s) => {
        if (!alive) return
        setState(s)
        setDraft(s.draft as Obj)
      })
      .catch((err) => setError(onError(err)))
    loadDirty()
    return () => {
      alive = false
    }
  }, [key, onError, loadDirty])

  // Vista previa (C2): manda el borrador al iframe
  const sendPreview = useCallback(
    (data: Obj | null) => {
      if (!data) return
      frameRef.current?.contentWindow?.postMessage({ type: 'hf-preview-draft', key, data } satisfies PreviewMessage, WEB_ORIGIN)
    },
    [key],
  )
  useEffect(() => {
    const onMessage = (e: MessageEvent<PreviewMessage>) => {
      if (e.origin !== WEB_ORIGIN || e.source !== frameRef.current?.contentWindow) return
      if (e.data?.type === 'hf-preview-ready') sendPreview(draft)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [draft, sendPreview])

  // Guardado del borrador (se guarda solo, aunque tenga errores)
  const flush = useCallback(async () => {
    window.clearTimeout(saveTimer.current)
    const job = pending.current
    if (!job) return
    pending.current = null
    try {
      const s = await adminApi.saveContentDraft(job.key, job.data)
      if (job.key === key) setState(s)
      setPhase('idle')
      loadDirty()
      refreshSummary()
    } catch (err) {
      setError(onError(err))
      setPhase('idle')
    }
  }, [key, loadDirty, refreshSummary, onError])

  // Guardar lo pendiente al salir de la sección o de la pantalla
  useEffect(() => () => void flush(), [flush])

  const update = (next: Obj) => {
    setDraft(next)
    sendPreview(next)
    setPhase('saving')
    setError('')
    pending.current = { key, data: next }
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => void flush(), 600)
  }

  const onChange = (path: (string | number)[], value: unknown) => {
    if (!draft) return
    let next = setAt(draft, path, value)
    if (form.type === 'items' && path.length === 1 && path[0] === 'items' && form.normalize) next = { ...next, items: form.normalize(next.items as Obj[]) }
    update(next)
  }

  const items = form.type === 'items' && draft ? ((draft.items as Obj[]) ?? []) : []
  const setItems = (list: Obj[]) => onChange(['items'], list)
  const needle = fold(query.trim())
  const searching = form.type === 'items' && !!form.searchOf && needle.length > 0
  const matches = searching && form.type === 'items' ? items.flatMap((it, i) => (fold(form.searchOf!(it)).includes(needle) ? [i] : [])) : []

  const publish = async () => {
    await flush()
    setPhase('publishing')
    try {
      const s = await adminApi.publishContent(key)
      setState(s)
      setDraft(s.draft as Obj)
      setPhase('published')
      setHistory(null)
      loadDirty()
      refreshSummary()
      window.setTimeout(() => setPhase((p) => (p === 'published' ? 'idle' : p)), 4000)
    } catch (err) {
      setError(onError(err))
      setPhase('idle')
    }
  }

  const replace = async (fn: () => Promise<ContentState>) => {
    window.clearTimeout(saveTimer.current)
    pending.current = null
    try {
      const s = await fn()
      setState(s)
      setDraft(s.draft as Obj)
      sendPreview(s.draft as Obj)
      setPanel(null)
      loadDirty()
      refreshSummary()
    } catch (err) {
      setError(onError(err))
    }
  }

  const openHistory = () => {
    setPanel(panel === 'history' ? null : 'history')
    adminApi.contentHistory(key).then(setHistory).catch((err) => setError(onError(err)))
  }

  const issues: FieldIssue[] = state?.issues ?? []
  const dirty = !!state?.dirty || phase === 'saving'
  const changesInOther = dirtyKeys.filter((k) => k !== key)

  return (
    <>
      <title>Contenido · Panel</title>

      <div className="hf-acontent__head">
        <h1 className="hf-admin__title">Contenido</h1>
        <div className="hf-acontent__tabs" role="tablist" aria-label="Sección">
          {contentSections.map((s) => {
            const has = s.key === key ? dirty : dirtyKeys.includes(s.key)
            return (
              <button
                key={s.key}
                type="button"
                role="tab"
                aria-selected={s.key === key}
                className="hf-acontent__tab"
                onClick={() => {
                  void flush()
                  onSection(s.key)
                }}
              >
                {s.label}
                {has && <span className="hf-acontent__dot" aria-label="con cambios sin publicar" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* F5 · Barra de la sección */}
      <div className={`hf-acontent__bar ${dirty || phase === 'published' ? 'is-active' : ''}`}>
        <span className="hf-acontent__status" role="status">
          {phase === 'publishing'
            ? 'Publicando…'
            : phase === 'published'
              ? `${section.label} · publicado · la web ya lo muestra`
              : phase === 'saving'
                ? `${section.label} · guardando borrador…`
                : dirty
                  ? `${section.label} · cambios sin publicar${issues.length ? ` · ${issues.length} ${issues.length === 1 ? 'error' : 'errores'}: no se puede publicar` : ''}`
                  : `${section.label} · ${state?.versionId ? 'publicado' : 'contenido inicial (aún no se publica desde el panel)'}`}
        </span>
        <div className="hf-acontent__actions">
          <button type="button" className="hf-admin__btn hf-admin__btn--ghost hf-admin__btn--sm" aria-expanded={panel === 'history'} onClick={openHistory}>Historial</button>
          <button type="button" className="hf-admin__btn hf-admin__btn--sm" disabled={!state?.dirty || phase === 'publishing'} onClick={() => replace(() => adminApi.discardContent(key))}>Descartar</button>
          <button type="button" className="hf-admin__btn hf-admin__btn--primary hf-admin__btn--sm" disabled={!dirty || issues.length > 0 || phase === 'publishing'} onClick={publish}>
            Publicar {section.label}
          </button>
        </div>
      </div>
      {changesInOther.length > 0 && (
        <p className="hf-admin__lead hf-acontent__other">
          También con cambios sin publicar: {changesInOther.map((k) => contentSections.find((s) => s.key === k)?.label).join(', ')}.
        </p>
      )}
      {error && <p className="hf-admin__error" role="alert">{error}</p>}

      {/* F6 · Historial */}
      {panel === 'history' && (
        <section className="hf-acontent__history" aria-label="Historial">
          {history === null && <p className="hf-asite__muted">Cargando…</p>}
          {history?.map((h) => (
            <div key={h.id} className="hf-acontent__version">
              <span>
                <span>{formatStamp(h.publishedAt)} · {h.publishedByName}</span>
                <span className="hf-acontent__muted">{h.summary}</span>
              </span>
              {h.current ? <span className="hf-acontent__current">Publicada</span> : (
                <button type="button" className="hf-admin__btn hf-admin__btn--sm" onClick={() => replace(() => adminApi.restoreContent(key, h.id))}>Restaurar</button>
              )}
            </div>
          ))}
          <div className="hf-acontent__version">
            <span>
              <span>Contenido inicial</span>
              <span className="hf-acontent__muted">Lo que venía en el código</span>
            </span>
            {state?.versionId ? (
              <button type="button" className="hf-admin__btn hf-admin__btn--sm" onClick={() => replace(() => adminApi.restoreContent(key, 'inicial'))}>Restaurar</button>
            ) : (
              <span className="hf-acontent__current">Publicada</span>
            )}
          </div>
          <p className="hf-acontent__muted">Restaurar copia esa versión al borrador; revísala y publica.</p>
        </section>
      )}

      {!draft ? (
        <p className="hf-admin__empty" role="status">Cargando…</p>
      ) : (
        <div className={`hf-acontent__body ${preview ? 'has-preview' : ''}`}>
          {/* C1 · Lista */}
          <nav className="hf-acontent__list" aria-label={form.type === 'items' ? `${section.label}: elementos` : `${section.label}: grupos`}>
            {form.type === 'items' ? (
              <>
                {form.general.length > 0 && (
                  <ListRow active={selected === 'general'} title="General" sub="Textos de la sección" onPick={() => setSelected('general')} />
                )}
                {form.searchOf && (
                  <div className="hf-admin__search" role="search">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="7" cy="7" r="5" /><path d="m11 11 3.5 3.5" /></svg>
                    <label className="sr-only" htmlFor={`${key}-search`}>Buscar {form.itemLabel}</label>
                    <input
                      id={`${key}-search`}
                      type="search"
                      className="hf-admin__search-input"
                      placeholder={form.searchHint ?? `Buscar ${form.itemLabel}`}
                      autoComplete="off"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Escape' && setQuery('')}
                    />
                    {query && (
                      <button type="button" className="hf-admin__search-clear" aria-label="Borrar búsqueda" onClick={() => setQuery('')}>
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
                      </button>
                    )}
                  </div>
                )}
                {searching && (
                  <p className="hf-acontent__search-count" role="status">
                    {matches.length ? `${matches.length} de ${items.length}` : `Sin resultados para “${query.trim()}”.`}
                  </p>
                )}
                {items.map((it, i) => (searching && !matches.includes(i) ? null : (
                  <ListRow
                    key={String(it.id ?? it.code ?? i)}
                    active={selected === i}
                    title={form.titleOf(it)}
                    sub={form.subOf(it)}
                    errors={issues.filter((x) => x.path[0] === 'items' && x.path[1] === i).length}
                    onPick={() => setSelected(i)}
                    // Buscando no se ordena: los vecinos de la lista completa no se ven
                    onUp={!searching && i > 0 ? () => (setItems(swap(items, i, i - 1)), setSelected(i - 1)) : undefined}
                    onDown={!searching && i < items.length - 1 ? () => (setItems(swap(items, i, i + 1)), setSelected(i + 1)) : undefined}
                  />
                )))}
                {form.canAdd && form.newItem && (
                  <button
                    type="button"
                    className="hf-cadd hf-acontent__add"
                    onClick={() => {
                      setItems([...items, form.newItem!(items)])
                      setSelected(items.length)
                      setQuery('')
                    }}
                  >
                    + Agregar {form.itemLabel}
                  </button>
                )}
              </>
            ) : (
              form.groups.map((g) => (
                <ListRow
                  key={g.id}
                  active={selected === g.id}
                  title={g.label}
                  errors={issues.filter((x) => g.fields.some((f) => f.key.split('.')[0] === String(x.path[0]))).length}
                  onPick={() => setSelected(g.id)}
                />
              ))
            )}
          </nav>

          {/* C1 · Formulario */}
          <section className="hf-acontent__form" aria-label="Editar">
            <div className="hf-acontent__form-head">
              <h2 className="hf-acontent__form-title">{formTitle(form, selected, items, section.label)}</h2>
              <div className="hf-acontent__form-tools">
                <button type="button" className="hf-admin__btn hf-admin__btn--sm" aria-pressed={preview} onClick={() => setPreview((p) => !p)}>
                  {preview ? 'Ocultar vista previa' : 'Vista previa'}
                </button>
                <Link to="/admin/sitio" className="hf-acontent__link">Ver en Sitio →</Link>
              </div>
            </div>

            {form.type === 'items' && selected === 'general' && (
              <ContentForm fields={form.general} data={draft} base={[]} issues={issues} onChange={onChange} />
            )}
            {form.type === 'items' && typeof selected === 'number' && items[selected] && (
              <>
                <ContentForm fields={form.itemFields} data={draft} base={['items', selected]} issues={issues} onChange={onChange} />
                <div className="hf-acontent__item-actions">
                  {form.canAdd && (
                    <button type="button" className="hf-admin__btn hf-admin__btn--sm" onClick={() => {
                      setItems([...items.slice(0, selected + 1), duplicate(form, items, selected), ...items.slice(selected + 1)])
                      setSelected(selected + 1)
                    }}>Duplicar</button>
                  )}
                  {form.canAdd && (
                    <button type="button" className="hf-admin__btn hf-admin__btn--ghost hf-admin__btn--sm" onClick={() => setConfirmDelete(selected)}>
                      Eliminar {form.itemLabel}
                    </button>
                  )}
                </div>
              </>
            )}
            {form.type === 'groups' && (
              <ContentForm fields={form.groups.find((g) => g.id === selected)?.fields ?? []} data={draft} base={[]} issues={issues} onChange={onChange} />
            )}
          </section>

          {/* C2 · Vista previa en vivo */}
          {preview && (
            <aside className="hf-acontent__preview" aria-label="Vista previa">
              <span className="hf-acontent__muted">Así se ve en la web · borrador</span>
              <iframe ref={frameRef} key={key} src={withPreview(section.preview)} title={`Vista previa de ${section.label}`} className="hf-acontent__frame" />
            </aside>
          )}
        </div>
      )}

      {/* F4 · Eliminar */}
      {confirmDelete !== null && form.type === 'items' && items[confirmDelete] && (
        <div className="hf-asite__modal">
          <button type="button" className="hf-asite__backdrop" aria-label="Cerrar" tabIndex={-1} onClick={() => setConfirmDelete(null)} />
          <div className="hf-asite__confirm" role="dialog" aria-modal="true" aria-labelledby="content-delete-title">
            <h2 id="content-delete-title" className="hf-asite__confirm-title">
              ¿Eliminar <span className="hf-asite__gold">“{form.titleOf(items[confirmDelete])}”?</span>
            </h2>
            <p className="hf-acontent__muted">Desaparece de la web al publicar {section.label}. Puedes recuperarlo desde el Historial.</p>
            {form.moduleOf && <Link to="/admin/sitio" className="hf-acontent__link">Mejor ocultarlo en Sitio →</Link>}
            <div className="hf-asite__confirm-actions">
              <button type="button" className="hf-admin__btn" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button
                type="button"
                className="hf-admin__btn hf-admin__btn--primary"
                onClick={() => {
                  setItems(items.filter((_, k) => k !== confirmDelete))
                  setSelected(form.general.length ? 'general' : 0)
                  setConfirmDelete(null)
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

function swap<T>(list: T[], a: number, b: number): T[] {
  const next = list.slice()
  ;[next[a], next[b]] = [next[b], next[a]]
  return next
}

/** Copia de un elemento con id (o código de artista) nuevo y "(copia)" en el nombre */
/** Minúsculas y sin acentos, para buscar "Sofia" y encontrar "Sofía" */
const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

function duplicate(form: ItemsForm, items: Obj[], i: number): Obj {
  const fresh = form.newItem!(items)
  const copy: Obj = { ...items[i] }
  if ('id' in fresh) copy.id = fresh.id
  if ('code' in fresh) copy.code = fresh.code
  for (const k of ['name', 'q']) if (typeof copy[k] === 'string' && copy[k]) copy[k] = `${copy[k]} (copia)`
  return copy
}

function formTitle(form: (typeof sectionForms)[ContentKey], selected: number | string, items: Obj[], label: string): string {
  if (form.type === 'groups') return form.groups.find((g) => g.id === selected)?.label ?? label
  if (selected === 'general') return `${label} · General`
  const it = items[selected as number]
  return it ? `${form.itemLabel[0].toUpperCase()}${form.itemLabel.slice(1)} · ${form.titleOf(it)}` : label
}

function ListRow({ active, title, sub, errors = 0, onPick, onUp, onDown }: { active: boolean; title: string; sub?: string; errors?: number; onPick: () => void; onUp?: () => void; onDown?: () => void }) {
  return (
    <div className={`hf-acontent__row ${active ? 'is-active' : ''} ${errors ? 'has-error' : ''}`}>
      <button type="button" className="hf-acontent__row-main" aria-current={active || undefined} onClick={onPick}>
        <span className="hf-acontent__row-title">{title}</span>
        {(sub || errors > 0) && (
          <span className="hf-acontent__row-sub">
            {sub}
            {errors > 0 && <span className="hf-cfield__error"> · {errors} {errors === 1 ? 'error' : 'errores'}</span>}
          </span>
        )}
      </button>
      {(onUp || onDown) && (
        <span className="hf-acontent__row-move">
          <button type="button" className="hf-cicon" aria-label={`Subir ${title}`} disabled={!onUp} onClick={onUp}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m4 10 4-4 4 4" /></svg>
          </button>
          <button type="button" className="hf-cicon" aria-label={`Bajar ${title}`} disabled={!onDown} onClick={onDown}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
          </button>
        </span>
      )}
    </div>
  )
}
