import { useState } from 'react'
import { Sparkles, Check } from 'lucide-react'
import type { GlossaryTerm } from '../types'

interface TermOfTheDayCardProps {
  term: GlossaryTerm
  onGotIt: (termId: string) => void
  compact?: boolean
}

const CONFETTI = [
  { color: 'bg-coral', x: -36, y: -28, delay: 0 },
  { color: 'bg-teal', x: 32, y: -34, delay: 60 },
  { color: 'bg-amber', x: -44, y: 10, delay: 120 },
  { color: 'bg-accent', x: 40, y: 16, delay: 90 },
]

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
    <div className="card overflow-hidden relative">
      <div className="h-1.5 bg-gradient-to-r from-accent via-plum to-coral" aria-hidden="true" />
      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-accent dark:text-accent-dark">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent-light dark:bg-accent/20">
            <Sparkles size={13} />
          </span>
          <span className="text-xs font-bold uppercase tracking-wide">AI Term of the Day</span>
        </div>

        <div>
          <h3 className="font-display text-2xl font-semibold mb-1.5">{term.term}</h3>
          <p className="text-sm leading-relaxed text-ink-light dark:text-ink-dark">{term.definition}</p>
        </div>

        {!compact && (
          <>
            <div className="rounded-xl bg-teal-light dark:bg-teal/10 p-3.5">
              <p className="text-xs font-bold uppercase tracking-wide text-teal dark:text-teal-dark mb-1">Everyday example</p>
              <p className="text-sm leading-relaxed">{term.everydayExample}</p>
            </div>
            <div className="rounded-xl bg-coral-light dark:bg-coral/10 p-3.5">
              <p className="text-xs font-bold uppercase tracking-wide text-coral dark:text-coral-dark mb-1">Why it matters</p>
              <p className="text-sm leading-relaxed">{term.whyItMatters}</p>
            </div>
          </>
        )}

        <div className="relative self-start">
          {celebrating &&
            CONFETTI.map((c, i) => (
              <span
                key={i}
                className={`absolute w-2 h-2 rounded-full ${c.color} animate-confetti-pop pointer-events-none`}
                style={{
                  left: `calc(50% + ${c.x}px)`,
                  top: `calc(50% + ${c.y}px)`,
                  animationDelay: `${c.delay}ms`,
                }}
                aria-hidden="true"
              />
            ))}
          <button type="button" onClick={handleGotIt} disabled={celebrating} className="btn-primary mt-1">
            {celebrating ? (
              <>
                <Check size={18} className="animate-pop-in" /> Nice!
              </>
            ) : (
              'Got it! ✓'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
