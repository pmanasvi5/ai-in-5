import { Check } from 'lucide-react'

interface Stage {
  label: string
  done: boolean
}

interface DailyJourneyProgressProps {
  stages: Stage[]
}

/** A small, unobtrusive 4-stage indicator — never a gate. All content stays reachable regardless of stage completion. */
export function DailyJourneyProgress({ stages }: DailyJourneyProgressProps) {
  const doneCount = stages.filter((s) => s.done).length
  const allDone = doneCount === stages.length

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        {stages.map((stage, i) => (
          <div
            key={i}
            title={stage.label}
            className={`flex-1 h-1.5 rounded-full transition-colors duration-300 ${
              stage.done ? 'bg-teal' : 'bg-accent-light/60 dark:bg-white/10'
            }`}
          />
        ))}
      </div>
      {allDone ? (
        <div className="flex items-center gap-2 text-sm text-teal font-semibold animate-fade-up">
          <Check size={15} /> You're all caught up on AI for today!
        </div>
      ) : (
        <p className="text-xs text-muted-light dark:text-muted-dark">
          {stages.filter((s) => !s.done).map((s) => s.label).join(' · ')}
        </p>
      )}
    </div>
  )
}
