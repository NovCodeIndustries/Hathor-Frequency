/** Violación de unicidad: P2002 de Prisma o 23505 de PostgreSQL (vía el adapter) */
export function isUniqueViolation(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false
  const e = err as { code?: string; cause?: { code?: string; originalCode?: string } }
  return e.code === 'P2002' || e.code === '23505' || e.cause?.code === '23505' || e.cause?.originalCode === '23505'
}
