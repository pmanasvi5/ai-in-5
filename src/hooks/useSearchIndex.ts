import { useEffect, useState } from 'react'
import type { SearchIndexEntry } from '../types'
import { DATA_BASE_URL } from '../utils/dataBaseUrl'

export function useSearchIndex() {
  const [entries, setEntries] = useState<SearchIndexEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${DATA_BASE_URL}data/search-index.json`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: SearchIndexEntry[]) => setEntries(data))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [])

  return { entries, loading }
}
