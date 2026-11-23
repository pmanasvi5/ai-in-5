import { useState, useRef, useEffect } from 'react'
import type { GlossaryTerm } from '../types'

interface TermPopoverProps {
  term: GlossaryTerm
  children: React.ReactNode
}

/** Underlines a glossary term inline and shows its plain-language definition on tap, click, or keyboard activation. */
export function TermPopover({ term, children }: TermPopoverProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    const onOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [open])

  return (
    <span className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`Definition of ${term.term}`}
        className="underline decoration-dotted decoration-accent underline-offset-2 text-inherit font-medium hover:decoration-solid focus-visible:outline-accent"
      >
        {children}
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute z-40 left-0 top-full mt-2 w-64 card p-3 text-sm font-normal normal-case animate-pop-in"
        >
          <span className="block font-semibold mb-1">{term.term}</span>
          <span className="block text-muted-light dark:text-muted-dark">{term.definition}</span>
        </span>
      )}
    </span>
  )
}
