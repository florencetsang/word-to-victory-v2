/** Calendar-day helpers operating on `YYYY-MM-DD` strings (timezone-free once produced). */

export type Day = string

const pad = (n: number) => String(n).padStart(2, '0')

export const toDay = (d: Date): Day => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const today = (): Day => toDay(new Date())

const toUTC = (day: Day) => {
  const [y, m, d] = day.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

const fromUTC = (ms: number): Day => {
  const d = new Date(ms)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

export const addDays = (day: Day, n: number): Day => fromUTC(toUTC(day) + n * 86_400_000)

export const diffDays = (a: Day, b: Day): number => Math.round((toUTC(a) - toUTC(b)) / 86_400_000)

export const dayOfWeek = (day: Day): number => new Date(toUTC(day)).getUTCDay()
