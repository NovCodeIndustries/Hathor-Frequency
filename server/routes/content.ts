import { Hono } from 'hono'
import { z } from 'zod'
import { contentDefaults, contentKeys, type ContentKey } from '../../src/data/content'
import type { AdminVariables } from '../auth'
import { contentIssues } from '../content/schemas'
import { prisma } from '../db'
import type { Prisma } from '../generated/prisma/client'
import { parseBody } from '../lib/body'
import { fail } from '../lib/errors'
import { emitLive } from '../lib/siteEvents'

const isKey = (k: string): k is ContentKey => (contentKeys as string[]).includes(k)

/** Lo publicado de cada sección que tenga versión (las demás usan el contenido inicial) */
export async function publishedContent(): Promise<Partial<Record<ContentKey, unknown>>> {
  const rows = await prisma.contentVersion.findMany({ orderBy: { publishedAt: 'desc' }, distinct: ['key'], select: { key: true, data: true } })
  return Object.fromEntries(rows.filter((r) => isKey(r.key)).map((r) => [r.key, r.data]))
}

async function publishedOf(key: ContentKey) {
  const v = await prisma.contentVersion.findFirst({ where: { key }, orderBy: { publishedAt: 'desc' }, select: { id: true, data: true } })
  return { data: (v?.data ?? contentDefaults[key]) as unknown, versionId: v?.id ?? null }
}

/** JSON con las claves ordenadas: PostgreSQL (jsonb) reordena las claves, así que se compara sin importar el orden */
function stable(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>
    return `{${Object.keys(o)
      .filter((k) => o[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stable(o[k])}`)
      .join(',')}}`
  }
  return JSON.stringify(v ?? null)
}
const same = (a: unknown, b: unknown) => stable(a) === stable(b)

/** Estado de una sección para el panel: borrador (o lo publicado), publicado, errores y si hay cambios */
async function sectionState(key: ContentKey) {
  const [draft, pub] = await Promise.all([prisma.contentDraft.findUnique({ where: { key } }), publishedOf(key)])
  const data = draft ? (draft.data as unknown) : pub.data
  return { key, draft: data, published: pub.data, versionId: pub.versionId, dirty: !same(data, pub.data), issues: contentIssues(key, data) }
}

/** Nombre legible de un elemento de lista */
const itemName = (x: Record<string, unknown>) => String(x.name ?? x.q ?? x.title ?? x.label ?? x.code ?? x.id ?? '')
const itemKey = (x: Record<string, unknown>) => String(x.id ?? x.code ?? x.name ?? x.label ?? x.title ?? '')

/** "Agregó EP · Quitó Demo · Cambió Sencillo, textos" */
function summarize(prev: unknown, next: unknown): string {
  const parts: string[] = []
  const p = (prev ?? {}) as Record<string, unknown>
  const n = (next ?? {}) as Record<string, unknown>
  let textChanged = false
  for (const field of new Set([...Object.keys(p), ...Object.keys(n)])) {
    const a = p[field]
    const b = n[field]
    if (same(a, b)) continue
    if (Array.isArray(a) && Array.isArray(b) && b.every((x) => typeof x === 'object' && x)) {
      const ak = new Map((a as Record<string, unknown>[]).map((x) => [itemKey(x), x]))
      const bk = new Map((b as Record<string, unknown>[]).map((x) => [itemKey(x), x]))
      const added = [...bk.keys()].filter((k) => !ak.has(k)).map((k) => itemName(bk.get(k)!))
      const removed = [...ak.keys()].filter((k) => !bk.has(k)).map((k) => itemName(ak.get(k)!))
      const changed = [...bk.keys()].filter((k) => ak.has(k) && !same(ak.get(k), bk.get(k))).map((k) => itemName(bk.get(k)!))
      if (added.length) parts.push(`Agregó ${added.join(', ')}`)
      if (removed.length) parts.push(`Quitó ${removed.join(', ')}`)
      if (changed.length) parts.push(`Cambió ${changed.join(', ')}`)
      if (!added.length && !removed.length && !changed.length) parts.push('Cambió el orden')
    } else textChanged = true
  }
  if (textChanged) parts.push('Cambió textos')
  return (parts.join(' · ') || 'Sin cambios').slice(0, 500)
}

/** GET /api/content */
export const content = new Hono()

content.get('/', async (c) => {
  c.header('Cache-Control', 'no-cache')
  return c.json(await publishedContent())
})

/** /api/admin/content/* */
export const adminContent = new Hono<{ Variables: AdminVariables }>()

/** Secciones con cambios sin publicar (para la barra lateral y las pestañas) */
export async function contentChanges(): Promise<ContentKey[]> {
  const drafts = await prisma.contentDraft.findMany()
  const out: ContentKey[] = []
  for (const d of drafts) {
    if (!isKey(d.key)) continue
    if (!same(d.data, (await publishedOf(d.key)).data)) out.push(d.key)
  }
  return out
}

adminContent.get('/', async (c) => c.json({ dirty: await contentChanges() }))

adminContent.get('/:key', async (c) => {
  const key = c.req.param('key')
  if (!isKey(key)) return fail(c, 404, 'Sección desconocida')
  return c.json(await sectionState(key))
})

/** Guarda el borrador aunque tenga errores (se marcan en el formulario) */
adminContent.put('/:key/draft', async (c) => {
  const key = c.req.param('key')
  if (!isKey(key)) return fail(c, 404, 'Sección desconocida')
  const body = await parseBody(c, z.object({ data: z.unknown() }))
  if (body instanceof Response) return body
  if (JSON.stringify(body.data ?? null).length > 500_000) return fail(c, 413, 'Demasiado contenido')
  const data = body.data as Prisma.InputJsonValue
  const updatedByName = c.get('admin').name
  await prisma.contentDraft.upsert({ where: { key }, create: { key, data, updatedByName }, update: { data, updatedByName } })
  return c.json(await sectionState(key))
})

adminContent.post('/:key/publish', async (c) => {
  const key = c.req.param('key')
  if (!isKey(key)) return fail(c, 404, 'Sección desconocida')
  const state = await sectionState(key)
  if (!state.dirty) return fail(c, 409, 'No hay cambios para publicar')
  if (state.issues.length) return fail(c, 400, `Corrige ${state.issues.length} ${state.issues.length === 1 ? 'error' : 'errores'} antes de publicar`)
  await prisma.contentVersion.create({
    data: { key, data: state.draft as Prisma.InputJsonValue, summary: summarize(state.published, state.draft), publishedByName: c.get('admin').name },
  })
  await prisma.contentDraft.delete({ where: { key } }).catch(() => {})
  // La web abierta cambia al instante
  emitLive('content', { key, data: state.draft })
  return c.json(await sectionState(key))
})

adminContent.post('/:key/discard', async (c) => {
  const key = c.req.param('key')
  if (!isKey(key)) return fail(c, 404, 'Sección desconocida')
  await prisma.contentDraft.deleteMany({ where: { key } })
  return c.json(await sectionState(key))
})

adminContent.get('/:key/history', async (c) => {
  const key = c.req.param('key')
  if (!isKey(key)) return fail(c, 404, 'Sección desconocida')
  const rows = await prisma.contentVersion.findMany({
    where: { key },
    orderBy: { publishedAt: 'desc' },
    take: 30,
    select: { id: true, summary: true, publishedAt: true, publishedByName: true },
  })
  return c.json(rows.map((r, i) => ({ ...r, current: i === 0 })))
})

/** Copia una versión (o el contenido inicial con id "inicial") al borrador */
adminContent.post('/:key/restore/:id', async (c) => {
  const key = c.req.param('key')
  if (!isKey(key)) return fail(c, 404, 'Sección desconocida')
  const vid = c.req.param('id')
  const data =
    vid === 'inicial'
      ? contentDefaults[key]
      : (await prisma.contentVersion.findFirst({ where: { id: vid, key }, select: { data: true } }))?.data
  if (data === undefined) return fail(c, 404, 'Versión no encontrada')
  const updatedByName = c.get('admin').name
  const json = data as Prisma.InputJsonValue
  await prisma.contentDraft.upsert({ where: { key }, create: { key, data: json, updatedByName }, update: { data: json, updatedByName } })
  return c.json(await sectionState(key))
})
