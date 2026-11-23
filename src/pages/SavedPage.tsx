import { Bookmark } from 'lucide-react'
import type { BookmarkedStory, GlossaryTerm } from '../types'
import { NewsCard } from '../components/NewsCard'
import { EmptyState } from '../components/EmptyState'

interface SavedPageProps {
  bookmarks: BookmarkedStory[]
  glossary: GlossaryTerm[]
  onToggleBookmark: (storyId: string) => void
}

export function SavedPage({ bookmarks, glossary, onToggleBookmark }: SavedPageProps) {
  const sorted = [...bookmarks].sort((a, b) => b.bookmarkedAt.localeCompare(a.bookmarkedAt))

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-2xl font-extrabold mb-1">Saved</h1>
        <p className="text-muted-light dark:text-muted-dark">
          Stories you've bookmarked to read again. Saved on this device only.
        </p>
      </section>

      {sorted.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Nothing saved yet"
          description="Tap the Save button on any story from Today to keep it here."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {sorted.map((bookmark, i) => (
            <NewsCard
              key={bookmark.storyId}
              story={bookmark.snapshot}
              index={i}
              glossary={glossary}
              isBookmarked
              onToggleBookmark={() => onToggleBookmark(bookmark.storyId)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
