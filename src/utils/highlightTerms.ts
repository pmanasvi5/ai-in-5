import type { GlossaryTerm } from '../types'

export interface TextSegment {
  text: string
  termId: string | null
}

/**
 * Splits text into plain segments and glossary-term segments so the caller
 * can render matched terms as tappable spans. Only matches terms that the
 * story itself flagged as relevant (keyTermIds), to avoid over-highlighting
 * common words that happen to share a name with a glossary entry.
 */
export function splitOnTerms(text: string, keyTermIds: string[], glossary: GlossaryTerm[]): TextSegment[] {
  const relevant = glossary.filter((g) => keyTermIds.includes(g.id))
  if (relevant.length === 0) return [{ text, termId: null }]

  // Longest term names first, so "Large Language Model" matches before "Model".
  const sorted = [...relevant].sort((a, b) => b.term.length - a.term.length)
  const pattern = new RegExp(`(${sorted.map((t) => escapeRegExp(t.term)).join('|')})`, 'gi')

  const parts = text.split(pattern)
  return parts
    .filter((p) => p.length > 0)
    .map((part) => {
      const match = relevant.find((t) => t.term.toLowerCase() === part.toLowerCase())
      return { text: part, termId: match ? match.id : null }
    })
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
