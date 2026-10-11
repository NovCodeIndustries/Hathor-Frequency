import { bookingServices } from '../../data/booking'
import { slugify, type ContentKey } from '../../data/content'

/**
 * Formularios del panel · Contenido (diseño C1): qué campos tiene cada sección.
 * `key` es la ruta dentro del objeto (con puntos para anidar: "disclaimer.title").
 */

export type Field =
  | { kind: 'text' | 'textarea' | 'url'; key: string; label: string; max?: number; placeholder?: string; hint?: string; wide?: boolean }
  | { kind: 'money'; key: string; label: string; hint?: string }
  | { kind: 'number'; key: string; label: string; step?: number; nullable?: boolean; hint?: string }
  | { kind: 'checkbox'; key: string; label: string }
  | { kind: 'select'; key: string; label: string; options: { value: string; label: string }[] }
  | { kind: 'media'; key: string; label: string; accept: 'image' | 'video'; hint?: string; wide?: boolean }
  | { kind: 'lines'; key: string; label: string; itemLabel: string; max?: number; placeholder?: string }
  | { kind: 'list'; key: string; label: string; itemLabel: string; fields: Field[]; newItem: () => Record<string, unknown>; titleOf: (x: Record<string, unknown>) => string }

/** Lista principal de una sección (lo que va en la columna izquierda) */
export interface ItemsForm {
  type: 'items'
  /** Campos de la sección que no son de un elemento ("General") */
  general: Field[]
  itemLabel: string
  itemFields: Field[]
  canAdd: boolean
  newItem?: (list: Record<string, unknown>[]) => Record<string, unknown>
  titleOf: (x: Record<string, unknown>) => string
  subOf: (x: Record<string, unknown>) => string
  /** Módulo de Sitio del elemento (para "Mejor ocultarlo en Sitio") */
  moduleOf?: (x: Record<string, unknown>) => string
  /** Después de agregar/quitar/ordenar (p. ej. renumerar) */
  normalize?: (list: Record<string, unknown>[]) => Record<string, unknown>[]
}

/** Sección por grupos (la columna izquierda son grupos de campos) */
export interface GroupsForm {
  type: 'groups'
  groups: { id: string; label: string; fields: Field[] }[]
}

export type SectionForm = ItemsForm | GroupsForm

const uniqueId = (base: string, taken: string[]) => {
  let id = base
  for (let i = 2; taken.includes(id); i++) id = `${base}-${i}`
  return id
}

const PATTERNS = ['circles', 'diagonals', 'triangles', 'waves', 'bars', 'grid'].map((p) => ({
  value: p,
  label: { circles: 'Círculos', diagonals: 'Diagonales', triangles: 'Triángulos', waves: 'Ondas', bars: 'Barras', grid: 'Cuadrícula' }[p]!,
}))

const mediaList = (key: string, label: string, accept: 'image' | 'video'): Field => ({
  kind: 'list',
  key,
  label,
  itemLabel: accept === 'image' ? 'foto' : 'video',
  titleOf: (x) => String(x.title || (accept === 'image' ? 'Foto' : 'Video')),
  newItem: () => ({ title: '', detail: '' }),
  fields: [
    { kind: 'text', key: 'title', label: 'Título', max: 120 },
    { kind: 'text', key: 'detail', label: accept === 'image' ? 'Crédito' : 'Duración', max: 120 },
    accept === 'image'
      ? { kind: 'media', key: 'src', label: 'Foto', accept: 'image', wide: true }
      : { kind: 'media', key: 'embed', label: 'Video (URL de embed o /media/…)', accept: 'video', wide: true },
  ],
})

export const sectionForms: Record<ContentKey, SectionForm> = {
  servicios: {
    type: 'items',
    general: [{ kind: 'textarea', key: 'intro', label: 'Introducción de Servicios', max: 300 }],
    itemLabel: 'servicio',
    canAdd: false,
    titleOf: (x) => String(x.name),
    subOf: (x) => String(x.description ?? '').slice(0, 48),
    moduleOf: (x) => `servicios.${x.id}`,
    itemFields: [
      { kind: 'text', key: 'name', label: 'Nombre del canal', max: 40 },
      { kind: 'textarea', key: 'description', label: 'Descripción', max: 200 },
    ],
  },

  paquetes: {
    type: 'items',
    general: [
      { kind: 'textarea', key: 'intro', label: 'Introducción de Paquetes', max: 300 },
      { kind: 'text', key: 'note', label: 'Nota de precios (debajo de la lista)', max: 200, wide: true },
      { kind: 'text', key: 'disclaimer.title', label: 'Aviso · título', max: 120, wide: true },
      { kind: 'textarea', key: 'disclaimer.detail', label: 'Aviso · detalle', max: 300 },
    ],
    itemLabel: 'paquete',
    canAdd: true,
    titleOf: (x) => String(x.name || 'Nuevo paquete'),
    subOf: (x) => `${x.tag || 'Sin etiqueta'} · ${x.price || 'Sin precio'}`,
    moduleOf: (x) => `paquetes.${x.id}`,
    newItem: (list) => ({
      id: uniqueId('nuevo-paquete', list.map((p) => String(p.id))),
      n: '',
      name: 'Nuevo paquete',
      tag: '',
      price: '',
      short: '',
      description: '',
      includes: [],
      delivery: '',
      sessions: '',
    }),
    normalize: (list) => list.map((p, i) => ({ ...p, n: String(i + 1).padStart(2, '0') })),
    itemFields: [
      { kind: 'text', key: 'name', label: 'Nombre', max: 60 },
      { kind: 'text', key: 'tag', label: 'Etiqueta', max: 40, placeholder: 'Recomendado' },
      { kind: 'money', key: 'price', label: 'Precio · MXN', hint: 'Vacío = "[PRECIO]"' },
      { kind: 'text', key: 'delivery', label: 'Entrega', max: 40, placeholder: '7 días' },
      { kind: 'text', key: 'sessions', label: 'Sesiones', max: 20, placeholder: '1' },
      { kind: 'text', key: 'short', label: 'Descripción corta', max: 120, wide: true },
      { kind: 'textarea', key: 'description', label: 'Descripción', max: 1200 },
      { kind: 'lines', key: 'includes', label: 'Qué incluye', itemLabel: 'línea', max: 160 },
    ],
  },

  precios: {
    type: 'groups',
    groups: [
      {
        id: 'precios',
        label: 'Precio base por sesión',
        fields: bookingServices.map((s) => ({
          kind: 'number' as const,
          key: `prices.${s}`,
          label: `${s} · MXN`,
          nullable: true,
          hint: 'Lo propone la ventana de cobro al confirmar. Vacío = sin precio base.',
        })),
      },
    ],
  },

  artistas: {
    type: 'items',
    general: [{ kind: 'textarea', key: 'intro', label: 'Introducción de Artistas', max: 300 }],
    itemLabel: 'artista',
    canAdd: true,
    titleOf: (x) => String(x.name || 'Nuevo artista'),
    subOf: (x) => `${x.code} · ${x.genre || 'Sin género'}`,
    moduleOf: (x) => `artistas.${String(x.code).toLowerCase()}`,
    newItem: (list) => {
      // "Tu banda" (B14) es la fila fija: su código no se usa
      const taken = new Set([...list.map((a) => String(a.code)), 'B14'])
      let n = 1
      while (taken.has(`A${n}`)) n++
      return { code: `A${n}`, side: 'A', name: 'Nuevo artista', genre: '', pattern: 'circles', href: '/artistas', bio: '', quote: '', socials: [], videos: [], photos: [] }
    },
    itemFields: [
      { kind: 'text', key: 'name', label: 'Nombre', max: 60 },
      { kind: 'text', key: 'genre', label: 'Género', max: 60, placeholder: 'R&B · Soul' },
      { kind: 'select', key: 'side', label: 'Lado del tracklist', options: [{ value: 'A', label: 'Lado A' }, { value: 'B', label: 'Lado B' }] },
      { kind: 'select', key: 'pattern', label: 'Patrón de la tarjeta', options: PATTERNS },
      { kind: 'textarea', key: 'bio', label: 'Bio', max: 1500 },
      { kind: 'textarea', key: 'quote', label: 'Cita (opcional)', max: 300 },
      {
        kind: 'list',
        key: 'socials',
        label: 'Redes',
        itemLabel: 'red',
        titleOf: (x) => String(x.platform),
        newItem: () => ({ platform: 'instagram', href: '' }),
        fields: [
          {
            kind: 'select',
            key: 'platform',
            label: 'Plataforma',
            options: ['instagram', 'spotify', 'youtube', 'tiktok'].map((p) => ({ value: p, label: { instagram: 'Instagram', spotify: 'Spotify', youtube: 'YouTube', tiktok: 'TikTok' }[p]! })),
          },
          { kind: 'url', key: 'href', label: 'URL', placeholder: 'https://', wide: true },
        ],
      },
      mediaList('photos', 'Fotos', 'image'),
      mediaList('videos', 'Videos', 'video'),
    ],
  },

  faq: {
    type: 'items',
    general: [],
    itemLabel: 'pregunta',
    canAdd: true,
    titleOf: (x) => String(x.q || 'Nueva pregunta'),
    subOf: (x) => String(x.category || 'Sin categoría'),
    moduleOf: (x) => `faq.${x.id}`,
    newItem: (list) => ({ id: uniqueId(slugify('nueva pregunta'), list.map((f) => String(f.id))), category: String(list[list.length - 1]?.category ?? 'General'), q: '', a: '' }),
    itemFields: [
      { kind: 'text', key: 'category', label: 'Categoría', max: 40, hint: 'Las preguntas de la misma categoría van juntas' },
      { kind: 'text', key: 'q', label: 'Pregunta', max: 200, wide: true },
      { kind: 'textarea', key: 'a', label: 'Respuesta', max: 1500 },
    ],
  },

  estudio: {
    type: 'groups',
    groups: [
      {
        id: 'rooms',
        label: 'Tour · espacios',
        fields: [
          {
            kind: 'list',
            key: 'rooms',
            label: 'Espacios',
            itemLabel: 'espacio',
            titleOf: (x) => String(x.name || 'Espacio'),
            newItem: () => ({ n: '', name: '', article: 'a la', size: '', description: '', src: '' }),
            fields: [
              { kind: 'text', key: 'n', label: 'Número', max: 4, placeholder: '01' },
              { kind: 'text', key: 'name', label: 'Nombre', max: 60 },
              { kind: 'select', key: 'article', label: 'Artículo ("Entra a la…")', options: [{ value: 'a la', label: 'a la' }, { value: 'al', label: 'al' }] },
              { kind: 'text', key: 'size', label: 'Tamaño', max: 40, placeholder: '40 m²' },
              { kind: 'textarea', key: 'description', label: 'Descripción', max: 300 },
              { kind: 'media', key: 'src', label: 'Foto', accept: 'image', wide: true },
            ],
          },
        ],
      },
      {
        id: 'about',
        label: 'Nosotros',
        fields: [
          { kind: 'lines', key: 'about', label: 'Párrafos', itemLabel: 'párrafo', max: 800 },
          {
            kind: 'list',
            key: 'values',
            label: 'Valores',
            itemLabel: 'valor',
            titleOf: (x) => String(x.title || 'Valor'),
            newItem: () => ({ title: '', description: '' }),
            fields: [
              { kind: 'text', key: 'title', label: 'Título', max: 60 },
              { kind: 'textarea', key: 'description', label: 'Descripción', max: 300 },
            ],
          },
        ],
      },
      {
        id: 'video',
        label: 'Videos y live sessions',
        fields: [
          {
            kind: 'list',
            key: 'video',
            label: 'Servicios de video',
            itemLabel: 'servicio',
            titleOf: (x) => String(x.title || 'Servicio'),
            newItem: () => ({ title: '', tag: '', description: '', steps: [], includes: [], embed: '' }),
            fields: [
              { kind: 'text', key: 'title', label: 'Título', max: 60 },
              { kind: 'text', key: 'tag', label: 'Etiqueta', max: 30 },
              { kind: 'textarea', key: 'description', label: 'Descripción', max: 600 },
              { kind: 'lines', key: 'steps', label: 'Pasos', itemLabel: 'paso', max: 40 },
              { kind: 'lines', key: 'includes', label: 'Incluye', itemLabel: 'línea', max: 160 },
              { kind: 'media', key: 'embed', label: 'Video de muestra (URL de embed o /media/…)', accept: 'video', wide: true },
            ],
          },
        ],
      },
      {
        id: 'gear',
        label: 'Equipo',
        fields: [
          {
            kind: 'list',
            key: 'gear',
            label: 'Equipo',
            itemLabel: 'categoría',
            titleOf: (x) => String(x.label || 'Categoría'),
            newItem: () => ({ label: '', value: '', src: '' }),
            fields: [
              { kind: 'text', key: 'label', label: 'Categoría', max: 40 },
              { kind: 'textarea', key: 'value', label: 'Detalle', max: 300 },
              { kind: 'media', key: 'src', label: 'Foto', accept: 'image', wide: true },
            ],
          },
        ],
      },
      {
        id: 'visit',
        label: 'Visita y mapa',
        fields: [
          {
            kind: 'list',
            key: 'visit',
            label: 'Datos de visita',
            itemLabel: 'dato',
            titleOf: (x) => String(x.label || 'Dato'),
            newItem: () => ({ label: '', value: '' }),
            fields: [
              { kind: 'text', key: 'label', label: 'Etiqueta', max: 40 },
              { kind: 'text', key: 'value', label: 'Valor', max: 200, wide: true },
            ],
          },
          { kind: 'number', key: 'map.lat', label: 'Latitud', step: 0.0001 },
          { kind: 'number', key: 'map.lng', label: 'Longitud', step: 0.0001 },
          { kind: 'number', key: 'map.zoom', label: 'Zoom (3–20)', step: 1 },
          { kind: 'checkbox', key: 'map.example', label: 'Mostrar "Ubicación de ejemplo"' },
        ],
      },
    ],
  },

  sitio: {
    type: 'groups',
    groups: [
      {
        id: 'inicio',
        label: 'Inicio',
        fields: [
          { kind: 'text', key: 'slogan', label: 'Eslogan', max: 120, wide: true },
          {
            kind: 'list',
            key: 'stats',
            label: 'Cifras (Inicio y Estudio)',
            itemLabel: 'cifra',
            titleOf: (x) => `${x.value} ${x.label}`,
            newItem: () => ({ value: '', label: '' }),
            fields: [
              { kind: 'text', key: 'value', label: 'Valor', max: 12, placeholder: '200+' },
              { kind: 'text', key: 'label', label: 'Etiqueta', max: 30, placeholder: 'Proyectos' },
            ],
          },
        ],
      },
      {
        id: 'contacto',
        label: 'WhatsApp y redes',
        fields: [
          { kind: 'text', key: 'whatsapp.display', label: 'WhatsApp · como se muestra', max: 40, placeholder: '+52 55 1234 5678' },
          { kind: 'text', key: 'whatsapp.number', label: 'WhatsApp · solo dígitos (para el link)', max: 15, placeholder: '525512345678' },
          {
            kind: 'list',
            key: 'socials',
            label: 'Redes (Footer y Contacto)',
            itemLabel: 'red',
            titleOf: (x) => String(x.label || 'Red'),
            newItem: () => ({ label: '', href: '' }),
            fields: [
              { kind: 'text', key: 'label', label: 'Nombre', max: 30, placeholder: 'Instagram' },
              { kind: 'url', key: 'href', label: 'URL', placeholder: 'https://', wide: true },
            ],
          },
        ],
      },
    ],
  },
}

// ── Rutas dentro del objeto ("disclaimer.title", ["items", 2, "name"]) ──

export const getAt = (obj: unknown, path: (string | number)[]): unknown =>
  path.reduce<unknown>((o, k) => (o == null ? undefined : (o as Record<string | number, unknown>)[k]), obj)

export function setAt<T>(obj: T, path: (string | number)[], value: unknown): T {
  if (!path.length) return value as T
  const [k, ...rest] = path
  const base = (Array.isArray(obj) ? [...obj] : { ...(obj as object) }) as Record<string | number, unknown>
  base[k] = setAt(base[k], rest, value)
  return base as T
}

export const keyPath = (key: string) => key.split('.')
