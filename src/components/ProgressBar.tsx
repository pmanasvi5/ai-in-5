interface ProgressBarProps {
  current: number
  total: number
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0
  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between mb-2">
        <p className="font-semibold">
          {current} of {total} AI terms learned
        </p>
        <p className="text-sm font-bold text-accent">{pct}%</p>
      </div>
      <div className="h-2.5 rounded-full bg-accent-light/60 dark:bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-sm text-muted-light dark:text-muted-dark mt-2.5">
        You're building your AI vocabulary, one term at a time!
      </p>
    </div>
  )
}
