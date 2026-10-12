import { DYNAMIC_ITEM, isModuleOn, moduleById } from '../../../src/data/modules'
import { prisma } from '../db'

/** Módulos apagados publicados (la versión más reciente; sin versiones = todo encendido) */
export async function publishedDisabled(): Promise<{ disabled: string[]; versionId: string | null }> {
  const v = await prisma.siteVersion.findFirst({ orderBy: { publishedAt: 'desc' }, select: { id: true, disabled: true } })
  return { disabled: v?.disabled ?? [], versionId: v?.id ?? null }
}

/** Solo ids que existen en el registro, sin repetir y en orden */
export const cleanIds = (ids: string[]) => [...new Set(ids.filter((id) => moduleById.has(id) || DYNAMIC_ITEM.test(id)))].sort()

/** ¿El módulo está encendido en lo publicado? (para bloquear formularios de páginas apagadas) */
export async function isPublishedOn(id: string): Promise<boolean> {
  const { disabled } = await publishedDisabled()
  return isModuleOn(id, new Set(disabled))
}
