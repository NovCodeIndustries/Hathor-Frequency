import type { PluginReleaseInfo } from '../../../src/data/types'
import { prisma } from '../db'

/** Versión actual de cada plugin que tenga una (`GET /api/plugins/releases`): número y si hay instalador por sistema */
export async function currentReleases(): Promise<Record<string, PluginReleaseInfo>> {
  const rows = await prisma.pluginRelease.findMany({ where: { current: true }, select: { pluginId: true, version: true, macPath: true, winPath: true } })
  return Object.fromEntries(rows.map((r) => [r.pluginId, { version: r.version, mac: !!r.macPath, win: !!r.winPath }]))
}
