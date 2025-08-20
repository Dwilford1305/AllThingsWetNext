/**
 * Scheduling utilities for scraper next-run calculations.
 * Ensures UI countdown shows fixed schedule (6:00 AM Mountain Time for daily scrapers,
 * weekly Monday 6:00 AM MT for business) independent of variable interval-based nextRun in DB.
 */

export type ScraperType = 'news' | 'events' | 'businesses'

/** Determine if given date is within Mountain Time DST (MDT) period. */
export function isMountainDST(date: Date): boolean {
  const year = date.getUTCFullYear()
  // Second Sunday in March
  const marchFirst = new Date(Date.UTC(year, 2, 1))
  const firstSundayOffset = (7 - marchFirst.getUTCDay()) % 7
  const secondSundayDate = 1 + firstSundayOffset + 7
  const dstStart = new Date(Date.UTC(year, 2, secondSundayDate, 9, 0, 0)) // 2 AM local ≈ 9 UTC during switch

  // First Sunday in November
  const novFirst = new Date(Date.UTC(year, 10, 1))
  const firstSundayNovOffset = (7 - novFirst.getUTCDay()) % 7
  const firstSundayNovDate = 1 + firstSundayNovOffset
  const dstEnd = new Date(Date.UTC(year, 10, firstSundayNovDate, 8, 0, 0)) // 2 AM local ≈ 8 UTC after fallback

  return date >= dstStart && date < dstEnd
}

/** Returns next Date (UTC) representing 6:00 AM Mountain Time after 'from'. */
export function nextDailySixAMMountain(from: Date): Date {
  const dst = isMountainDST(from)
  const offsetHours = dst ? 6 : 7 // MT = UTC-7 standard, UTC-6 DST
  const targetUTCHour = 6 + offsetHours
  const next = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), targetUTCHour, 0, 0, 0))
  if (next <= from) {
    next.setUTCDate(next.getUTCDate() + 1)
  }
  return next
}

/** Returns next weekly Monday 6:00 AM Mountain Time from 'from'. */
export function nextWeeklyMondaySixAMMountain(from: Date): Date {
  const base = nextDailySixAMMountain(from)
  const result = new Date(base)
  while (result.getUTCDay() !== 1) { // 1 = Monday
    result.setUTCDate(result.getUTCDate() + 1)
  }
  return result
}

/** Compute next scheduled run for a scraper given fixed policy. */
export function computeNextScheduledRun(
  type: ScraperType,
  now: Date,
  enabled: boolean,
  configNextRun?: string | Date | null
): Date | null {
  if (!enabled) return null
  switch (type) {
    case 'news':
    case 'events':
      return nextDailySixAMMountain(now)
    case 'businesses':
      return nextWeeklyMondaySixAMMountain(now)
    default:
      return configNextRun ? new Date(configNextRun) : null
  }
}

/** Format a countdown string (e.g., "2 days", "3 hours", "14 minutes"). */
export function formatCountdown(target: Date, now = new Date()): string {
  const diffMs = target.getTime() - now.getTime()
  if (diffMs <= 0) return 'Due'
  const minutes = Math.floor(diffMs / 60000)
  const days = Math.floor(minutes / (60 * 24))
  if (days > 0) return `${days} day${days !== 1 ? 's' : ''}`
  const hours = Math.floor(minutes / 60)
  if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''}`
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`
}
