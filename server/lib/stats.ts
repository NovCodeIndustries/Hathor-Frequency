import { contentDefaults, type ContentMap } from '../../src/data/content'
import { artistModule } from '../../src/data/modules'
import { prisma } from '../db'
import { BookingStatus } from '../generated/prisma/enums'
import { publishedDisabled } from './site'
import { emitLive } from './siteEvents'

/**
 * Cifras que salen de la base (Inicio y Estudio):
 * - proyectos: reservas que el admin marcó como "Terminada" (COMPLETED);
 * - artistas: los publicados en Contenido · Artistas, sin los ocultos en Sitio (la fila "Tu banda" no está en la lista).
 */
export interface SiteStats {
  projects: number
  artists: number
}

export async function computeStats(): Promise<SiteStats> {
  const [projects, artistsVersion, { disabled }] = await Promise.all([
    prisma.booking.count({ where: { status: BookingStatus.COMPLETED } }),
    prisma.contentVersion.findFirst({ where: { key: 'artistas' }, orderBy: { publishedAt: 'desc' }, select: { data: true } }),
    publishedDisabled(),
  ])
  const artistas = (artistsVersion?.data ?? contentDefaults.artistas) as ContentMap['artistas']
  const off = new Set(disabled)
  const artists = artistas.items.filter((a) => !off.has(artistModule(a.code))).length
  return { projects, artists }
}

/** Manda las cifras nuevas a la web abierta (SSE `stats`) */
export async function broadcastStats() {
  try {
    emitLive('stats', await computeStats())
  } catch (err) {
    console.warn('[stats]', (err as Error).message)
  }
}
