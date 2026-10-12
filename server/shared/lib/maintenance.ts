import { prisma } from '../db'

/** Modo mantenimiento de la web completa (panel · Sitio); lo leen la web (pantalla y formularios) y el panel */
export interface MaintenanceState {
  enabled: boolean
  message: string | null
  until: string | null
  startedAt: string | null
  updatedByName: string | null
}

export const MAINTENANCE_OFF: MaintenanceState = { enabled: false, message: null, until: null, startedAt: null, updatedByName: null }

export async function getMaintenance(): Promise<MaintenanceState> {
  const row = await prisma.siteMaintenance.findUnique({ where: { id: 1 } })
  if (!row) return MAINTENANCE_OFF
  return {
    enabled: row.enabled,
    message: row.message,
    until: row.until?.toISOString() ?? null,
    startedAt: row.startedAt?.toISOString() ?? null,
    updatedByName: row.updatedByName,
  }
}

/** Lo que ve el público: sin quién la apagó */
export const publicMaintenance = ({ enabled, message, until }: MaintenanceState) => ({ enabled, message: enabled ? message : null, until: enabled ? until : null })
