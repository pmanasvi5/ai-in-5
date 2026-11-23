import { RefreshCw, WifiOff, AlertTriangle } from 'lucide-react'
import type { DailyDigest, GlossaryTerm } from '../types'
import { formatDigestDate, formatRelativeUpdate } from '../utils/date'
import { NewsCard } from '../components/NewsCard'
import { NewsCardSkeleton } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'
import { TermOfTheDayCard } from '../components/TermOfTheDayCard'
import { useOnlineStatus } from '../hooks/useOnlineStatus'

interface TodayPageProps {
  digest: DailyDigest | null
  digestState: 'loading' | 'ready' | 'error'
  onRefresh: () => void
  glossary: GlossaryTerm[]
  bookmarkedIds: Set<string>
  onToggleBookmark: (storyId: string) => void
  featuredTerm: GlossaryTerm | null
  onGotIt: (termId: string) => void
}

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning!'
  if (hour < 18) return 'Good afternoon!'
  return 'Good evening!'
}

export function TodayPage({
  digest,
  digestState,
  onRefresh,
  glossary,
  bookmarkedIds,
  onToggleBookmark,
  featuredTerm,
  onGotIt,
}: TodayPageProps) {
  const online = useOnlineStatus()
  const totalReadingTime = digest?.stories.reduce((sum, s) => sum + s.readingTimeMinutes, 0) ?? 0

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold">{greeting()}</h1>
          <button
            type="button"
            onClick={onRefresh}
            aria-label="Check for the newest digest"
            className="p-2 rounded-full hover:bg-accent-light/40 dark:hover:bg-white/5 text-muted-light dark:text-muted-dark transition-colors"
          >
            <RefreshCw size={18} className={digestState === 'loading' ? 'animate-spin' : ''} />
          </button>
        </div>
        <p className="text-muted-light dark:text-muted-dark">
          Here's what's happening in AI today, explained in simple terms.
        </p>
        {digest && (
          <p className="text-sm text-muted-light dark:text-muted-dark mt-1">
            {formatDigestDate(digest.digestDate)} · {digest.stories.length}{' '}
            {digest.stories.length === 1 ? 'story' : 'stories'}
            {totalReadingTime > 0 && ` · ~${totalReadingTime} min read`}
          </p>
        )}
      </section>

      {!online && (
        <div className="flex items-center gap-2 rounded-xl bg-peach/25 px-4 py-3 text-sm">
          <WifiOff size={16} className="shrink-0" />
          You're offline — showing the last digest saved on this device.
        </div>
      )}

      {digest?.status === 'stale' && online && (
        <div className="flex items-center gap-2 rounded-xl bg-peach/25 px-4 py-3 text-sm">
          <AlertTriangle size={16} className="shrink-0" />
          Today's update hasn't come in yet. Showing the last successful digest from{' '}
          {formatRelativeUpdate(digest.lastSuccessfulUpdate)}.
        </div>
      )}

      {featuredTerm && (
        <TermOfTheDayCard term={featuredTerm} onGotIt={onGotIt} compact />
      )}

      {digestState === 'loading' && !digest && (
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <NewsCardSkeleton key={i} />
          ))}
        </div>
      )}

      {digestState === 'error' && !digest && (
        <EmptyState
          icon={AlertTriangle}
          title="Couldn't load today's briefing"
          description="Check your connection and try again. Previously saved stories, if any, will appear here automatically."
          action={
            <button type="button" onClick={onRefresh} className="btn-secondary mt-2">
              Try again
            </button>
          }
        />
      )}

      {digest && digest.stories.length === 0 && (
        <EmptyState
          icon={AlertTriangle}
          title="No qualifying stories today"
          description="We didn't find enough well-sourced AI news to publish a full digest. Check back soon."
        />
      )}

      {digest && digest.stories.length > 0 && (
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
    </div>
  )
}
