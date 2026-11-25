import { useCallback, useState } from 'react'
import { readJSON, writeJSON, STORAGE_KEYS } from '../utils/storage'

interface ChallengeAnswer {
  selectedIndex: number
  correct: boolean
}

type ChallengeProgressMap = Record<string, ChallengeAnswer>

export function useChallengeProgress(digestDate: string | undefined) {
  const [progress, setProgress] = useState<ChallengeProgressMap>(() =>
    readJSON<ChallengeProgressMap>(STORAGE_KEYS.challengeProgress, {}),
  )

  const answer = digestDate ? progress[digestDate] : undefined

  const submitAnswer = useCallback(
    (selectedIndex: number, correctIndex: number) => {
      if (!digestDate) return
      setProgress((prev) => {
        const next = { ...prev, [digestDate]: { selectedIndex, correct: selectedIndex === correctIndex } }
        writeJSON(STORAGE_KEYS.challengeProgress, next)
        return next
      })
    },
    [digestDate],
  )

  const completedCount = Object.keys(progress).length
  const correctCount = Object.values(progress).filter((a) => a.correct).length

  return { answer, submitAnswer, completedCount, correctCount }
}
