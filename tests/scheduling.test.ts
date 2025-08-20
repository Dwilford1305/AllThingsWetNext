import { nextDailySixAMMountain, nextWeeklyMondaySixAMMountain, computeNextScheduledRun } from '@/lib/scheduling'

describe('scheduling utilities', () => {
  test('nextDailySixAMMountain advances to tomorrow if past run time', () => {
    const now = new Date(Date.UTC(2025, 6, 1, 20, 0, 0)) // July 1 20:00 UTC
    const next = nextDailySixAMMountain(now)
    expect(next.getUTCDate()).toBe(2) // next day
  })

  test('nextWeeklyMondaySixAMMountain returns upcoming Monday', () => {
    const wed = new Date(Date.UTC(2025, 6, 2, 12, 0, 0)) // Wed
    const next = nextWeeklyMondaySixAMMountain(wed)
    expect(next.getUTCDay()).toBe(1)
    expect(next.getUTCDate()).toBeGreaterThan(wed.getUTCDate())
  })

  test('computeNextScheduledRun respects disabled flag', () => {
    const now = new Date()
    const result = computeNextScheduledRun('news', now, false, null)
    expect(result).toBeNull()
  })
})
