import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-16 px-6">
      <div className="w-14 h-14 rounded-full bg-accent-light/60 dark:bg-accent/10 flex items-center justify-center text-accent">
        <Icon size={26} />
      </div>
      <h3 className="font-bold text-lg">{title}</h3>
      <p className="text-sm text-muted-light dark:text-muted-dark max-w-xs">{description}</p>
      {action}
    </div>
  )
}
