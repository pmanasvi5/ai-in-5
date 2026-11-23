import type { GlossaryTerm } from '../types'
import { splitOnTerms } from '../utils/highlightTerms'
import { TermPopover } from './TermPopover'

interface HighlightedTextProps {
  text: string
  keyTermIds: string[]
  glossary: GlossaryTerm[]
}

export function HighlightedText({ text, keyTermIds, glossary }: HighlightedTextProps) {
  const segments = splitOnTerms(text, keyTermIds, glossary)
  return (
    <>
      {segments.map((seg, i) => {
        if (!seg.termId) return <span key={i}>{seg.text}</span>
        const term = glossary.find((g) => g.id === seg.termId)
        if (!term) return <span key={i}>{seg.text}</span>
        return (
          <TermPopover key={i} term={term}>
            {seg.text}
          </TermPopover>
        )
      })}
    </>
  )
}
