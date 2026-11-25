import { useMemo, useState } from 'react'
import { Archive, ChevronLeft, Search } from 'lucide-react'
import type { GlossaryTerm } from '../types'
import { useArchiveIndex, useArchivedDigest } from '../hooks/useArchive'
import { useSearchIndex } from '../hooks/useSearchIndex'
import { formatDigestDate } from '../utils/date'
import { categoryPillClass } from '../utils/categoryStyles'
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
  const { entries: searchEntries, loading: searchLoading } = useSearchIndex()
  const [selected, setSelected] = useState<string | null>(null)
  const { digest, loading: digestLoading } = useArchivedDigest(selected)
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return searchEntries.filter(
      (e) =>
        e.headline.toLowerCase().includes(q) ||
        e.source.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.keyTerms.some((t) => t.replace(/-/g, ' ').includes(q)),
    )
  }, [query, searchEntries])

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
        <h1 className="text-2xl font-extrabold mb-1">Explore</h1>
        <p className="text-muted-light dark:text-muted-dark">Search past AI news, or browse previous briefings.</p>
      </section>

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-light dark:text-muted-dark" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search headlines, sources, topics..."
          aria-label="Search AI news archive"
          className="w-full rounded-full border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {query.trim() ? (
        <div className="flex flex-col gap-2">
          {searchLoading && <p className="text-sm text-muted-light dark:text-muted-dark">Loading search index…</p>}
          {!searchLoading && results.length === 0 && (
            <EmptyState icon={Search} title="No matches" description="Try a different search term." />
          )}
          {results.map((r) => (
            <button
              key={`${r.digestDate}-${r.id}`}
              type="button"
              onClick={() => setSelected(r.digestDate)}
              className="card p-4 flex flex-col gap-1.5 text-left hover:border-accent/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className={`pill ${categoryPillClass(r.category)}`}>{r.category}</span>
                <span className="text-xs text-muted-light dark:text-muted-dark">{formatDigestDate(r.digestDate)}</span>
              </div>
              <span className="font-semibold">{r.headline}</span>
              <span className="text-xs text-muted-light dark:text-muted-dark">{r.source}</span>
            </button>
          ))}
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  )
}
