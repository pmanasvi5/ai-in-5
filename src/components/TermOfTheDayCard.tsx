import { useState } from 'react'
import { Sparkles, Check } from 'lucide-react'
import type { GlossaryTerm } from '../types'

interface TermOfTheDayCardProps {
  term: GlossaryTerm
  onGotIt: (termId: string) => void
  compact?: boolean
}

export function TermOfTheDayCard({ term, onGotIt, compact }: TermOfTheDayCardProps) {
  const [celebrating, setCelebrating] = useState(false)

  function handleGotIt() {
    setCelebrating(true)
    setTimeout(() => {
      onGotIt(term.id)
      setCelebrating(false)
    }, 650)
  }

  return (
    <div className="card p-5 flex flex-col gap-4 relative overflow-hidden">
      <div className="flex items-center gap-2 text-accent">
        <Sparkles size={16} />
        <span className="text-xs font-bold uppercase tracking-wide">AI Term of the Day</span>
      </div>

      <div>
        <h3 className="text-xl font-extrabold mb-1.5">{term.term}</h3>
        <p className="text-sm leading-relaxed text-ink-light dark:text-ink-dark">{term.definition}</p>
      </div>

      {!compact && (
        <>
          <div className="rounded-xl bg-sage/15 p-3.5">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-light dark:text-muted-dark mb-1">
              Everyday example
            </p>
            <p className="text-sm leading-relaxed">{term.everydayExample}</p>
          </div>
          <div className="rounded-xl bg-accent-light/50 dark:bg-accent/10 p-3.5">
            <p className="text-xs font-bold uppercase tracking-wide text-accent mb-1">Why it matters</p>
            <p className="text-sm leading-relaxed">{term.whyItMatters}</p>
          </div>
        </>
      )}

      <button
        type="button"
        onClick={handleGotIt}
        disabled={celebrating}
        className="btn-primary self-start mt-1"
      >
        {celebrating ? (
          <>
            <Check size={18} className="animate-pop-in" /> Nice!
          </>
        ) : (
          'Got it! ✓'
        )}
      </button>
    </div>
  )
}
