import type { GlossaryTerm } from '../types'

/** Small stable string hash (djb2) so selection is deterministic across sessions/devices for the same seed. */
function hashString(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i)
  }
  return hash >>> 0
}

/**
 * Deterministically picks the featured term for a given day from the terms
 * that have not been learned yet. Excludes learned IDs first, then uses a
 * hash of the date so the same day always resolves to the same term (until
 * the glossary itself changes), without needing any stored index.
 */
export function selectFeaturedTermId(
  glossary: GlossaryTerm[],
  learnedTermIds: Set<string>,
  seed: string,
): string | null {
  const eligible = glossary.filter((t) => !learnedTermIds.has(t.id)).map((t) => t.id)
  if (eligible.length === 0) return null
  eligible.sort() // stable order regardless of glossary.json array order
  const index = hashString(seed) % eligible.length
  return eligible[index]
}
