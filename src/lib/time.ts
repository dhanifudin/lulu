/**
 * All date/time logic uses WIB (Asia/Jakarta, UTC+7).
 * Use these helpers throughout the app instead of Date directly.
 */
import { toZonedTime } from 'date-fns-tz'
import { format, startOfDay, isSameDay, differenceInCalendarDays } from 'date-fns'
import { id as localeId, enUS } from 'date-fns/locale'

export const TZ = 'Asia/Jakarta'

/** Current date/time in WIB */
export function nowWIB(): Date {
  return toZonedTime(new Date(), TZ)
}

/** Today's date string in WIB (YYYY-MM-DD) */
export function todayWIB(): string {
  return format(nowWIB(), 'yyyy-MM-dd')
}

/** Day of week in WIB (1=Mon … 7=Sun, ISO) */
export function dayOfWeekWIB(): number {
  const d = nowWIB()
  // getDay(): 0=Sun…6=Sat → convert to ISO 1=Mon…7=Sun
  const day = d.getDay()
  return day === 0 ? 7 : day
}

/** Format a date to Indonesian weekday name */
export function formatDayId(date: Date): string {
  return format(toZonedTime(date, TZ), 'EEEE', { locale: localeId })
}

/** Format a date to Indonesian full date */
export function formatDateId(date: Date): string {
  return format(toZonedTime(date, TZ), 'd MMMM yyyy', { locale: localeId })
}

/** Format a date to weekday name, locale-aware ('id' or 'en') */
export function formatDay(date: Date, lang: string): string {
  return format(toZonedTime(date, TZ), 'EEEE', { locale: lang === 'en' ? enUS : localeId })
}

/** Format a date to full date string, locale-aware ('id' or 'en') */
export function formatDate(date: Date, lang: string): string {
  return format(toZonedTime(date, TZ), 'd MMMM yyyy', { locale: lang === 'en' ? enUS : localeId })
}

/** Current time as HH:mm in WIB */
export function currentTimeWIB(): string {
  return format(nowWIB(), 'HH:mm')
}

/** Whether time HH:mm is between start and end (inclusive) */
export function isTimeBetween(current: string, start: string, end: string): boolean {
  return current >= start && current < end
}

/** Parse "HH.mm" (dot-separated from PDF) to "HH:mm" */
export function dotToColon(t: string): string {
  return t.replace('.', ':')
}

/**
 * Calculate streak for a sorted array of date strings (YYYY-MM-DD, ascending).
 * Returns number of consecutive days ending today.
 */
export function calcStreak(dates: string[]): number {
  if (!dates.length) return 0
  const today = todayWIB()
  const sorted = [...dates].sort().reverse() // descending
  if (sorted[0] !== today) return 0
  let streak = 1
  for (let i = 1; i < sorted.length; i++) {
    const expected = format(
      new Date(new Date(sorted[i - 1]).getTime() - 86400000),
      'yyyy-MM-dd'
    )
    if (sorted[i] === expected) streak++
    else break
  }
  return streak
}

export { format, isSameDay, startOfDay, differenceInCalendarDays, localeId }
