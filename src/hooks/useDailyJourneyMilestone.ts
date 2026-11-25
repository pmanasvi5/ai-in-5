import { useEffect, useState } from 'react'
import { readJSON, writeJSON, STORAGE_KEYS } from '../utils/storage'

interface DailyJourneyState {
  everCompletedFullBriefing: boolean
}

const EMPTY: DailyJourneyState = { everCompletedFullBriefing: false }

/** Tracks, once, whether someone has ever finished all four daily stages in
 * a single day — a one-time milestone, independent of the per-day stage
 * state which naturally resets every night. */
export function useDailyJourneyMilestone(allStagesDoneToday: boolean) {
  const [state, setState] = useState<DailyJourneyState>(() => readJSON(STORAGE_KEYS.dailyJourney, EMPTY))

  useEffect(() => {
    if (allStagesDoneToday && !state.everCompletedFullBriefing) {
      const next = { everCompletedFullBriefing: true }
      writeJSON(STORAGE_KEYS.dailyJourney, next)
      setState(next)
    }
  }, [allStagesDoneToday, state.everCompletedFullBriefing])

  return state.everCompletedFullBriefing
}
