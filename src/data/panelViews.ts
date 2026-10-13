/**
 * Vistas del panel que se le pueden dar a un usuario Staff (panel · Usuarios, al crearlo o editarlo).
 * ADMIN ve todo; STAFF solo las vistas de `AdminUser.views`, más su cuenta. El servidor lo exige con `api`
 * (rutas bajo /api/admin: vale la exacta o lo que cuelga de ella) y el panel oculta pestañas y redirige con `route`.
 * Al agregar un módulo al panel, súmalo aquí: sale como opción en el usuario y nace apagado para el Staff.
 * IMPORTANTE: no cambies un id ya guardado (se perdería el permiso).
 */

export interface PanelView {
  id: string
  label: string
  /** Ruta del panel ("/admin" es solo Inicio, sin lo que cuelga) */
  route: string
  /** Rutas de /api/admin que necesita */
  api: string[]
  /** Qué incluye, para el formulario del usuario */
  hint: string
}

export const panelViews: PanelView[] = [
  { id: 'inicio', label: 'Inicio', route: '/admin', api: ['/dashboard'], hint: 'Resumen del día y cifras, con ingresos' },
  { id: 'agenda', label: 'Agenda', route: '/admin/reservas', api: ['/bookings', '/blocks'], hint: 'Reservas, bloqueos y cobros' },
  { id: 'opiniones', label: 'Opiniones', route: '/admin/opiniones', api: ['/reviews'], hint: 'Aprobar y borrar opiniones' },
  { id: 'contactos', label: 'Contactos', route: '/admin/contactos', api: ['/contacts'], hint: 'Mensajes del formulario' },
  { id: 'sitio', label: 'Sitio', route: '/admin/sitio', api: ['/site'], hint: 'Apagar módulos y mantenimiento' },
  { id: 'contenido', label: 'Contenido', route: '/admin/contenido', api: ['/content', '/media'], hint: 'Textos, precios y listas de la web' },
  { id: 'plugins', label: 'Plugins', route: '/admin/plugins', api: ['/plugins', '/content/plugins', '/media'], hint: 'Fichas, versiones y descargas' },
]

export const panelViewIds = panelViews.map((v) => v.id)

/** Lo que tiene el Staff que ya existía antes de poder elegir: Agenda y Contactos */
export const DEFAULT_STAFF_VIEWS = ['agenda', 'contactos']

/** Siempre permitido: sesión, contadores, avisos en vivo, su cuenta y las dedicatorias */
const ALWAYS_API = ['/me', '/summary', '/events', '/users/me', '/dedications']

/** Mi cuenta (Usuarios) siempre se ve: ahí cambia su contraseña y ve sus sesiones */
export const ACCOUNT_ROUTE = '/admin/usuarios'

const under = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}/`)

/** ¿Puede un Staff con estas vistas usar esta ruta de /api/admin? */
export function staffCanUseApi(path: string, views: readonly string[]): boolean {
  if (ALWAYS_API.some((p) => under(path, p))) return true
  return panelViews.some((v) => views.includes(v.id) && v.api.some((p) => under(path, p)))
}

/** ¿Puede un Staff con estas vistas abrir esta ruta del panel? */
export function staffCanOpen(pathname: string, views: readonly string[]): boolean {
  const path = pathname.replace(/\/+$/, '') || '/admin'
  if (under(path, ACCOUNT_ROUTE)) return true
  return panelViews.some((v) => views.includes(v.id) && (v.route === '/admin' ? path === '/admin' : under(path, v.route)))
}

/** Primera vista del Staff (adonde llega al entrar); sin vistas, Mi cuenta */
export const staffHome = (views: readonly string[]) => panelViews.find((v) => views.includes(v.id))?.route ?? ACCOUNT_ROUTE

/** "Agenda y Contactos", "Agenda, Contactos y Plugins", "solo Mi cuenta" */
export function viewsText(views: readonly string[]): string {
  const names = panelViews.filter((v) => views.includes(v.id)).map((v) => v.label)
  if (!names.length) return 'solo Mi cuenta'
  return names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`
}
