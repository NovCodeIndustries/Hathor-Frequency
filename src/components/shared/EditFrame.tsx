import type { ReactNode } from 'react'
import { moduleById } from '../../data/modules'
import { useEditState, type EditState } from '../../lib/siteModules'
import './EditFrame.css'
import { contentItemLabel } from '../../lib/content'

/** Switch dorado del modo edición (diseño S1 · E) */
export function EditSwitch({ state, label, small = false }: { state: EditState; label: string; small?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={state.selfOn}
      aria-label={`${label}: ${state.selfOn ? 'visible' : 'oculto'}`}
      className={`hf-edit-switch ${small ? 'hf-edit-switch--sm' : ''}`}
      onClick={(e) => {
        // Las filas y tarjetas son botones o links: el switch no debe abrirlas
        e.preventDefault()
        e.stopPropagation()
        state.toggle()
      }}
    >
      <span />
    </button>
  )
}

const labelOf = (id: string) => contentItemLabel(id) ?? moduleById.get(id)?.label ?? id

/** Por qué está oculto: él mismo o un padre ("Oculto por Vista Paquetes") */
const hiddenText = (state: EditState) => (!state.selfOn || !state.offBy ? 'Oculto' : `Oculto por ${state.offBy}`)

/**
 * Sección en modo edición (S1): marco punteado dorado, su nombre arriba a la izquierda y el switch a la derecha.
 * Apagada (H2): conserva su tamaño, al 35% con trama y la etiqueta "Oculto".
 */
export function EditFrame({ id, state, children }: { id: string; state: EditState; children: ReactNode }) {
  const label = labelOf(id)
  return (
    <div className={`hf-edit ${state.on ? '' : 'is-off'}`} data-module={id}>
      <div className="hf-edit__bar">
        <span className="hf-edit__tag">{label}</span>
        <EditSwitch state={state} label={label} />
      </div>
      <div className="hf-edit__content" inert={!state.on || undefined}>{children}</div>
      {!state.on && <span className="hf-edit__hidden">{hiddenText(state)}</span>}
    </div>
  )
}

/** Elemento de una lista en modo edición (L): switch pequeño en la esquina y atenuado si está oculto */
export function EditItem({ id, children }: { id: string; children: ReactNode }) {
  const state = useEditState(id)
  if (!state) return <>{children}</>
  return (
    <div className={`hf-edit-item ${state.on ? '' : 'is-off'}`} data-module={id}>
      {children}
      <span className="hf-edit-item__switch">
        <EditSwitch state={state} label={labelOf(id)} small />
      </span>
      {!state.on && <span className="hf-edit-item__hidden">{hiddenText(state)}</span>}
    </div>
  )
}

/** Switch flotante con nombre, para módulos que no se pueden enmarcar (fondos) */
export function EditChip({ id, className = '' }: { id: string; className?: string }) {
  const state = useEditState(id)
  if (!state) return null
  return (
    <span className={`hf-edit-chip ${state.on ? '' : 'is-off'} ${className}`}>
      <span>{labelOf(id)}{state.on ? '' : ' · oculto'}</span>
      <EditSwitch state={state} label={labelOf(id)} small />
    </span>
  )
}
