import { X, Share, Plus } from 'lucide-react'
import { Logo } from './Logo'

interface IosInstallBannerProps {
  onDismiss: () => void
}

/** A self-surfacing nudge for iPhone Safari visitors, since iOS gives installable web apps no native "Install" banner of its own — unlike Chrome/Edge, which prompt automatically. */
export function IosInstallBanner({ onDismiss }: IosInstallBannerProps) {
  return (
    <div
      role="dialog"
      aria-label="Install AI in 5"
      className="fixed left-3 right-3 z-40 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] md:bottom-4 md:left-auto md:right-4 md:w-80 animate-fade-up"
    >
      <div className="card p-4 flex items-start gap-3 shadow-soft dark:shadow-softDark">
        <Logo size={36} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm mb-0.5">Install AI in 5</p>
          <p className="text-xs text-muted-light dark:text-muted-dark leading-relaxed">
            Tap <Share size={12} className="inline -mt-0.5" /> Share, then{' '}
            <span className="inline-flex items-center gap-0.5 font-medium text-ink-light dark:text-ink-dark">
              <Plus size={12} /> Add to Home Screen
            </span>
            .
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="p-1 -m-1 rounded-full text-muted-light dark:text-muted-dark hover:bg-accent-light/40 dark:hover:bg-white/5 shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
