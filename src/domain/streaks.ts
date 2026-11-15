import { addDays, diffDays, type Day } from './dates'

export interface Streaks {
  current: number
  longest: number
}

/**
 * Computes reading streaks from the set of days with at least one chapter read.
 * The current streak stays alive through `today` even if nothing has been read yet today.
 */
export function computeStreaks(activeDays: Iterable<Day>, today: Day): Streaks {
  const days = [...new Set(activeDays)].filter((d) => d <= today).sort()
  let longest = 0
  let run = 0
  let prev: Day | null = null
  for (const d of days) {
    run = prev && diffDays(d, prev) === 1 ? run + 1 : 1
    longest = Math.max(longest, run)
    prev = d
  }
  const last = days.at(-1)
  const current = last && (last === today || last === addDays(today, -1)) ? run : 0
  return { current, longest }
}
