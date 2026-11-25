// Thin, typed wrapper around localStorage. Every key is namespaced so the
// app never collides with other data on the same origin, and every read is
// defensive since localStorage can be unavailable (Safari private mode) or
// hold malformed JSON from a previous app version.

const PREFIX = 'ai-in-5:'

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // Storage full or unavailable; the app degrades to in-memory state only.
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    // ignore
  }
}

export const STORAGE_KEYS = {
  learningProgress: 'learning-progress',
  bookmarks: 'bookmarks',
  preferences: 'preferences',
  readStoryIds: 'read-story-ids',
  theme: 'theme',
  challengeProgress: 'challenge-progress',
  activityProgress: 'activity-progress',
  dailyJourney: 'daily-journey',
  milestonesSeen: 'milestones-seen',
} as const
