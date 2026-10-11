import type { Context } from 'hono'
import type { z } from 'zod'
import { fail, invalid } from './errors'

/** Lee y valida el JSON del cuerpo; devuelve los datos o la respuesta de error */
export async function parseBody<S extends z.ZodType>(c: Context, schema: S): Promise<z.infer<S> | Response> {
  const raw = await c.req.json().catch(() => undefined)
  if (raw === undefined) return fail(c, 400, 'Se esperaba JSON')
  const result = schema.safeParse(raw)
  return result.success ? result.data : invalid(c, result.error)
}
