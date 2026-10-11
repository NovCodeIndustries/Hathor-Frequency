import { artists } from './artists'
import { faqs } from './faq'
import { packages } from './packages'
import { services } from './services'

/**
 * Módulos del sitio que se pueden apagar desde el panel · Sitio (`/admin/sitio`).
 * Apagar no borra nada: solo deja de mostrarse en la web pública.
 * La BD guarda solo los ids apagados, así que un módulo nuevo nace encendido.
 * IMPORTANTE: no cambies un id ya publicado (se perdería su estado).
 */

export type ModuleKind = 'page' | 'section' | 'item' | 'global'

export interface ModuleDef {
  id: string
  label: string
  kind: ModuleKind
  /** Si el padre está apagado, este también */
  parent?: string
  /** Solo páginas: su ruta */
  route?: string
}

/** Páginas que se pueden apagar (Inicio, Nav, Footer y 404 no) */
export const pageModules: ModuleDef[] = [
  { id: 'page.servicios', label: 'Servicios', kind: 'page', route: '/servicios' },
  { id: 'page.artistas', label: 'Artistas', kind: 'page', route: '/artistas' },
  { id: 'page.opiniones', label: 'Opiniones', kind: 'page', route: '/opiniones' },
  { id: 'page.reservar', label: 'Reservar', kind: 'page', route: '/reservar' },
  { id: 'page.contacto', label: 'Contacto', kind: 'page', route: '/contacto' },
  { id: 'page.faq', label: 'FAQs', kind: 'page', route: '/faq' },
  { id: 'page.estudio', label: 'Estudio', kind: 'page', route: '/estudio' },
]

const sections: ModuleDef[] = [
  { id: 'inicio.vinilo', label: 'Vinilo de fondo', kind: 'section' },
  { id: 'inicio.cifras', label: 'Cifras', kind: 'section' },
  { id: 'servicios.paquetes', label: 'Vista Paquetes', kind: 'section', parent: 'page.servicios' },
  { id: 'opiniones.dejar', label: 'Deja tu opinión', kind: 'section', parent: 'page.opiniones' },
  { id: 'contacto.opiniones', label: 'Opiniones que rotan', kind: 'section', parent: 'page.contacto' },
  { id: 'estudio.tour', label: 'Tour', kind: 'section', parent: 'page.estudio' },
  { id: 'estudio.nosotros', label: 'Nosotros', kind: 'section', parent: 'page.estudio' },
  { id: 'estudio.videos', label: 'Videos', kind: 'section', parent: 'page.estudio' },
  { id: 'estudio.equipo', label: 'Equipo', kind: 'section', parent: 'page.estudio' },
  { id: 'estudio.visita', label: 'Visita', kind: 'section', parent: 'page.estudio' },
]

const items: ModuleDef[] = [
  ...services.map((s) => ({ id: `servicios.${s.id}`, label: s.name, kind: 'item' as const, parent: 'page.servicios' })),
  ...packages.map((p) => ({ id: `paquetes.${p.id}`, label: `Paquete ${p.name}`, kind: 'item' as const, parent: 'servicios.paquetes' })),
  ...artists.map((a) => ({ id: `artistas.${a.code.toLowerCase()}`, label: a.name, kind: 'item' as const, parent: 'page.artistas' })),
  ...faqs.map((f) => ({ id: `faq.${f.id}`, label: f.q, kind: 'item' as const, parent: 'page.faq' })),
]

export const globalModules: ModuleDef[] = [
  { id: 'global.ticker', label: 'Ticker', kind: 'global' },
  { id: 'global.ufo', label: 'Platillo volador', kind: 'global' },
  { id: 'global.welcome', label: 'Bienvenida', kind: 'global' },
  { id: 'global.seasons', label: 'Temporadas', kind: 'global' },
  { id: 'global.eggs', label: 'Easter eggs', kind: 'global' },
  { id: 'global.socials', label: 'Redes y WhatsApp', kind: 'global' },
]

export const siteModules: ModuleDef[] = [...pageModules, ...sections, ...items, ...globalModules]

export const moduleById = new Map(siteModules.map((m) => [m.id, m]))

/** Ruta pública → módulo de página */
export const pageByRoute = new Map(pageModules.map((m) => [m.route!, m.id]))

/** Ids de los módulos de un artista, paquete, servicio o pregunta */
export const artistModule = (code: string) => `artistas.${code.toLowerCase()}`
export const packageModule = (id: string) => `paquetes.${id}`
export const serviceModule = (id: string) => `servicios.${id}`
export const faqModule = (id: string) => `faq.${id}`

/** Elementos de listas creados en el panel · Contenido (no están en el registro): su padre sale del prefijo */
const ITEM_PARENT: Record<string, string> = {
  artistas: 'page.artistas',
  paquetes: 'servicios.paquetes',
  faq: 'page.faq',
  servicios: 'page.servicios',
}
export const DYNAMIC_ITEM = /^(artistas|paquetes|faq)\.[a-z0-9-]{1,40}$/

export function parentOf(id: string): string | undefined {
  const m = moduleById.get(id)
  if (m) return m.parent
  return DYNAMIC_ITEM.test(id) ? ITEM_PARENT[id.split('.')[0]] : undefined
}

/** ¿Está encendido? Un módulo se apaga si él o cualquiera de sus padres está en `disabled` */
export function isModuleOn(id: string, disabled: ReadonlySet<string>): boolean {
  let cur: string | undefined = id
  while (cur) {
    if (disabled.has(cur)) return false
    cur = parentOf(cur)
  }
  return true
}

/** Módulo de página de un path (`/estudio`, `/servicios?vista=…`); undefined si no es una página apagable */
export function pageModuleOf(path: string): string | undefined {
  const clean = path.split(/[?#]/)[0].replace(/\/+$/, '') || '/'
  return pageByRoute.get(clean)
}

/**
 * Módulo del que depende un link interno: la página y, si apunta a una vista dentro de ella, esa sección
 * (`/servicios?vista=paquetes` → servicios.paquetes, `/opiniones?opinar=1` → opiniones.dejar).
 * Si está apagado, el link no se muestra.
 */
export function linkModuleOf(path: string): string | undefined {
  if (/[?&]vista=paquetes/.test(path)) return 'servicios.paquetes'
  if (/[?&]opinar=1/.test(path)) return 'opiniones.dejar'
  return pageModuleOf(path)
}
