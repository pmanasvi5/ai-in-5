import { useCallback, useEffect, useState } from 'react'
import type { DailyDigest } from '../types'
import { DATA_BASE_URL } from '../utils/dataBaseUrl'

type FetchState = 'loading' | 'ready' | 'error'

export function useDigest(url = `${DATA_BASE_URL}data/latest.json`) {
  const [digest, setDigest] = useState<DailyDigest | null>(null)
  const [state, setState] = useState<FetchState>('loading')
  const [refreshKey, setRefreshKey] = useState(0)

  const load = useCallback(() => {
    setState('loading')
    fetch(`${url}?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data: DailyDigest) => {
        setDigest(data)
        setState('ready')
      })
      .catch(() => {
        setState('error')
      })
  }, [url])

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, refreshKey])

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  return { digest, state, refresh }
}
