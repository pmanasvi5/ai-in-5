export function NewsCardSkeleton() {
  return (
    <div className="card p-5 flex flex-col gap-3 animate-pulse">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-border-light dark:bg-border-dark" />
        <div className="h-5 w-24 rounded-full bg-border-light dark:bg-border-dark" />
      </div>
      <div className="h-5 w-4/5 rounded bg-border-light dark:bg-border-dark" />
      <div className="h-4 w-3/5 rounded bg-border-light dark:bg-border-dark" />
      <div className="h-3 w-full rounded bg-border-light dark:bg-border-dark" />
    </div>
  )
}

export function TermCardSkeleton() {
  return (
    <div className="card p-5 flex flex-col gap-3 animate-pulse">
      <div className="h-4 w-32 rounded-full bg-border-light dark:bg-border-dark" />
      <div className="h-6 w-2/5 rounded bg-border-light dark:bg-border-dark" />
      <div className="h-3 w-full rounded bg-border-light dark:bg-border-dark" />
      <div className="h-3 w-5/6 rounded bg-border-light dark:bg-border-dark" />
    </div>
  )
}
