import { useCallback, useEffect, useMemo, useState } from 'react'
import type { GlossaryTerm, LearningProgress } from '../types'
import { readJSON, writeJSON, STORAGE_KEYS } from '../utils/storage'
import { editorialToday } from '../utils/date'
import { selectFeaturedTermId } from '../utils/termSelection'

const EMPTY_PROGRESS: LearningProgress = {
  learnedTerms: [],
  currentFeaturedTermId: null,
  featuredTermSelectedDate: null,
}

function pickNextFeatured(
  glossary: GlossaryTerm[],
  learnedIds: Set<string>,
  today: string,
): { id: string | null; date: string } {
  return { id: selectFeaturedTermId(glossary, learnedIds, today), date: today }
}

export function useLearningProgress(glossary: GlossaryTerm[]) {
  const [progress, setProgress] = useState<LearningProgress>(() => {
    const stored = readJSON<LearningProgress>(STORAGE_KEYS.learningProgress, EMPTY_PROGRESS)
    const learnedIds = new Set(stored.learnedTerms.map((t) => t.termId))
    const today = editorialToday()

    // Keep showing the stored featured term as long as it's still eligible
    // (exists in the glossary and hasn't been learned) — this is what keeps
    // the term stable across refreshes within the same day, and even across
    // days if the user simply hasn't acted on it yet.
    const stillValid =
      stored.currentFeaturedTermId !== null &&
      !learnedIds.has(stored.currentFeaturedTermId) &&
      glossary.some((t) => t.id === stored.currentFeaturedTermId)

    if (stillValid) return stored

    const next = pickNextFeatured(glossary, learnedIds, today)
    const updated: LearningProgress = {
      ...stored,
      currentFeaturedTermId: next.id,
      featuredTermSelectedDate: next.date,
    }
    writeJSON(STORAGE_KEYS.learningProgress, updated)
    return updated
  })

  // The glossary loads asynchronously (fetched from data/glossary.json), so
  // it's often empty on first render. Once it arrives, re-validate the
  // featured term against the real list instead of the empty array the
  // initializer above saw.
  useEffect(() => {
    if (glossary.length === 0) return
    setProgress((prev) => {
      const learnedIds = new Set(prev.learnedTerms.map((t) => t.termId))
      const stillValid =
        prev.currentFeaturedTermId !== null &&
        !learnedIds.has(prev.currentFeaturedTermId) &&
        glossary.some((t) => t.id === prev.currentFeaturedTermId)
      if (stillValid) return prev

      const next = pickNextFeatured(glossary, learnedIds, editorialToday())
      const updated: LearningProgress = {
        ...prev,
        currentFeaturedTermId: next.id,
        featuredTermSelectedDate: next.date,
      }
      writeJSON(STORAGE_KEYS.learningProgress, updated)
      return updated
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [glossary])

  const learnedIds = useMemo(
    () => new Set(progress.learnedTerms.map((t) => t.termId)),
    [progress.learnedTerms],
  )

  const featuredTerm = useMemo(
    () => glossary.find((t) => t.id === progress.currentFeaturedTermId) ?? null,
    [glossary, progress.currentFeaturedTermId],
  )

  const allLearned = glossary.length > 0 && learnedIds.size >= glossary.length

  const markGotIt = useCallback(
    (termId: string) => {
      setProgress((prev) => {
        if (prev.learnedTerms.some((t) => t.termId === termId)) return prev
        const learnedTerms = [...prev.learnedTerms, { termId, learnedAt: new Date().toISOString() }]
        const nextLearnedIds = new Set(learnedTerms.map((t) => t.termId))
        const next = pickNextFeatured(glossary, nextLearnedIds, editorialToday())
        const updated: LearningProgress = {
          learnedTerms,
          currentFeaturedTermId: next.id,
          featuredTermSelectedDate: next.date,
        }
        writeJSON(STORAGE_KEYS.learningProgress, updated)
        return updated
      })
    },
    [glossary],
  )

  const reviewAgain = useCallback(
    (termId: string) => {
      setProgress((prev) => {
        const learnedTerms = prev.learnedTerms.filter((t) => t.termId !== termId)
        const nextLearnedIds = new Set(learnedTerms.map((t) => t.termId))
        // Only re-pick the featured term if nothing is currently featured;
        // otherwise leave today's featured term alone.
        const shouldRepick = prev.currentFeaturedTermId === null
        const updated: LearningProgress = shouldRepick
          ? {
              learnedTerms,
              currentFeaturedTermId: pickNextFeatured(glossary, nextLearnedIds, editorialToday()).id,
              featuredTermSelectedDate: editorialToday(),
            }
          : { ...prev, learnedTerms }
        writeJSON(STORAGE_KEYS.learningProgress, updated)
        return updated
      })
    },
    [glossary],
  )

  const exportProgress = useCallback((): string => {
    return JSON.stringify(progress, null, 2)
  }, [progress])

  const importProgress = useCallback(
    (json: string): { ok: boolean; added: number; error?: string } => {
      try {
        const parsed = JSON.parse(json)
        if (!parsed || !Array.isArray(parsed.learnedTerms)) {
          return { ok: false, added: 0, error: 'This file does not look like an AI in 5 progress export.' }
        }
        const validTermIds = new Set(glossary.map((t) => t.id))
        const incoming = (parsed.learnedTerms as unknown[]).filter(
          (r): r is { termId: string; learnedAt: string } =>
            !!r &&
            typeof (r as { termId?: unknown }).termId === 'string' &&
            typeof (r as { learnedAt?: unknown }).learnedAt === 'string' &&
            validTermIds.has((r as { termId: string }).termId),
        )
        let added = 0
        setProgress((prev) => {
          const existingIds = new Set(prev.learnedTerms.map((t) => t.termId))
          const merged = [...prev.learnedTerms]
          for (const rec of incoming) {
            if (!existingIds.has(rec.termId)) {
              merged.push(rec)
              existingIds.add(rec.termId)
              added++
            }
          }
          const updated: LearningProgress = { ...prev, learnedTerms: merged }
          writeJSON(STORAGE_KEYS.learningProgress, updated)
          return updated
        })
        return { ok: true, added }
      } catch {
        return { ok: false, added: 0, error: 'Could not read that file as JSON.' }
      }
    },
    [glossary],
  )

  return {
    progress,
    learnedIds,
    featuredTerm,
    allLearned,
    totalCount: glossary.length,
    learnedCount: learnedIds.size,
    markGotIt,
    reviewAgain,
    exportProgress,
    importProgress,
  }
}
