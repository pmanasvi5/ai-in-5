import { useCallback, useState } from 'react'
import { readJSON, writeJSON, STORAGE_KEYS } from '../utils/storage'

interface ActivityProgressState {
  completedIds: string[]
}

const EMPTY: ActivityProgressState = { completedIds: [] }

export function useActivityProgress() {
  const [state, setState] = useState<ActivityProgressState>(() =>
    readJSON<ActivityProgressState>(STORAGE_KEYS.activityProgress, EMPTY),
  )

  const completedIds = new Set(state.completedIds)

  const markDone = useCallback((activityId: string) => {
    setState((prev) => {
      if (prev.completedIds.includes(activityId)) return prev
      const next = { completedIds: [...prev.completedIds, activityId] }
      writeJSON(STORAGE_KEYS.activityProgress, next)
      return next
    })
  }, [])

  const markNotDone = useCallback((activityId: string) => {
    setState((prev) => {
      const next = { completedIds: prev.completedIds.filter((id) => id !== activityId) }
      writeJSON(STORAGE_KEYS.activityProgress, next)
      return next
    })
  }, [])

  return { completedIds, completedCount: state.completedIds.length, markDone, markNotDone }
}
