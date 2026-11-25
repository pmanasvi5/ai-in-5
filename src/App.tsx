import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { TodayPage } from './pages/TodayPage'
import { LearnPage } from './pages/LearnPage'
import { SavedPage } from './pages/SavedPage'
import { ArchivePage } from './pages/ArchivePage'
import { useTheme } from './hooks/useTheme'
import { useDigest } from './hooks/useDigest'
import { useGlossary } from './hooks/useGlossary'
import { useLearningProgress } from './hooks/useLearningProgress'
import { useBookmarks } from './hooks/useBookmarks'
import { usePreferences } from './hooks/usePreferences'
import { useMidnightReload } from './hooks/useMidnightReload'

export default function App() {
  useMidnightReload()
  const { isDark, setting, toggle } = useTheme()
  const { preferences, setFontSize } = usePreferences()
  const { digest, state: digestState, refresh } = useDigest()
  const { glossary, loading: glossaryLoading } = useGlossary()
  const {
    progress,
    learnedIds,
    featuredTerm,
    allLearned,
    totalCount,
    learnedCount,
    markGotIt,
    reviewAgain,
    exportProgress,
    importProgress,
  } = useLearningProgress(glossary)
  const { bookmarks, bookmarkedIds, toggleBookmark } = useBookmarks()

  function handleToggleBookmark(storyId: string) {
    const story =
      digest?.stories.find((s) => s.id === storyId) ??
      bookmarks.find((b) => b.storyId === storyId)?.snapshot
    if (!story) return
    toggleBookmark(story, digest?.digestDate ?? bookmarks.find((b) => b.storyId === storyId)?.digestDate ?? '')
  }

  return (
    <Layout
      isDark={isDark}
      themeSetting={setting}
      onToggleTheme={toggle}
      fontSize={preferences.fontSize}
      onSetFontSize={setFontSize}
    >
      <Routes>
        <Route
          path="/"
          element={
            <TodayPage
              digest={digest}
              digestState={digestState}
              onRefresh={refresh}
              glossary={glossary}
              bookmarkedIds={bookmarkedIds}
              onToggleBookmark={handleToggleBookmark}
              featuredTerm={featuredTerm}
              onGotIt={markGotIt}
              learnedTerms={progress.learnedTerms}
            />
          }
        />
        <Route
          path="/learn"
          element={
            <LearnPage
              glossary={glossary}
              glossaryLoading={glossaryLoading}
              featuredTerm={featuredTerm}
              learnedIds={learnedIds}
              learnedTerms={progress.learnedTerms}
              allLearned={allLearned}
              learnedCount={learnedCount}
              totalCount={totalCount}
              onGotIt={markGotIt}
              onReviewAgain={reviewAgain}
              onExport={exportProgress}
              onImport={importProgress}
            />
          }
        />
        <Route
          path="/saved"
          element={<SavedPage bookmarks={bookmarks} glossary={glossary} onToggleBookmark={handleToggleBookmark} />}
        />
        <Route
          path="/archive"
          element={
            <ArchivePage glossary={glossary} bookmarkedIds={bookmarkedIds} onToggleBookmark={handleToggleBookmark} />
          }
        />
      </Routes>
    </Layout>
  )
}
