import { describe, expect, it } from 'vitest'
import { computeMilestones } from '../src/utils/milestones'

describe('computeMilestones', () => {
  it('marks nothing achieved at zero', () => {
    const milestones = computeMilestones({ termsLearned: 0, challengesCompleted: 0, everCompletedFullBriefing: false })
    expect(milestones.every((m) => !m.achieved)).toBe(true)
  })

  it('marks term-count milestones correctly at the boundary', () => {
    const milestones = computeMilestones({ termsLearned: 5, challengesCompleted: 0, everCompletedFullBriefing: false })
    const byId = Object.fromEntries(milestones.map((m) => [m.id, m.achieved]))
    expect(byId['first-term']).toBe(true)
    expect(byId['five-terms']).toBe(true)
    expect(byId['ten-terms']).toBe(false)
    expect(byId['twenty-five-terms']).toBe(false)
  })

  it('marks the full-briefing milestone only from the persisted flag', () => {
    const milestones = computeMilestones({ termsLearned: 0, challengesCompleted: 0, everCompletedFullBriefing: true })
    expect(milestones.find((m) => m.id === 'first-briefing')?.achieved).toBe(true)
  })
})
