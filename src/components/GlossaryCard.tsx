import { useState } from 'react'
import { ChevronDown, Check, RotateCcw } from 'lucide-react'
import type { GlossaryTerm } from '../types'
import { formatLearnedDate } from '../utils/date'

interface GlossaryCardProps {
  term: GlossaryTerm
  isLearned: boolean
  learnedAt?: string
  onGotIt?: (id: string) => void
  onReviewAgain?: (id: string) => void
}

export function GlossaryCard({ term, isLearned, learnedAt, onGotIt, onReviewAgain }: GlossaryCardProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full text-left p-4 flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {isLearned && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-sage/40 text-ink-light shrink-0">
              <Check size={12} strokeWidth={3} />
            </span>
          )}
          <span className="font-semibold truncate">{term.term}</span>
        </div>
        <ChevronDown size={18} className={`text-muted-light dark:text-muted-dark shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 flex flex-col gap-3 text-sm animate-fade-up">
          <p className="leading-relaxed">{term.definition}</p>
          <div className="rounded-xl bg-sage/15 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-light dark:text-muted-dark mb-1">Example</p>
            <p className="leading-relaxed">{term.everydayExample}</p>
          </div>
          <div className="rounded-xl bg-accent-light/50 dark:bg-accent/10 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-accent mb-1">Why it matters</p>
            <p className="leading-relaxed">{term.whyItMatters}</p>
          </div>

          {isLearned && learnedAt && (
            <p className="text-xs text-muted-light dark:text-muted-dark">Learned on {formatLearnedDate(learnedAt)}</p>
          )}

          <div className="flex gap-2">
            {!isLearned && onGotIt && (
              <button type="button" onClick={() => onGotIt(term.id)} className="btn-primary text-sm px-4 py-2">
                Got it! ✓
              </button>
            )}
            {isLearned && onReviewAgain && (
              <button
                type="button"
                onClick={() => onReviewAgain(term.id)}
                className="btn-secondary text-sm px-4 py-2"
              >
                <RotateCcw size={14} /> Review again
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
