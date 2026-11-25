export interface MilestoneInput {
  termsLearned: number
  challengesCompleted: number
  everCompletedFullBriefing: boolean
}

export interface Milestone {
  id: string
  label: string
  achieved: boolean
}

export function computeMilestones(input: MilestoneInput): Milestone[] {
  return [
    { id: 'first-term', label: 'First AI term learned', achieved: input.termsLearned >= 1 },
    { id: 'five-terms', label: 'Five terms learned', achieved: input.termsLearned >= 5 },
    { id: 'ten-terms', label: 'Ten terms learned', achieved: input.termsLearned >= 10 },
    { id: 'twenty-five-terms', label: 'Twenty-five terms learned', achieved: input.termsLearned >= 25 },
    { id: 'first-challenge', label: 'First daily challenge completed', achieved: input.challengesCompleted >= 1 },
    { id: 'first-briefing', label: 'First full daily briefing completed', achieved: input.everCompletedFullBriefing },
  ]
}
