import { useOutletContext } from 'react-router'
import type { AdminSummary, AdminUser } from './adminApi'

/** Lo que `AdminLayout` comparte con las vistas del panel */
export interface AdminContext {
  admin: AdminUser
  summary: AdminSummary | null
  /** Recarga los contadores de las pestañas tras un cambio */
  refreshSummary: () => void
  /** Vuelve a leer mi usuario (tras editar mi nombre en Usuarios) */
  refreshMe: () => void
  /** Mensaje del error; si la sesión expiró (401) manda al login */
  onError: (err: unknown) => string
}

/** Datos de la sesión para las vistas del panel */
export const useAdmin = () => useOutletContext<AdminContext>()
