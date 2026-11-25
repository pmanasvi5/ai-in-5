import { PartyPopper } from 'lucide-react'

interface ReadingProgressProps {
  read: number
  total: number
}

export function ReadingProgress({ read, total }: ReadingProgressProps) {
  if (total === 0) return null
  const complete = read >= total

  return (
    <div className="flex items-center gap-2.5" aria-live="polite">
      <div className="flex-1 h-1.5 rounded-full bg-accent-light/60 dark:bg-white/10 overflow-hidden max-w-[120px]">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${complete ? 'bg-teal' : 'bg-accent'}`}
          style={{ width: `${Math.min(100, (read / total) * 100)}%` }}
        />
      </div>
      {complete ? (
        <span className="flex items-center gap-1 text-xs font-semibold text-teal animate-pop-in">
          <PartyPopper size={13} /> All caught up!
        </span>
      ) : (
        <span className="text-xs text-muted-light dark:text-muted-dark whitespace-nowrap">
          {read} of {total} read
        </span>
      )}
    </div>
  )
}
