import { useCallback, useEffect, useState } from 'react'
import type { ArchiveIndexEntry, DailyDigest } from '../types'
import { DATA_BASE_URL } from '../utils/dataBaseUrl'

export function useArchiveIndex() {
  const [entries, setEntries] = useState<ArchiveIndexEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${DATA_BASE_URL}data/archive-index.json`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: ArchiveIndexEntry[]) => setEntries(data))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [])

  return { entries, loading }
}

export function useArchivedDigest(date: string | null) {
  const [digest, setDigest] = useState<DailyDigest | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback((d: string) => {
    setLoading(true)
    fetch(`${DATA_BASE_URL}data/archive/${d}.json`)
      .then((res) => {
        if (!res.ok) throw new Error('not found')
        return res.json()
      })
      .then((data: DailyDigest) => setDigest(data))
      .catch(() => setDigest(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (date) load(date)
    else setDigest(null)
  }, [date, load])

  return { digest, loading }
}
