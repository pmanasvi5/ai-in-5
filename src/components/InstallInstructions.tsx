import { useEffect, useRef } from 'react'
import { X, Share, Download, Apple, MonitorDown, ShieldAlert } from 'lucide-react'

interface InstallInstructionsProps {
  onClose: () => void
}

const RELEASES_URL = 'https://github.com/pmanasvi5/ai-in-5/releases/latest'

export function InstallInstructions({ onClose }: InstallInstructionsProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onEscape)
    dialogRef.current?.focus()
    return () => document.removeEventListener('keydown', onEscape)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 p-0 md:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-title"
        onClick={(e) => e.stopPropagation()}
        className="card w-full md:max-w-md max-h-[85vh] overflow-y-auto p-6 rounded-b-none md:rounded-card animate-fade-up"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="install-title" className="text-xl font-extrabold">
            Get AI in 5
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-full hover:bg-accent-light/40 dark:hover:bg-white/5"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-5">
          <section>
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <MonitorDown size={16} /> Mac or Windows — real downloadable app
            </h3>
            <p className="text-sm text-muted-light dark:text-muted-dark mb-3">
              A free, installable desktop app — no browser needed once it's installed.
            </p>
            <a
              href={RELEASES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full justify-center mb-2"
            >
              <Download size={16} /> Download for Mac or Windows
            </a>
            <div className="flex items-start gap-2 text-xs text-muted-light dark:text-muted-dark">
              <ShieldAlert size={14} className="shrink-0 mt-0.5" />
              <span>
                This app isn't code-signed (that requires a paid developer certificate), so your OS will warn
                about an unidentified/unknown publisher the first time. On Mac: right-click the app → Open. On
                Windows: click "More info" → "Run anyway" on the SmartScreen prompt. This is expected for a
                free, independently-distributed app — not a sign anything is wrong.
              </span>
            </div>
          </section>

          <div className="h-px bg-border-light dark:bg-border-dark" />

          <section>
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <Apple size={15} /> iPhone (Safari)
            </h3>
            <p className="text-sm text-muted-light dark:text-muted-dark mb-2">
              Apple doesn't allow installing apps on iPhone from outside the App Store without a paid developer
              account, so on iPhone the closest free equivalent is "Add to Home Screen" — it still gives you a
              full-screen app icon with no Safari bar.
            </p>
            <ol className="text-sm leading-relaxed list-decimal list-inside text-muted-light dark:text-muted-dark space-y-1">
              <li>Open this site in Safari (not Chrome).</li>
              <li>
                Tap the Share icon <Share size={13} className="inline" /> in the toolbar.
              </li>
              <li>
                Scroll down and tap <strong className="text-ink-light dark:text-ink-dark">Add to Home Screen</strong>, then Add.
              </li>
            </ol>
          </section>
        </div>
      </div>
    </div>
  )
}
