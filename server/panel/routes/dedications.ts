import { Hono } from 'hono'
import { z } from 'zod'
import type { AdminVariables } from '../auth'
import { prisma } from '../../shared/db'
import { birthdayUsersToday } from '../../shared/lib/birthdays'
import { parseBody } from '../../shared/lib/body'
import { dateFromISO, todayISO } from '../../shared/lib/dates'
import { fail } from '../../shared/lib/errors'
import { emitAdmin } from '../../shared/lib/siteEvents'

/**
 * /api/admin/dedications: dedicatorias de cumpleaños (D2 firmar la funda · L1 leerlas una a una).
 * Solo el día del cumpleaños (CDMX). Quien recibe lee el texto; el resto del equipo solo ve quién firmó.
 */
export const dedications = new Hono<{ Variables: AdminVariables }>()

/** "Eduardo L." para la funda */
const signature = (u: { firstName: string; lastName: string; name: string }) =>
  u.firstName ? `${u.firstName}${u.lastName ? ` ${u.lastName[0]}.` : ''}` : u.name

/** Quién cumple hoy (sin contarme) y, por cada quien, si ya firmé, lo que escribí y quién más firmó */
dedications.get('/today', async (c) => {
  const me = c.get('admin')
  const forDate = dateFromISO(todayISO())
  const people = (await birthdayUsersToday()).filter((u) => u.id !== me.id)
  const rows = people.length
    ? await prisma.birthdayDedication.findMany({
        where: { forDate, recipientId: { in: people.map((p) => p.id) } },
        orderBy: { createdAt: 'asc' },
        include: { author: { select: { firstName: true, lastName: true, name: true } } },
      })
    : []
  return c.json(
    people.map((p) => {
      const mine = rows.find((r) => r.recipientId === p.id && r.authorId === me.id)
      return {
        id: p.id,
        name: p.name,
        firstName: p.firstName,
        mine: mine ? { text: mine.text, anonymous: mine.anonymous } : null,
        signers: rows.filter((r) => r.recipientId === p.id).map((r) => (r.anonymous ? 'Anónimo' : signature(r.author))),
      }
    }),
  )
})

/** Firmo (o cambio) mi dedicatoria para quien cumple hoy */
dedications.put('/:recipientId', async (c) => {
  const body = await parseBody(
    c,
    z.object({ text: z.string().trim().min(1, 'Escribe algo').max(500, 'Máximo 500 caracteres'), anonymous: z.boolean().optional() }),
  )
  if (body instanceof Response) return body
  const me = c.get('admin')
  const recipientId = c.req.param('recipientId')
  if (recipientId === me.id) return fail(c, 400, 'No puedes escribirte a ti')
  const person = (await birthdayUsersToday()).find((u) => u.id === recipientId)
  if (!person) return fail(c, 404, 'Hoy no es su cumpleaños')
  const forDate = dateFromISO(todayISO())
  const data = { text: body.text, anonymous: body.anonymous ?? false }
  await prisma.birthdayDedication.upsert({
    where: { recipientId_authorId_forDate: { recipientId, authorId: me.id, forDate } },
    // Una dedicatoria cambiada vuelve a ser nueva para quien la recibe
    create: { recipientId, authorId: me.id, forDate, ...data },
    update: { ...data, readAt: null },
  })
  emitAdmin('dedications')
  return c.json({ ok: true })
})

/** Mis dedicatorias de hoy (solo si hoy cumplo), en el orden en que llegaron */
dedications.get('/mine', async (c) => {
  const me = c.get('admin')
  if (!me.birthday) return c.json([])
  const rows = await prisma.birthdayDedication.findMany({
    where: { recipientId: me.id, forDate: dateFromISO(todayISO()) },
    orderBy: { createdAt: 'asc' },
    include: { author: { select: { firstName: true, lastName: true, name: true } } },
  })
  return c.json(
    rows.map((r) => ({
      id: r.id,
      text: r.text,
      from: r.anonymous ? 'Anónimo' : [r.author.firstName, r.author.lastName].filter(Boolean).join(' ') || r.author.name,
      createdAt: r.createdAt,
      read: !!r.readAt,
    })),
  )
})

/** Marca como leídas las que ya vi */
dedications.post('/mine/read', async (c) => {
  const body = await parseBody(c, z.object({ ids: z.array(z.uuid()).max(200) }))
  if (body instanceof Response) return body
  await prisma.birthdayDedication.updateMany({ where: { id: { in: body.ids }, recipientId: c.get('admin').id, readAt: null }, data: { readAt: new Date() } })
  return c.json({ ok: true })
})
