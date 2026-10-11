import { useEffect, useId, useState, type ReactNode } from 'react'
import { adminApi, type FieldIssue } from '../../lib/adminApi'
import { getAt, keyPath, type Field } from './contentForms'

type Path = (string | number)[]

interface FormProps {
  fields: Field[]
  /** Objeto raíz de la sección (el borrador completo) */
  data: unknown
  /** Ruta del objeto que editan estos campos dentro de `data` */
  base: Path
  issues: FieldIssue[]
  onChange: (path: Path, value: unknown) => void
}

const samePath = (a: Path, b: Path) => a.length === b.length && a.every((k, i) => String(k) === String(b[i]))
const within = (inner: Path, outer: Path) => outer.every((k, i) => String(k) === String(inner[i]))

/** Mensaje de error de una ruta exacta (F3) */
const issueAt = (issues: FieldIssue[], path: Path) => issues.find((i) => samePath(i.path, path))?.message

/** Campos de un objeto (diseño C1 + F1–F3) */
export function ContentForm({ fields, data, base, issues, onChange }: FormProps) {
  return (
    <div className="hf-cform">
      {fields.map((f) => (
        <FieldView key={f.key} field={f} data={data} path={[...base, ...keyPath(f.key)]} issues={issues} onChange={onChange} />
      ))}
    </div>
  )
}

function FieldView({ field, data, path, issues, onChange }: { field: Field; data: unknown; path: Path; issues: FieldIssue[]; onChange: FormProps['onChange'] }) {
  const id = useId()
  const value = getAt(data, path)
  const error = issueAt(issues, path)
  const wide = field.kind === 'textarea' || field.kind === 'lines' || field.kind === 'list' || ('wide' in field && field.wide)
  const cls = `hf-cfield ${wide ? 'hf-cfield--wide' : ''} ${error ? 'has-error' : ''}`
  const label = (
    <span className="hf-cfield__label">
      {field.label}
      {(field.kind === 'text' || field.kind === 'textarea') && field.max && typeof value === 'string' && value.length > field.max * 0.8 && (
        <span className="hf-cfield__count"> · {value.length}/{field.max}</span>
      )}
    </span>
  )
  const help = error ? <span className="hf-cfield__error">{error}</span> : 'hint' in field && field.hint ? <span className="hf-cfield__hint">{field.hint}</span> : null

  switch (field.kind) {
    case 'text':
    case 'url':
      return (
        <label className={cls} htmlFor={id}>
          {label}
          <input id={id} className="hf-cinput" type={field.kind === 'url' ? 'url' : 'text'} value={String(value ?? '')} placeholder={field.placeholder} onChange={(e) => onChange(path, e.target.value)} />
          {help}
        </label>
      )
    case 'textarea':
      return (
        <label className={cls} htmlFor={id}>
          {label}
          <textarea id={id} className="hf-cinput hf-cinput--area" value={String(value ?? '')} placeholder={field.placeholder} onChange={(e) => onChange(path, e.target.value)} />
          {help}
        </label>
      )
    case 'money': {
      // Se guarda como texto con "$" ("$4,500"); vacío = sin precio
      const shown = String(value ?? '').replace(/^\$/, '').replace(/^\[PRECIO\]$/, '')
      return (
        <label className={cls} htmlFor={id}>
          {label}
          <span className="hf-cmoney">
            <span aria-hidden="true">$</span>
            <input id={id} inputMode="decimal" value={shown} placeholder="Sin precio" onChange={(e) => onChange(path, e.target.value.trim() ? `$${e.target.value.trim()}` : '')} />
          </span>
          {help}
        </label>
      )
    }
    case 'number':
      return (
        <label className={cls} htmlFor={id}>
          {label}
          <input
            id={id}
            className="hf-cinput"
            type="number"
            step={field.step ?? 1}
            value={value == null ? '' : String(value)}
            placeholder={field.nullable ? 'Sin valor' : undefined}
            onChange={(e) => onChange(path, e.target.value === '' ? (field.nullable ? null : 0) : Number(e.target.value))}
          />
          {help}
        </label>
      )
    case 'checkbox':
      return (
        <label className={`${cls} hf-cfield--check`}>
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(path, e.target.checked)} />
          {field.label}
        </label>
      )
    case 'select':
      return (
        <label className={cls} htmlFor={id}>
          {label}
          <select id={id} className="hf-cinput" value={String(value ?? '')} onChange={(e) => onChange(path, e.target.value)}>
            {field.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {help}
        </label>
      )
    case 'media':
      return <MediaField id={id} cls={cls} label={label} help={help} value={String(value ?? '')} accept={field.accept} onChange={(v) => onChange(path, v)} />
    case 'lines':
      return <LinesField field={field} cls={cls} value={(value as string[]) ?? []} path={path} issues={issues} onChange={onChange} />
    case 'list':
      return <ListField field={field} cls={cls} data={data} value={(value as Record<string, unknown>[]) ?? []} path={path} issues={issues} onChange={onChange} />
  }
}

// ── Botones pequeños ──

function IconBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button type="button" className="hf-cicon" aria-label={label} title={label} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  )
}
const Up = () => <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m4 10 4-4 4 4" /></svg>
const Down = () => <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
const X = () => <svg width="12" height="12" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" /></svg>

const move = <T,>(list: T[], i: number, d: number) => {
  const j = i + d
  if (j < 0 || j >= list.length) return list
  const next = list.slice()
  ;[next[i], next[j]] = [next[j], next[i]]
  return next
}

// ── F2 · Lista de líneas ──

function LinesField({ field, cls, value, path, issues, onChange }: { field: Extract<Field, { kind: 'lines' }>; cls: string; value: string[]; path: Path; issues: FieldIssue[]; onChange: FormProps['onChange'] }) {
  return (
    <fieldset className={cls}>
      <legend className="hf-cfield__label">{field.label}</legend>
      <div className="hf-clines">
        {value.map((line, i) => {
          const err = issueAt(issues, [...path, i])
          return (
            <div key={i} className={`hf-cline ${err ? 'has-error' : ''}`}>
              <span className="hf-cline__n">{i + 1}</span>
              <input className="hf-cinput" value={line} placeholder={field.placeholder} aria-label={`${field.itemLabel} ${i + 1}`} onChange={(e) => onChange([...path, i], e.target.value)} />
              <IconBtn label={`Subir ${field.itemLabel} ${i + 1}`} disabled={i === 0} onClick={() => onChange(path, move(value, i, -1))}><Up /></IconBtn>
              <IconBtn label={`Quitar ${field.itemLabel} ${i + 1}`} onClick={() => onChange(path, value.filter((_, k) => k !== i))}><X /></IconBtn>
              {err && <span className="hf-cfield__error hf-cline__err">{err}</span>}
            </div>
          )
        })}
        <button type="button" className="hf-cadd" onClick={() => onChange(path, [...value, ''])}>+ Agregar {field.itemLabel}</button>
      </div>
    </fieldset>
  )
}

// ── F2 · Lista de objetos (redes, fotos, espacios…) ──

function ListField({ field, cls, data, value, path, issues, onChange }: { field: Extract<Field, { kind: 'list' }>; cls: string; data: unknown; value: Record<string, unknown>[]; path: Path; issues: FieldIssue[]; onChange: FormProps['onChange'] }) {
  const [open, setOpen] = useState<number | null>(value.length <= 3 ? -1 : null)
  return (
    <fieldset className={cls}>
      <legend className="hf-cfield__label">{field.label} · {value.length}</legend>
      <div className="hf-clist">
        {value.map((item, i) => {
          const expanded = open === -1 || open === i
          const errs = issues.filter((x) => within(x.path, [...path, i])).length
          return (
            <div key={i} className={`hf-clist__item ${errs ? 'has-error' : ''}`}>
              <div className="hf-clist__head">
                <button type="button" className="hf-clist__title" aria-expanded={expanded} onClick={() => setOpen(expanded ? null : i)}>
                  <span className="hf-cline__n">{i + 1}</span>
                  {field.titleOf(item) || `${field.itemLabel} ${i + 1}`}
                  {errs > 0 && <span className="hf-cfield__error"> · {errs} {errs === 1 ? 'error' : 'errores'}</span>}
                </button>
                <IconBtn label={`Subir ${field.itemLabel} ${i + 1}`} disabled={i === 0} onClick={() => onChange(path, move(value, i, -1))}><Up /></IconBtn>
                <IconBtn label={`Bajar ${field.itemLabel} ${i + 1}`} disabled={i === value.length - 1} onClick={() => onChange(path, move(value, i, 1))}><Down /></IconBtn>
                <IconBtn label={`Quitar ${field.itemLabel} ${i + 1}`} onClick={() => onChange(path, value.filter((_, k) => k !== i))}><X /></IconBtn>
              </div>
              {expanded && <ContentForm fields={field.fields} data={data} base={[...path, i]} issues={issues} onChange={onChange} />}
            </div>
          )
        })}
        <button
          type="button"
          className="hf-cadd"
          onClick={() => {
            onChange(path, [...value, field.newItem()])
            setOpen(value.length)
          }}
        >
          + Agregar {field.itemLabel}
        </button>
      </div>
    </fieldset>
  )
}

// ── F1 · Medio por ruta o URL ──

const IMG = /\.(jpe?g|png|webp|gif|avif)$/i
const VID = /\.(mp4|webm|mov)$/i

function MediaField({ id, cls, label, help, value, accept, onChange }: { id: string; cls: string; label: ReactNode; help: ReactNode; value: string; accept: 'image' | 'video'; onChange: (v: string) => void }) {
  const v = value.trim()
  const isMedia = v.startsWith('/media/')
  const isUrl = /^https:\/\/\S+$/.test(v)
  const [check, setCheck] = useState<{ path: string; exists: boolean | null } | null>(null)

  // ¿Existe en el HDD? (con una pausa para no preguntar en cada tecla)
  useEffect(() => {
    if (!isMedia) return
    const t = window.setTimeout(() => {
      adminApi.mediaCheck(v).then(setCheck).catch(() => setCheck({ path: v, exists: null }))
    }, 400)
    return () => window.clearTimeout(t)
  }, [v, isMedia])

  const state = check?.path === v ? check.exists : undefined
  const bad = (!!v && !isMedia && !isUrl) || (isMedia && state === false)
  const msg = !v
    ? accept === 'image'
      ? 'Sin imagen: se muestra el marcador.'
      : 'Sin video: se muestra el marcador.'
    : isMedia
      ? state === true
        ? 'Encontrada en el HDD de medios.'
        : state === false
          ? 'No existe en el HDD. Revisa la ruta.'
          : state === null
            ? 'Carpeta de medios sin configurar (MEDIA_DIR): no se puede revisar.'
            : 'Revisando…'
      : isUrl
        ? 'URL externa: se usa tal cual (no se revisa).'
        : 'Debe empezar con /media/ o https://'

  const showImg = !!v && (isMedia || isUrl) && accept === 'image' && (IMG.test(v) || isUrl) && state !== false
  const showVid = !!v && isMedia && accept === 'video' && VID.test(v) && state !== false

  return (
    <label className={`${cls} ${bad ? 'has-error' : ''}`} htmlFor={id}>
      {label}
      <input id={id} className="hf-cinput" value={value} placeholder={accept === 'image' ? '/media/artistas/ralo/01.jpg' : 'https://www.youtube-nocookie.com/embed/…'} onChange={(e) => onChange(e.target.value)} />
      <span className="hf-cmedia">
        <span className={`hf-cmedia__thumb ${showImg || showVid ? 'has-media' : ''}`}>
          {showImg ? <img src={v} alt="" loading="lazy" /> : showVid ? <video src={v} muted preload="metadata" /> : <span>{v ? 'Sin vista previa' : 'Marcador'}</span>}
        </span>
        <span className={bad ? 'hf-cfield__error' : 'hf-cfield__hint'}>{msg}</span>
      </span>
      {help}
    </label>
  )
}
