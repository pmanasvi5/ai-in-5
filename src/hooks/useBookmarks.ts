import { useCallback, useMemo, useState } from 'react'
import type { BookmarkedStory, NewsStory } from '../types'
import { readJSON, writeJSON, STORAGE_KEYS } from '../utils/storage'

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkedStory[]>(() =>
    readJSON<BookmarkedStory[]>(STORAGE_KEYS.bookmarks, []),
  )

  const bookmarkedIds = useMemo(() => new Set(bookmarks.map((b) => b.storyId)), [bookmarks])

  const toggleBookmark = useCallback((story: NewsStory, digestDate: string) => {
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.storyId === story.id)
      const next = exists
        ? prev.filter((b) => b.storyId !== story.id)
        : [
            ...prev,
            {
              storyId: story.id,
              digestDate,
              bookmarkedAt: new Date().toISOString(),
              snapshot: story,
            },
          ]
      writeJSON(STORAGE_KEYS.bookmarks, next)
      return next
    })
  }, [])

  return { bookmarks, bookmarkedIds, toggleBookmark }
}
