import { describe, expect, it } from 'vitest'
import { localDateString, msUntilNextLocalMidnight } from '../src/hooks/useMidnightReload'

describe('msUntilNextLocalMidnight', () => {
  it('returns a full day when called exactly at midnight', () => {
    const atMidnight = new Date(2026, 5, 15, 0, 0, 0, 0)
    expect(msUntilNextLocalMidnight(atMidnight)).toBe(24 * 60 * 60 * 1000)
  })

  it('returns a small value right before midnight', () => {
    const almostMidnight = new Date(2026, 5, 15, 23, 59, 0, 0)
    expect(msUntilNextLocalMidnight(almostMidnight)).toBe(60 * 1000)
  })

  it('returns roughly half a day at noon', () => {
    const noon = new Date(2026, 5, 15, 12, 0, 0, 0)
    expect(msUntilNextLocalMidnight(noon)).toBe(12 * 60 * 60 * 1000)
  })
})

describe('localDateString', () => {
  it('differs across a midnight boundary', () => {
    const beforeMidnight = new Date(2026, 5, 15, 23, 59, 59, 999)
    const afterMidnight = new Date(2026, 5, 16, 0, 0, 0, 0)
    expect(localDateString(beforeMidnight)).not.toBe(localDateString(afterMidnight))
  })

  it('is stable within the same calendar day', () => {
    const morning = new Date(2026, 5, 15, 8, 0, 0, 0)
    const evening = new Date(2026, 5, 15, 22, 0, 0, 0)
    expect(localDateString(morning)).toBe(localDateString(evening))
  })
})
