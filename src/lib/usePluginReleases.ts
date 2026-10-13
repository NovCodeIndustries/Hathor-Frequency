import { useEffect, useState } from 'react'
import type { PluginReleaseInfo } from '../data/types'
import { onLive, onRefresh } from './live'

type Releases = Record<string, PluginReleaseInfo>

/** Versión actual de cada plugin (`GET /api/plugins/releases`); se actualiza en vivo al cambiar una versión en el panel */
export function usePluginReleases(): Releases {
  const [releases, setReleases] = useState<Releases>({})
  useEffect(() => {
    let alive = true
    const load = () =>
      fetch('/api/plugins/releases', { cache: 'no-store' })
        .then((res) => (res.ok ? (res.json() as Promise<Releases>) : null))
        .then((data) => alive && data && setReleases(data))
        .catch(() => {})
    load()
    const offLive = onLive('plugins', load)
    const offRefresh = onRefresh(load)
    return () => {
      alive = false
      offLive()
      offRefresh()
    }
  }, [])
  return releases
}
