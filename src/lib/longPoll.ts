/**
 * Respaldo del SSE por long-polling (`/api/site/events/poll`, `/api/admin/events/poll`): cada consulta
 * queda abierta hasta que el servidor tiene un aviso nuevo (máx. 25 s) y se encadena la siguiente.
 * Sirve donde el SSE no pasa, como el túnel rápido de Cloudflare.
 */

interface FeedPage<T> {
  boot: string
  seq: number
  items: T[]
  reset: boolean
}

const RETRY_MS = 5_000

/** Empieza a consultar; `onReset` avisa que se perdieron avisos y hay que volver a pedir todo. Devuelve cómo parar */
export function longPoll<T>(url: string, onItems: (items: T[]) => void, onReset: () => void): () => void {
  const ctrl = new AbortController()
  let boot = ''
  let after = -1

  const run = async () => {
    while (!ctrl.signal.aborted) {
      try {
        const res = await fetch(`${url}?boot=${boot}&after=${after}`, { cache: 'no-store', signal: ctrl.signal })
        if (!res.ok) throw new Error(String(res.status))
        const page = (await res.json()) as FeedPage<T>
        boot = page.boot
        after = page.seq
        if (page.reset) onReset()
        else if (page.items.length) onItems(page.items)
      } catch {
        if (ctrl.signal.aborted) return
        await new Promise((r) => setTimeout(r, RETRY_MS))
      }
    }
  }
  void run()
  return () => ctrl.abort()
}
