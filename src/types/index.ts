export type NewsCategory =
  | 'New Models'
  | 'Tools & Apps'
  | 'Company News'
  | 'Business & Work'
  | 'Policy & Regulation'
  | 'Safety & Security'
  | 'Research'
  | 'Health & Education'

/** A prior, conservatively-matched mention of the same ongoing development. */
export interface PreviousMention {
  date: string // YYYY-MM-DD, the editorial date it was covered
  headline: string
  url: string
}

export type FollowUpLabel = 'New Development' | 'Story Update' | 'Previously Covered' | 'Major Announcement'

export interface NewsStory {
  id: string
  headline: string
  source: string
  originalUrl: string
  category: NewsCategory
  publishedAt: string // ISO timestamp, from the source
  fetchedAt: string // ISO timestamp, when our pipeline retrieved it
  quickScoop?: string // 25-40 word hook: what happened and why it's interesting. Optional for backward compat with digests generated before this field existed.
  summary: string[] // five key takeaways, ~8-16 words each, when fully qualified
  whyItMatters: string
  keyTerms: string[] // glossary term IDs mentioned in this story
  readingTimeMinutes: number
  threadId?: string // stable id grouping this story with earlier coverage of the same development
  followUpLabel?: FollowUpLabel // shown only when previousMentions is non-empty
  previousMentions?: PreviousMention[] // conservatively-matched earlier coverage; omitted (not empty) when linking isn't confident
  simplerExplanation?: string // "Explain It Simpler": shorter, jargon-free rewrite of quickScoop. Omitted when the source doesn't support a reliable simplification.
}

export type DigestStatus = 'ok' | 'stale' | 'partial'

export interface DailyChallengeOption {
  text: string
}

export interface DailyChallenge {
  id: string
  digestDate: string
  question: string
  choices: string[] // exactly 4
  correctIndex: number
  explanation: string
  sourceStoryId?: string
  sourceTermId?: string
}

export interface DailyActivity {
  id: string
  title: string
  learningObjective: string // "What you'll learn"
  tryThis: string // the example prompt/exercise
  whyItWorks: string
  category: 'school' | 'work' | 'creative' | 'everyday'
}

export interface DailyDigest {
  digestDate: string // YYYY-MM-DD, editorial date
  editorialTimezone: 'America/New_York'
  generatedAt: string // ISO timestamp
  lastSuccessfulUpdate: string // ISO timestamp
  status: DigestStatus
  stories: NewsStory[]
  moreStories?: NewsStory[] // additional qualifying stories for "Give Me 5 More", beyond the primary 5
  termOfTheDayCandidateIds: string[] // glossary IDs surfaced by this digest's stories
  dailyChallenge?: DailyChallenge
  dailyActivity?: DailyActivity
}

export interface GlossaryTerm {
  id: string
  term: string
  definition: string
  everydayExample: string
  whyItMatters: string
  relatedTerms: string[] // other glossary term IDs
}

export interface LearnedTermRecord {
  termId: string
  learnedAt: string // ISO timestamp
}

export interface LearningProgress {
  learnedTerms: LearnedTermRecord[]
  currentFeaturedTermId: string | null
  featuredTermSelectedDate: string | null // YYYY-MM-DD, editorial date the term was chosen for
}

export interface BookmarkedStory {
  storyId: string
  digestDate: string
  bookmarkedAt: string
  // Snapshot of the story's essential fields, so bookmarks still render
  // correctly after the daily digest rotates out.
  snapshot: NewsStory
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  fontSize: 'small' | 'medium' | 'large'
}

export interface ArchiveIndexEntry {
  digestDate: string
  storyCount: number
}

/** One row of the generated client-side search index (public/data/search-index.json) — deliberately minimal so the whole archive's index stays small to load upfront. */
export interface SearchIndexEntry {
  id: string
  digestDate: string
  headline: string
  source: string
  category: NewsCategory
  keyTerms: string[]
  url: string
}
