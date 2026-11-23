import { useState } from 'react'
import { ChevronDown, Bookmark, ExternalLink } from 'lucide-react'
import type { GlossaryTerm, NewsStory } from '../types'
import { formatPublishedAt } from '../utils/date'
import { HighlightedText } from './HighlightedText'
import { ShareButton } from './ShareButton'

interface NewsCardProps {
  story: NewsStory
  index: number
  glossary: GlossaryTerm[]
  isBookmarked: boolean
  onToggleBookmark: () => void
  defaultOpen?: boolean
}

const CATEGORY_STYLES: Record<string, string> = {
  'New Models': 'bg-accent-light text-accent dark:bg-accent/20 dark:text-accent-dark',
  'Tools & Apps': 'bg-sage/25 text-ink-light dark:text-ink-dark',
  'Company News': 'bg-peach/30 text-ink-light dark:text-ink-dark',
  'Business & Work': 'bg-accent-light text-accent dark:bg-accent/20 dark:text-accent-dark',
  'Policy & Regulation': 'bg-peach/30 text-ink-light dark:text-ink-dark',
  'Safety & Security': 'bg-sage/25 text-ink-light dark:text-ink-dark',
  Research: 'bg-accent-light text-accent dark:bg-accent/20 dark:text-accent-dark',
  'Health & Education': 'bg-sage/25 text-ink-light dark:text-ink-dark',
}

export function NewsCard({ story, index, glossary, isBookmarked, onToggleBookmark, defaultOpen }: NewsCardProps) {
  const [open, setOpen] = useState(!!defaultOpen)

  return (
    <article className="card overflow-hidden animate-fade-up" style={{ animationDelay: `${index * 40}ms` }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full text-left p-5 flex flex-col gap-3"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-accent/10 text-accent text-sm font-bold shrink-0">
              {index + 1}
            </span>
            <span className={`pill ${CATEGORY_STYLES[story.category] ?? 'bg-accent-light text-accent'}`}>
              {story.category}
            </span>
          </div>
          <ChevronDown
            size={20}
            className={`text-muted-light dark:text-muted-dark transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}
          />
        </div>

        <h3 className="text-lg font-bold leading-snug">{story.headline}</h3>

        <div className="flex items-center justify-between text-sm text-muted-light dark:text-muted-dark">
          <span>{formatPublishedAt(story.publishedAt, story.source)}</span>
          <span>{story.readingTimeMinutes} min read</span>
        </div>

        {!open && (
          <p className="text-sm text-muted-light dark:text-muted-dark line-clamp-2">{story.summary[0]}</p>
        )}
      </button>

      {open && (
        <div className="px-5 pb-5 flex flex-col gap-4 animate-fade-up">
          <ul className="flex flex-col gap-2.5">
            {story.summary.map((point, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                <span>
                  <HighlightedText text={point} keyTermIds={story.keyTerms} glossary={glossary} />
                </span>
              </li>
            ))}
          </ul>

          <div className="rounded-xl bg-accent-light/50 dark:bg-accent/10 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-accent mb-1">Why it matters</p>
            <p className="text-sm leading-relaxed">{story.whyItMatters}</p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <a
              href={story.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
            >
              Read original <ExternalLink size={14} />
            </a>
            <div className="flex items-center gap-4">
              <ShareButton title={story.headline} url={story.originalUrl} />
              <button
                type="button"
                onClick={onToggleBookmark}
                aria-label={isBookmarked ? 'Remove bookmark' : 'Save this story'}
                aria-pressed={isBookmarked}
                className="flex items-center gap-1.5 text-sm text-muted-light dark:text-muted-dark hover:text-accent transition-colors"
              >
                <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} className={isBookmarked ? 'text-accent' : ''} />
                {isBookmarked ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  )
}
