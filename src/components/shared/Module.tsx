import type { ReactNode } from 'react'
import { useEditState, useModule } from '../../lib/siteModules'
import { EditFrame } from './EditFrame'

/** Bloque que se puede apagar desde el panel · Sitio (`src/data/modules.ts`); en modo edición, con su marco */
export function Module({ id, children }: { id: string; children: ReactNode }) {
  const show = useModule(id)
  const edit = useEditState(id)
  if (!show) return null
  return edit ? <EditFrame id={id} state={edit}>{children}</EditFrame> : <>{children}</>
}
