import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { ZodError } from 'zod'

/** Respuesta de error uniforme: `{ error, fields? }` */
export interface ApiError {
  error: string
  /** Mensaje por campo cuando falla la validación */
  fields?: Record<string, string>
}

export const fail = (c: Context, status: ContentfulStatusCode, error: string, fields?: Record<string, string>) =>
  c.json<ApiError>(fields ? { error, fields } : { error }, status)

/** Errores de zod → 400 con el primer mensaje de cada campo */
export function invalid(c: Context, err: ZodError) {
  const fields: Record<string, string> = {}
  for (const issue of err.issues) {
    const key = issue.path.join('.') || '_'
    fields[key] ??= issue.message
  }
  return fail(c, 400, 'Datos inválidos', fields)
}
