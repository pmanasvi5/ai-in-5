import { useCallback, useEffect, useState } from 'react'
import { readJSON, writeJSON, STORAGE_KEYS } from '../utils/storage'

interface ReadRecord {
  digestDate: string
  storyIds: string[]
}

/** Tracks which of today's stories someone has opened, so the app can show
 * a subtle reading-progress indicator. Resets automatically for a new
 * digest date rather than accumulating forever. */
export function useReadTracking(digestDate: string | undefined) {
  const [readIds, setReadIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!digestDate) return
    const stored = readJSON<ReadRecord | null>(STORAGE_KEYS.readStoryIds, null)
    setReadIds(stored && stored.digestDate === digestDate ? new Set(stored.storyIds) : new Set())
  }, [digestDate])

  const markRead = useCallback(
    (storyId: string) => {
      if (!digestDate) return
      setReadIds((prev) => {
        if (prev.has(storyId)) return prev
        const next = new Set(prev)
        next.add(storyId)
        writeJSON<ReadRecord>(STORAGE_KEYS.readStoryIds, { digestDate, storyIds: [...next] })
        return next
      })
    },
    [digestDate],
  )

  return { readIds, markRead }
}
