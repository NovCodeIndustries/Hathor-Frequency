import { z } from 'zod'
import { bookingServices, maxSlots, timePattern } from '../../../src/data/booking'
import type { ContentKey } from '../../../src/data/content'
import { pluginFormats, pluginSystems } from '../../../src/data/plugins'
import { services } from '../../../src/data/services'

/** Validación de cada sección del panel · Contenido. El borrador se guarda aunque falle; publicar, no. */

const req = (max: number) => z.string().trim().min(1, 'Obligatorio').max(max, `Máximo ${max} caracteres`)
const opt = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres`)
const id = z.string().regex(/^[a-z0-9-]{1,40}$/, 'Id inválido')

/** Ruta del HDD de medios (`/media/…`) o URL externa https; vacío = sin medio */
export const mediaPath = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || /^\/media\/[^\s?#]+$/.test(v) || /^https:\/\/\S+$/.test(v), 'Debe empezar con /media/ o https://')
const media = mediaPath.optional()

const lines = (max: number) => z.array(req(max)).max(30)
const unique = <T>(key: (t: T) => string, msg: string) => (list: T[], ctx: z.RefinementCtx) => {
  const seen = new Set<string>()
  list.forEach((item, i) => {
    const k = key(item)
    if (seen.has(k)) ctx.addIssue({ code: 'custom', message: msg, path: [i] })
    seen.add(k)
  })
}

const mediaItem = z.object({ title: opt(120), detail: opt(120), src: media, embed: media })

export const contentSchemas: Record<ContentKey, z.ZodType> = {
  servicios: z.object({
    intro: req(300),
    items: z
      .array(z.object({ id: z.enum(services.map((s) => s.id) as [string, ...string[]]), name: req(40), description: req(200) }))
      .length(services.length, 'Los 5 servicios son fijos'),
  }),

  paquetes: z.object({
    intro: req(300),
    note: opt(200),
    disclaimer: z.object({ title: req(120), detail: opt(300) }),
    items: z
      .array(
        z.object({
          id,
          n: z.string().max(4),
          name: req(60),
          tag: opt(40),
          price: opt(20),
          short: req(120),
          description: req(1200),
          includes: lines(160),
          delivery: opt(40),
          sessions: opt(20),
        }),
      )
      .max(20)
      .superRefine(unique((p: { id: string }) => p.id, 'Id repetido')),
  }),

  precios: z.object({
    prices: z.object(
      Object.fromEntries(bookingServices.map((s) => [s, z.number().min(0, 'No puede ser negativo').max(10_000_000).nullable()])) as Record<
        string,
        z.ZodType
      >,
    ),
  }),

  horarios: z.object({
    slots: z
      .array(z.string().regex(timePattern, 'Hora inválida'))
      .min(1, 'Deja al menos una hora de inicio')
      .max(maxSlots, `Máximo ${maxSlots} horas de inicio`)
      .superRefine(unique((t: string) => t, 'Hora repetida')),
  }),

  artistas: z.object({
    intro: req(300),
    items: z
      .array(
        z.object({
          code: z.string().regex(/^[AB]\d{1,3}$/, 'Código A1…B99'),
          side: z.enum(['A', 'B']),
          name: req(60),
          genre: req(60),
          pattern: z.enum(['circles', 'diagonals', 'triangles', 'waves', 'bars', 'grid']),
          href: z.string().default('/artistas'),
          bio: opt(1500).optional(),
          quote: opt(300).optional(),
          socials: z
            .array(z.object({ platform: z.enum(['instagram', 'spotify', 'youtube', 'tiktok']), href: z.string().trim().regex(/^https:\/\/\S+$/, 'URL https://') }))
            .max(8)
            .optional(),
          videos: z.array(mediaItem).max(20).optional(),
          photos: z.array(mediaItem).max(30).optional(),
        }),
      )
      .max(60)
      .superRefine(unique((a: { code: string }) => a.code, 'Código repetido')),
  }),

  faq: z.object({
    items: z
      .array(z.object({ id, category: req(40), q: req(200), a: req(1500) }))
      .max(60)
      .superRefine(unique((f: { id: string }) => f.id, 'Id repetido')),
  }),

  plugins: z.object({
    intro: req(300),
    items: z
      .array(
        z
          .object({
            id,
            name: req(60),
            category: req(40),
            status: z.enum(['available', 'beta', 'soon']),
            short: req(140),
            description: req(1500),
            formats: z.array(z.enum(pluginFormats)).max(pluginFormats.length).superRefine(unique((f: string) => f, 'Formato repetido')),
            systems: z.array(z.enum(pluginSystems)).max(pluginSystems.length).superRefine(unique((s: string) => s, 'Sistema repetido')),
            free: z.boolean(),
            price: opt(20),
            link: z.string().trim().max(500).refine((v) => v === '' || /^https:\/\/\S+$/.test(v), 'URL https://'),
            controls: z.array(req(12)).min(2, 'Al menos 2 perillas').max(4, 'Máximo 4 perillas'),
            image: media,
            demoBefore: media,
            demoAfter: media,
          })
          .refine((p) => p.status === 'soon' || p.formats.length > 0, { message: 'Marca al menos un formato', path: ['formats'] }),
      )
      .max(40)
      .superRefine(unique((p: { id: string }) => p.id, 'Id repetido')),
  }),

  estudio: z.object({
    rooms: z
      .array(z.object({ n: z.string().max(4), name: req(60), article: z.enum(['a la', 'al']), size: opt(40), description: req(300), src: media }))
      .min(1, 'Al menos un espacio')
      .max(12),
    about: lines(800).min(1, 'Al menos un párrafo'),
    values: z.array(z.object({ title: req(60), description: req(300) })).max(8),
    gear: z.array(z.object({ label: req(40), value: req(300), src: media })).max(12),
    video: z
      .array(z.object({ title: req(60), tag: opt(30), description: req(600), steps: lines(40), includes: lines(160), embed: media }))
      .max(4),
    visit: z.array(z.object({ label: req(40), value: req(200) })).max(8),
    map: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180), zoom: z.number().int().min(3).max(20), example: z.boolean() }),
  }),

  sitio: z.object({
    slogan: req(120),
    stats: z.array(z.object({ value: opt(12), label: req(30), source: z.enum(['manual', 'proyectos', 'artistas']).optional() })).min(1).max(5),
    whatsapp: z.object({ display: opt(40), number: z.string().trim().regex(/^(\d{10,15})?$/, 'Solo dígitos con lada (52 + 10)') }),
    socials: z.array(z.object({ label: req(30), href: z.string().trim().regex(/^https:\/\/\S+$/, 'URL https://') })).max(8),
  }),
}

export interface FieldIssue {
  path: (string | number)[]
  message: string
}

/** Errores de una sección como lista de { path, message } (vacía si es válida) */
export function contentIssues(key: ContentKey, data: unknown): FieldIssue[] {
  const r = contentSchemas[key].safeParse(data)
  return r.success ? [] : r.error.issues.map((i) => ({ path: i.path as (string | number)[], message: i.message }))
}
