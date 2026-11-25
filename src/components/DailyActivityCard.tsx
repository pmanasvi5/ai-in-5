import { useState } from 'react'
import { Lightbulb, Copy, Check, RotateCcw } from 'lucide-react'
import type { DailyActivity } from '../types'

interface DailyActivityCardProps {
  activity: DailyActivity
  done: boolean
  onMarkDone: () => void
  onMarkNotDone: () => void
}

export function DailyActivityCard({ activity, done, onMarkDone, onMarkNotDone }: DailyActivityCardProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(activity.tryThis)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard unavailable; no further action possible silently.
    }
  }

  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2 text-amber dark:text-amber-dark">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber/10">
          <Lightbulb size={13} />
        </span>
        <span className="text-xs font-bold uppercase tracking-wide">AI in Real Life</span>
      </div>
      <p className="text-xs text-muted-light dark:text-muted-dark -mt-2">One small way to make AI useful today.</p>

      <h3 className="font-display text-lg font-semibold">{activity.title}</h3>
      <p className="text-sm text-muted-light dark:text-muted-dark">{activity.learningObjective}</p>

      <div className="rounded-xl bg-amber-light dark:bg-amber/10 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-amber dark:text-amber-dark mb-1.5">Try this</p>
        <p className="text-sm leading-relaxed font-medium">{activity.tryThis}</p>
      </div>

      <p className="text-sm leading-relaxed text-muted-light dark:text-muted-dark">
        <span className="font-bold text-ink-light dark:text-ink-dark">Why it works: </span>
        {activity.whyItWorks}
      </p>

      <p className="text-xs text-muted-light dark:text-muted-dark">
        A reminder: avoid pasting sensitive personal, medical, financial, or confidential work details into AI
        tools, and double-check anything important the AI tells you.
      </p>

      <div className="flex items-center gap-2 flex-wrap">
        <button type="button" onClick={handleCopy} className="btn-secondary text-sm px-4 py-2">
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy prompt'}
        </button>
        {done ? (
          <button type="button" onClick={onMarkNotDone} className="btn-secondary text-sm px-4 py-2 text-teal">
            <Check size={14} /> Done for today
          </button>
        ) : (
          <button type="button" onClick={onMarkDone} className="btn-primary text-sm px-4 py-2">
            Mark done for today
          </button>
        )}
        {done && (
          <span className="text-xs text-muted-light dark:text-muted-dark flex items-center gap-1">
            <RotateCcw size={12} /> Tap again to undo
          </span>
        )}
      </div>
    </div>
  )
}
