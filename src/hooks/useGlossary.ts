import { useEffect, useState } from 'react'
import type { GlossaryTerm } from '../types'

export function useGlossary() {
  const [glossary, setGlossary] = useState<GlossaryTerm[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('data/glossary.json')
      .then((res) => res.json())
      .then((data: GlossaryTerm[]) => setGlossary(data))
      .catch(() => setGlossary([]))
      .finally(() => setLoading(false))
  }, [])

  return { glossary, loading }
}
