import { useState } from 'react'
import { RefreshCw, WifiOff, AlertTriangle, ArrowDown, Sparkles } from 'lucide-react'
import type { DailyDigest, GlossaryTerm } from '../types'
import { formatDigestDate, formatRelativeUpdate } from '../utils/date'
import { NewsCard } from '../components/NewsCard'
import { NewsCardSkeleton } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'
import { TermOfTheDayCard } from '../components/TermOfTheDayCard'
import { ReadingProgress } from '../components/ReadingProgress'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useReadTracking } from '../hooks/useReadTracking'

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
  const [showMore, setShowMore] = useState(false)
  const { readIds, markRead } = useReadTracking(digest?.digestDate)
  const totalReadingTime = digest?.stories.reduce((sum, s) => sum + s.readingTimeMinutes, 0) ?? 0
  const moreStories = digest?.moreStories ?? []

  function scrollToStories() {
    document.getElementById('todays-stories')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">{greeting()}</h1>
          <button
            type="button"
            onClick={onRefresh}
            aria-label="Check for the newest digest"
            className="p-2 rounded-full hover:bg-accent-light/40 dark:hover:bg-white/5 text-muted-light dark:text-muted-dark transition-colors"
          >
            <RefreshCw size={18} className={digestState === 'loading' ? 'animate-spin' : ''} />
          </button>
        </div>
        <p className="text-muted-light dark:text-muted-dark text-lg">
          Here's what's happening in AI today — explained like a friend would tell you over coffee.
        </p>
        {digest && (
          <div className="flex flex-wrap items-center justify-between gap-y-2 mt-1">
            <p className="text-sm text-muted-light dark:text-muted-dark">
              {formatDigestDate(digest.digestDate)} · {digest.stories.length}{' '}
              {digest.stories.length === 1 ? 'story' : 'stories'}
              {totalReadingTime > 0 && ` · ~${totalReadingTime} min read`}
            </p>
            <ReadingProgress read={readIds.size} total={digest.stories.length} />
          </div>
        )}
        {digest && digest.stories.length > 0 && (
          <button
            type="button"
            onClick={scrollToStories}
            className="btn-primary self-start mt-2 text-sm px-4 py-2"
          >
            Read today's 5 <ArrowDown size={14} />
          </button>
        )}
      </section>

      {!online && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-light dark:bg-amber/10 px-4 py-3 text-sm">
          <WifiOff size={16} className="shrink-0" />
          You're offline — showing the last digest saved on this device.
        </div>
      )}

      {digest?.status === 'stale' && online && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-light dark:bg-amber/10 px-4 py-3 text-sm">
          <AlertTriangle size={16} className="shrink-0" />
          Today's update hasn't come in yet. Showing the last successful digest from{' '}
          {formatRelativeUpdate(digest.lastSuccessfulUpdate)}.
        </div>
      )}

      {featuredTerm && <TermOfTheDayCard term={featuredTerm} onGotIt={onGotIt} compact />}

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
        <div id="todays-stories" className="flex flex-col gap-4 scroll-mt-20">
          {digest.stories.map((story, i) => (
            <NewsCard
              key={story.id}
              story={story}
              index={i}
              featured={i === 0}
              glossary={glossary}
              isBookmarked={bookmarkedIds.has(story.id)}
              onToggleBookmark={() => onToggleBookmark(story.id)}
              onExpand={() => markRead(story.id)}
            />
          ))}

          {moreStories.length > 0 && !showMore && (
            <button
              type="button"
              onClick={() => setShowMore(true)}
              className="btn-coral self-center mt-2"
            >
              <Sparkles size={16} /> Give me 5 more
            </button>
          )}

          {showMore &&
            moreStories.map((story, i) => (
              <NewsCard
                key={story.id}
                story={story}
                index={digest.stories.length + i}
                glossary={glossary}
                isBookmarked={bookmarkedIds.has(story.id)}
                onToggleBookmark={() => onToggleBookmark(story.id)}
                onExpand={() => markRead(story.id)}
              />
            ))}
        </div>
      )}
    </div>
  )
}
