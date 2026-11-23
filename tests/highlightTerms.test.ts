import { describe, expect, it } from 'vitest'
import { splitOnTerms } from '../src/utils/highlightTerms'
import type { GlossaryTerm } from '../src/types'

const glossary: GlossaryTerm[] = [
  { id: 'ai-agent', term: 'AI Agent', definition: 'd', everydayExample: 'e', whyItMatters: 'w', relatedTerms: [] },
  { id: 'large-language-model', term: 'Large Language Model', definition: 'd', everydayExample: 'e', whyItMatters: 'w', relatedTerms: [] },
]

describe('splitOnTerms', () => {
  it('returns the whole text unsplit when no key terms are given', () => {
    const result = splitOnTerms('An AI Agent did something.', [], glossary)
    expect(result).toEqual([{ text: 'An AI Agent did something.', termId: null }])
  })

  it('splits out a matched key term as its own segment', () => {
    const result = splitOnTerms('An AI Agent did something.', ['ai-agent'], glossary)
    const termSegment = result.find((s) => s.termId === 'ai-agent')
    expect(termSegment?.text.toLowerCase()).toBe('ai agent')
  })

  it('prefers the longer term when one term name is a substring of another', () => {
    // Guards against "Model" matching inside "Large Language Model" style overlaps.
    const result = splitOnTerms(
      'The Large Language Model answered.',
      ['large-language-model'],
      glossary,
    )
    const matched = result.filter((s) => s.termId !== null)
    expect(matched).toHaveLength(1)
    expect(matched[0].text.toLowerCase()).toBe('large language model')
  })
})
