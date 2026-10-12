import { Hono } from 'hono'
import { prisma } from '../../shared/db'
import { parseBody } from '../../shared/lib/body'
import { contactSchema } from '../../shared/schemas'
import { emitAdmin } from '../../shared/lib/siteEvents'

export const contact = new Hono()

contact.post('/', async (c) => {
  const body = await parseBody(c, contactSchema)
  if (body instanceof Response) return body
  const { website, ...data } = body
  if (website) return c.json({ ok: true }, 201)

  await prisma.contactRequest.create({ data })
  emitAdmin('contact')
  return c.json({ ok: true }, 201)
})
