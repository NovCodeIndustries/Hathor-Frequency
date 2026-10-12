import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { POLL_WAIT_MS, onLiveEvent, siteFeed } from '../../shared/lib/siteEvents'

/** /api/site/events: avisos en vivo a la web abierta */
export const live = new Hono()

/** GET /api/site/events: SSE con un evento `site` cada vez que se publica (y un ping cada 25 s) */
live.get('/events', (c) => {
  // Que ningún proxy (nginx) acumule la respuesta
  c.header('X-Accel-Buffering', 'no')
  return streamSSE(c, async (stream) => {
    let closed = false
    const off = onLiveEvent((event, data) => {
      void stream.writeSSE({ event, data: JSON.stringify(data) })
    })
    stream.onAbort(() => {
      closed = true
      off()
    })
    // Relleno inicial (comentario SSE de 2 KB): algunos proxies retienen la respuesta hasta juntar unos KB
    await stream.write(`:${' '.repeat(2048)}\n\n`)
    await stream.writeSSE({ event: 'hello', data: '', retry: 5000 })
    while (!closed) {
      await stream.sleep(25_000)
      if (!closed) await stream.writeSSE({ event: 'ping', data: '' })
    }
  })
})

/**
 * GET /api/site/events/poll?boot=&after=: respaldo del SSE por long-polling. Responde los avisos con número
 * mayor que `after`, o espera hasta 25 s a que llegue uno. Sin `boot`, responde de inmediato el número actual.
 */
live.get('/events/poll', async (c) => {
  c.header('Cache-Control', 'no-store')
  const after = Number(c.req.query('after') ?? -1)
  return c.json(await siteFeed.since(c.req.query('boot') ?? '', Number.isInteger(after) ? after : -1, POLL_WAIT_MS, c.req.raw.signal))
})
