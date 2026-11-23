import { useState } from 'react'
import { Archive, ChevronLeft } from 'lucide-react'
import type { GlossaryTerm } from '../types'
import { useArchiveIndex, useArchivedDigest } from '../hooks/useArchive'
import { formatDigestDate } from '../utils/date'
import { NewsCard } from '../components/NewsCard'
import { EmptyState } from '../components/EmptyState'
import { NewsCardSkeleton } from '../components/Skeleton'

interface ArchivePageProps {
  glossary: GlossaryTerm[]
  bookmarkedIds: Set<string>
  onToggleBookmark: (storyId: string) => void
}

export function ArchivePage({ glossary, bookmarkedIds, onToggleBookmark }: ArchivePageProps) {
  const { entries, loading: indexLoading } = useArchiveIndex()
  const [selected, setSelected] = useState<string | null>(null)
  const { digest, loading: digestLoading } = useArchivedDigest(selected)

  if (selected) {
    return (
      <div className="flex flex-col gap-6">
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-light dark:text-muted-dark hover:text-accent"
        >
          <ChevronLeft size={16} /> All briefings
        </button>

        <h1 className="text-2xl font-extrabold">{formatDigestDate(selected)}</h1>

        {digestLoading && (
          <div className="flex flex-col gap-4">
            <NewsCardSkeleton />
            <NewsCardSkeleton />
          </div>
        )}

        {!digestLoading && digest && (
          <div className="flex flex-col gap-4">
            {digest.stories.map((story, i) => (
              <NewsCard
                key={story.id}
                story={story}
                index={i}
                glossary={glossary}
                isBookmarked={bookmarkedIds.has(story.id)}
                onToggleBookmark={() => onToggleBookmark(story.id)}
              />
            ))}
          </div>
        )}

        {!digestLoading && !digest && (
          <EmptyState icon={Archive} title="Couldn't load this briefing" description="It may not have been generated yet." />
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-2xl font-extrabold mb-1">Archive</h1>
        <p className="text-muted-light dark:text-muted-dark">Browse previous daily briefings.</p>
      </section>

      {!indexLoading && entries.length === 0 && (
        <EmptyState icon={Archive} title="No past briefings yet" description="Once a few days have passed, they'll show up here." />
      )}

      <div className="flex flex-col gap-2">
        {entries.map((entry) => (
          <button
            key={entry.digestDate}
            type="button"
            onClick={() => setSelected(entry.digestDate)}
            className="card p-4 flex items-center justify-between text-left hover:border-accent/50 transition-colors"
          >
            <span className="font-semibold">{formatDigestDate(entry.digestDate)}</span>
            <span className="text-sm text-muted-light dark:text-muted-dark">
              {entry.storyCount} {entry.storyCount === 1 ? 'story' : 'stories'}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
