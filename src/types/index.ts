export type NewsCategory =
  | 'New Models'
  | 'Tools & Apps'
  | 'Company News'
  | 'Business & Work'
  | 'Policy & Regulation'
  | 'Safety & Security'
  | 'Research'
  | 'Health & Education'

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
}

export type DigestStatus = 'ok' | 'stale' | 'partial'

export interface DailyDigest {
  digestDate: string // YYYY-MM-DD, editorial date
  editorialTimezone: 'America/New_York'
  generatedAt: string // ISO timestamp
  lastSuccessfulUpdate: string // ISO timestamp
  status: DigestStatus
  stories: NewsStory[]
  moreStories?: NewsStory[] // additional qualifying stories for "Give Me 5 More", beyond the primary 5
  termOfTheDayCandidateIds: string[] // glossary IDs surfaced by this digest's stories
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
