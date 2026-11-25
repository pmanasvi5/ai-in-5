import { useState } from 'react'
import { ChevronDown, Bookmark, ExternalLink, History, Wand2 } from 'lucide-react'
import type { GlossaryTerm, NewsStory } from '../types'
import { formatPublishedAt, formatDigestDate } from '../utils/date'
import { categoryPillClass, categoryBarClass } from '../utils/categoryStyles'
import { HighlightedText } from './HighlightedText'
import { ShareButton } from './ShareButton'

interface NewsCardProps {
  story: NewsStory
  index: number
  glossary: GlossaryTerm[]
  isBookmarked: boolean
  onToggleBookmark: () => void
  defaultOpen?: boolean
  featured?: boolean
  onExpand?: () => void
}

export function NewsCard({
  story,
  index,
  glossary,
  isBookmarked,
  onToggleBookmark,
  defaultOpen,
  featured,
  onExpand,
}: NewsCardProps) {
  const [open, setOpen] = useState(!!defaultOpen)
  const [showSimpler, setShowSimpler] = useState(false)
  const [showTimeline, setShowTimeline] = useState(false)
  const barClass = categoryBarClass(story.category)

  function toggleOpen() {
    setOpen((o) => {
      const next = !o
      if (next) onExpand?.()
      return next
    })
  }

  return (
    <article
      className={`card card-interactive relative overflow-hidden animate-fade-up ${featured ? 'pl-1.5' : 'pl-1'}`}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <span className={`absolute left-0 top-0 bottom-0 w-1.5 ${barClass}`} aria-hidden="true" />
      <button
        type="button"
        onClick={toggleOpen}
        aria-expanded={open}
        className={`w-full text-left flex flex-col gap-3 ${featured ? 'p-6' : 'p-5'}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            {!featured && (
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-accent/10 text-accent text-sm font-bold shrink-0">
                {index + 1}
              </span>
            )}
            <span className={`pill ${categoryPillClass(story.category)}`}>{story.category}</span>
            {featured && (
              <span className="pill bg-ink-light text-bg-light dark:bg-ink-dark dark:text-bg-dark">Today's top story</span>
            )}
            {story.followUpLabel && (
              <span className="pill bg-plum-light text-plum dark:bg-plum/20 dark:text-plum-dark">{story.followUpLabel}</span>
            )}
          </div>
          <ChevronDown
            size={20}
            className={`text-muted-light dark:text-muted-dark transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}
          />
        </div>

        <h3 className={`font-display font-semibold leading-snug ${featured ? 'text-3xl' : 'text-lg'}`}>
          {story.headline}
        </h3>

        <div className="flex items-center justify-between text-sm text-muted-light dark:text-muted-dark">
          <span>{formatPublishedAt(story.publishedAt, story.source)}</span>
          <span>{story.readingTimeMinutes} min read</span>
        </div>

        {!open && (
          <p className={`text-muted-light dark:text-muted-dark ${featured ? 'text-base leading-relaxed' : 'text-sm line-clamp-2'}`}>
            {story.quickScoop ?? story.summary[0]}
          </p>
        )}
      </button>

      {open && (
        <div className={`flex flex-col gap-4 animate-fade-up ${featured ? 'px-6 pb-6' : 'px-5 pb-5'}`}>
          {story.previousMentions && story.previousMentions.length > 0 && (
            <div className="rounded-xl border border-border-light dark:border-border-dark p-3.5">
              <button
                type="button"
                onClick={() => setShowTimeline((s) => !s)}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-plum dark:text-plum-dark w-full"
              >
                <History size={14} /> Previously on AI...
                <ChevronDown size={14} className={`ml-auto transition-transform ${showTimeline ? 'rotate-180' : ''}`} />
              </button>
              {showTimeline && (
                <ol className="mt-3 flex flex-col gap-2.5 animate-fade-up">
                  {story.previousMentions.map((m, i) => (
                    <li key={i} className="text-sm leading-relaxed">
                      <span className="text-muted-light dark:text-muted-dark">{formatDigestDate(m.date)}: </span>
                      <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                        {m.headline}
                      </a>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}

          {story.quickScoop && (
            <div>
              <p className="text-base leading-relaxed">
                <HighlightedText
                  text={showSimpler && story.simplerExplanation ? story.simplerExplanation : story.quickScoop}
                  keyTermIds={story.keyTerms}
                  glossary={glossary}
                />
              </p>
              {story.simplerExplanation && (
                <button
                  type="button"
                  onClick={() => setShowSimpler((s) => !s)}
                  className="flex items-center gap-1.5 text-xs font-medium text-accent hover:underline mt-2"
                >
                  <Wand2 size={12} /> {showSimpler ? 'Show original' : 'Explain it simpler'}
                </button>
              )}
            </div>
          )}

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-light dark:text-muted-dark mb-2">
              The five key takeaways
            </p>
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
          </div>

          <div className="rounded-xl bg-accent-light/50 dark:bg-accent/10 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-accent mb-1">Why you should care</p>
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
