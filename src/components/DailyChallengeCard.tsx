import { useState } from 'react'
import { Check, X, HelpCircle } from 'lucide-react'
import type { DailyChallenge } from '../types'

interface DailyChallengeCardProps {
  challenge: DailyChallenge
  savedAnswer?: { selectedIndex: number; correct: boolean }
  onAnswer: (selectedIndex: number, correctIndex: number) => void
}

export function DailyChallengeCard({ challenge, savedAnswer, onAnswer }: DailyChallengeCardProps) {
  const [selected, setSelected] = useState<number | null>(savedAnswer?.selectedIndex ?? null)
  const answered = selected !== null

  function handleSelect(index: number) {
    if (answered) return
    setSelected(index)
    onAnswer(index, challenge.correctIndex)
  }

  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2 text-plum dark:text-plum-dark">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-plum/10">
          <HelpCircle size={13} />
        </span>
        <span className="text-xs font-bold uppercase tracking-wide">Today's AI Challenge</span>
      </div>

      <p className="font-display text-lg font-semibold leading-snug">{challenge.question}</p>

      <div className="flex flex-col gap-2">
        {challenge.choices.map((choice, i) => {
          const isCorrect = i === challenge.correctIndex
          const isSelected = i === selected
          let stateClass = 'border-border-light dark:border-border-dark hover:border-accent/50'
          if (answered) {
            if (isCorrect) stateClass = 'border-teal bg-teal-light dark:bg-teal/10'
            else if (isSelected) stateClass = 'border-coral bg-coral-light dark:bg-coral/10'
            else stateClass = 'border-border-light dark:border-border-dark opacity-60'
          }
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(i)}
              disabled={answered}
              aria-pressed={isSelected}
              className={`flex items-center gap-2.5 text-left rounded-xl border px-4 py-3 text-sm transition-colors disabled:cursor-default ${stateClass}`}
            >
              {answered && isCorrect && <Check size={16} className="text-teal shrink-0" />}
              {answered && isSelected && !isCorrect && <X size={16} className="text-coral shrink-0" />}
              <span>{choice}</span>
            </button>
          )
        })}
      </div>

      {answered && (
        <div
          className={`rounded-xl p-4 text-sm leading-relaxed animate-fade-up ${
            selected === challenge.correctIndex ? 'bg-teal-light dark:bg-teal/10' : 'bg-coral-light dark:bg-coral/10'
          }`}
        >
          <p className="font-bold mb-1">{selected === challenge.correctIndex ? 'Exactly right!' : "Not quite! Here's why."}</p>
          <p>{challenge.explanation}</p>
        </div>
      )}
    </div>
  )
}
