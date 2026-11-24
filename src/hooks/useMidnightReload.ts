import { useEffect } from 'react'
import { readJSON, writeJSON } from '../utils/storage'

const LAST_SEEN_DATE_KEY = 'last-seen-local-date'
const MAX_JITTER_MS = 2 * 60 * 1000 // spreads reloads across up to 2 minutes so every open tab doesn't hit the server in the same instant

export function localDateString(now: Date = new Date()): string {
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
}

export function msUntilNextLocalMidnight(now: Date = new Date()): number {
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0)
  return nextMidnight.getTime() - now.getTime()
}

/**
 * Reloads the app automatically once the local calendar day changes, so a
 * tab or desktop-app window left open overnight picks up the next day's
 * digest on its own instead of silently showing yesterday's content.
 *
 * Two mechanisms, because neither is reliable alone:
 * - A timer fires at the next local midnight (+ a little jitter) while the
 *   tab is open and active.
 * - A visibility/focus check catches the case where the tab was backgrounded
 *   or the computer was asleep through midnight, so the timer never fired —
 *   this runs the moment the tab becomes visible again.
 */
export function useMidnightReload() {
  useEffect(() => {
    const stored = readJSON<string | null>(LAST_SEEN_DATE_KEY, null)
    if (stored === null) {
      writeJSON(LAST_SEEN_DATE_KEY, localDateString())
    }

    function reloadIfNewDay() {
      const today = localDateString()
      const lastSeen = readJSON<string | null>(LAST_SEEN_DATE_KEY, today)
      if (lastSeen !== today) {
        writeJSON(LAST_SEEN_DATE_KEY, today)
        window.location.reload()
      }
    }

    const midnightTimer = setTimeout(
      reloadIfNewDay,
      msUntilNextLocalMidnight() + Math.random() * MAX_JITTER_MS,
    )

    function onVisible() {
      if (document.visibilityState === 'visible') reloadIfNewDay()
    }

    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)

    return () => {
      clearTimeout(midnightTimer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [])
}
