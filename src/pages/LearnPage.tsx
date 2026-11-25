import { useMemo, useRef, useState } from 'react'
import { Search, PartyPopper, Download, Upload } from 'lucide-react'
import type { GlossaryTerm, LearnedTermRecord } from '../types'
import { TermOfTheDayCard } from '../components/TermOfTheDayCard'
import { ProgressBar } from '../components/ProgressBar'
import { GlossaryCard } from '../components/GlossaryCard'
import { EmptyState } from '../components/EmptyState'
import { TermCardSkeleton } from '../components/Skeleton'
import { LearningDashboard } from '../components/LearningDashboard'
import { useChallengeProgress } from '../hooks/useChallengeProgress'
import { useActivityProgress } from '../hooks/useActivityProgress'
import { useDailyJourneyMilestone } from '../hooks/useDailyJourneyMilestone'

interface LearnPageProps {
  glossary: GlossaryTerm[]
  glossaryLoading: boolean
  featuredTerm: GlossaryTerm | null
  learnedIds: Set<string>
  learnedTerms: LearnedTermRecord[]
  allLearned: boolean
  learnedCount: number
  totalCount: number
  onGotIt: (id: string) => void
  onReviewAgain: (id: string) => void
  onExport: () => string
  onImport: (json: string) => { ok: boolean; added: number; error?: string }
}

type Tab = 'glossary' | 'learned'

export function LearnPage({
  glossary,
  glossaryLoading,
  featuredTerm,
  learnedIds,
  learnedTerms,
  allLearned,
  learnedCount,
  totalCount,
  onGotIt,
  onReviewAgain,
  onExport,
  onImport,
}: LearnPageProps) {
  const [tab, setTab] = useState<Tab>('glossary')
  const [query, setQuery] = useState('')
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { completedCount: challengesCompleted } = useChallengeProgress(undefined)
  const { completedCount: activitiesCompleted } = useActivityProgress()
  const everCompletedFullBriefing = useDailyJourneyMilestone(false)

  const filtered = useMemo(() => {
    const sorted = [...glossary].sort((a, b) => a.term.localeCompare(b.term))
    const base = tab === 'learned' ? sorted.filter((t) => learnedIds.has(t.id)) : sorted
    if (!query.trim()) return base
    const q = query.trim().toLowerCase()
    return base.filter((t) => t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q))
  }, [glossary, tab, learnedIds, query])

  const learnedAtById = useMemo(() => {
    const map = new Map<string, string>()
    for (const rec of learnedTerms) map.set(rec.termId, rec.learnedAt)
    return map
  }, [learnedTerms])

  function handleExportClick() {
    const json = onExport()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-in-5-progress-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = onImport(String(reader.result))
      setImportMessage(
        result.ok
          ? result.added > 0
            ? `Imported ${result.added} new learned term${result.added === 1 ? '' : 's'}.`
            : 'That file was valid, but every term in it was already marked as learned.'
          : result.error ?? 'Import failed.',
      )
      setTimeout(() => setImportMessage(null), 5000)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-2xl font-extrabold mb-1">Learn AI</h1>
        <p className="text-muted-light dark:text-muted-dark">Grow your AI vocabulary, one term at a time.</p>
      </section>

      {allLearned ? (
        <div className="card p-6 flex flex-col items-center text-center gap-2">
          <PartyPopper className="text-accent" size={28} />
          <h3 className="font-bold text-lg">You've learned every AI term in our glossary! 🎉</h3>
          <p className="text-sm text-muted-light dark:text-muted-dark max-w-sm">
            Browse your learned terms below any time, or use Review Again on one to bring it back as a
            featured term. We'll add new terms in future updates.
          </p>
        </div>
      ) : (
        featuredTerm && <TermOfTheDayCard term={featuredTerm} onGotIt={onGotIt} />
      )}

      <ProgressBar current={learnedCount} total={totalCount} />

      <LearningDashboard
        termsLearned={learnedCount}
        challengesCompleted={challengesCompleted}
        activitiesCompleted={activitiesCompleted}
        everCompletedFullBriefing={everCompletedFullBriefing}
      />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleExportClick}
          className="btn-secondary text-sm px-4 py-2 flex-1 justify-center"
        >
          <Download size={14} /> Export progress
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="btn-secondary text-sm px-4 py-2 flex-1 justify-center"
        >
          <Upload size={14} /> Import progress
        </button>
        <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
      </div>
      {importMessage && (
        <p className="text-sm text-center text-muted-light dark:text-muted-dark -mt-2">{importMessage}</p>
      )}
      <p className="text-xs text-muted-light dark:text-muted-dark text-center -mt-3">
        Learning progress is stored on this device only and does not sync automatically — export a backup to
        move it to another device.
      </p>

      <div className="flex items-center gap-2 rounded-full bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-1 self-start">
        {(['glossary', 'learned'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              tab === t ? 'bg-accent text-white' : 'text-muted-light dark:text-muted-dark'
            }`}
          >
            {t === 'glossary' ? 'All terms' : `Learned (${learnedCount})`}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-light dark:text-muted-dark" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search terms..."
          aria-label="Search glossary"
          className="w-full rounded-full border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {glossaryLoading && (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <TermCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!glossaryLoading && filtered.length === 0 && (
        <EmptyState
          icon={Search}
          title={tab === 'learned' ? 'No learned terms yet' : 'No matches'}
          description={
            tab === 'learned'
              ? 'Tap "Got it!" on the featured term above to start building your learned list.'
              : 'Try a different search term.'
          }
        />
      )}

      <div className="flex flex-col gap-3">
        {filtered.map((term) => (
          <GlossaryCard
            key={term.id}
            term={term}
            isLearned={learnedIds.has(term.id)}
            learnedAt={learnedAtById.get(term.id)}
            onGotIt={onGotIt}
            onReviewAgain={onReviewAgain}
          />
        ))}
      </div>
    </div>
  )
}
