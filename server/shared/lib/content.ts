import { contentDefaults, contentKeys, type ContentKey } from '../../../src/data/content'
import { prisma } from '../db'

export const isKey = (k: string): k is ContentKey => (contentKeys as string[]).includes(k)

/** Lo publicado de cada sección que tenga versión (las demás usan el contenido inicial) */
export async function publishedContent(): Promise<Partial<Record<ContentKey, unknown>>> {
  const rows = await prisma.contentVersion.findMany({ orderBy: { publishedAt: 'desc' }, distinct: ['key'], select: { key: true, data: true } })
  return Object.fromEntries(rows.filter((r) => isKey(r.key)).map((r) => [r.key, r.data]))
}

export async function publishedOf(key: ContentKey) {
  const v = await prisma.contentVersion.findFirst({ where: { key }, orderBy: { publishedAt: 'desc' }, select: { id: true, data: true } })
  return { data: (v?.data ?? contentDefaults[key]) as unknown, versionId: v?.id ?? null }
}
