import { describe, expect, it } from 'vitest'
import { selectFeaturedTermId } from '../src/utils/termSelection'
import type { GlossaryTerm } from '../src/types'

function term(id: string): GlossaryTerm {
  return { id, term: id, definition: '', everydayExample: '', whyItMatters: '', relatedTerms: [] }
}

const glossary = [term('a'), term('b'), term('c'), term('d'), term('e')]

describe('selectFeaturedTermId', () => {
  it('never selects a learned term', () => {
    const learned = new Set(['a', 'b', 'c'])
    for (const seed of ['2026-01-01', '2026-06-15', '2026-12-31', 'anything']) {
      const picked = selectFeaturedTermId(glossary, learned, seed)
      expect(picked).not.toBeNull()
      expect(learned.has(picked as string)).toBe(false)
    }
  })

  it('returns null when every term is learned', () => {
    const learned = new Set(glossary.map((t) => t.id))
    expect(selectFeaturedTermId(glossary, learned, '2026-01-01')).toBeNull()
  })

  it('is deterministic for the same seed and learned set', () => {
    const learned = new Set(['a'])
    const first = selectFeaturedTermId(glossary, learned, '2026-03-01')
    const second = selectFeaturedTermId(glossary, learned, '2026-03-01')
    expect(first).toBe(second)
  })

  it('can select a previously-excluded term once it becomes eligible again (Review Again)', () => {
    const learned = new Set(['a', 'b', 'c', 'd']) // only 'e' eligible
    expect(selectFeaturedTermId(glossary, learned, '2026-01-01')).toBe('e')
    const afterReview = new Set(['a', 'b', 'c']) // 'd' reviewed-again, back in the pool
    const picked = selectFeaturedTermId(glossary, afterReview, '2026-01-01')
    expect(['d', 'e']).toContain(picked)
  })
})
