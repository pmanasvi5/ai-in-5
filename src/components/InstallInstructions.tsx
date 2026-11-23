import { useEffect, useRef } from 'react'
import { X, Share, Plus, Download } from 'lucide-react'

interface InstallInstructionsProps {
  onClose: () => void
}

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
            Install AI in 5
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

        <p className="text-sm text-muted-light dark:text-muted-dark mb-5">
          AI in 5 is a free web app you can add to your home screen or dock, so it opens just like a regular
          app — no app store needed.
        </p>

        <div className="flex flex-col gap-5">
          <section>
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <Share size={15} /> iPhone (Safari)
            </h3>
            <ol className="text-sm leading-relaxed list-decimal list-inside text-muted-light dark:text-muted-dark space-y-1">
              <li>Open AI in 5 in Safari.</li>
              <li>
                Tap the Share icon <Share size={13} className="inline" /> in the toolbar.
              </li>
              <li>
                Scroll down and tap <strong className="text-ink-light dark:text-ink-dark">Add to Home Screen</strong>.
              </li>
              <li>Tap Add. The app icon will appear on your home screen.</li>
            </ol>
          </section>

          <section>
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <Plus size={15} /> macOS (Safari)
            </h3>
            <ol className="text-sm leading-relaxed list-decimal list-inside text-muted-light dark:text-muted-dark space-y-1">
              <li>Open AI in 5 in Safari.</li>
              <li>
                From the menu bar choose <strong className="text-ink-light dark:text-ink-dark">File → Add to Dock</strong>{' '}
                (on versions of Safari that support it).
              </li>
              <li>The app opens in its own window from your Dock from then on.</li>
            </ol>
          </section>

          <section>
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <Download size={15} /> Windows (Edge or Chrome)
            </h3>
            <ol className="text-sm leading-relaxed list-decimal list-inside text-muted-light dark:text-muted-dark space-y-1">
              <li>Open AI in 5 in Microsoft Edge or Chrome.</li>
              <li>
                Click the <strong className="text-ink-light dark:text-ink-dark">install icon</strong> in the address
                bar (or the menu → <strong className="text-ink-light dark:text-ink-dark">Apps → Install this site as an app</strong>).
              </li>
              <li>Confirm — it now opens in its own app window from your Start menu or taskbar.</li>
            </ol>
          </section>
        </div>

        <p className="text-xs text-muted-light dark:text-muted-dark mt-5">
          AI in 5 is distributed only as a web app at this time — it isn't listed in the Apple App Store or
          Microsoft Store.
        </p>
      </div>
    </div>
  )
}
