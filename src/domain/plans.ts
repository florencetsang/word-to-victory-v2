import { allChapters, BOOKS, chapterKey, type ChapterRef } from './bible'
import { addDays, diffDays, type Day } from './dates'

export interface PlanTemplate {
  key: string
  name: { en: string; 'zh-Hant': string }
  books: readonly string[]
  days: number
}

const codes = (from: string, to: string) => {
  const i = BOOKS.findIndex((b) => b.code === from)
  const j = BOOKS.findIndex((b) => b.code === to)
  return BOOKS.slice(i, j + 1).map((b) => b.code)
}

export const BUILT_IN_PLANS: readonly PlanTemplate[] = [
  {
    key: 'bible-1y',
    name: { en: 'Whole Bible in a year', 'zh-Hant': '一年讀完全本聖經' },
    books: codes('GEN', 'REV'),
    days: 365,
  },
  {
    key: 'nt-90',
    name: { en: 'New Testament in 90 days', 'zh-Hant': '90 天讀完新約' },
    books: codes('MAT', 'REV'),
    days: 90,
  },
  {
    key: 'gospels-30',
    name: { en: 'The Gospels in 30 days', 'zh-Hant': '30 天讀完四福音' },
    books: codes('MAT', 'JHN'),
    days: 30,
  },
  {
    key: 'wisdom-60',
    name: { en: 'Psalms & Proverbs in 60 days', 'zh-Hant': '60 天讀完詩篇與箴言' },
    books: ['PSA', 'PRO'],
    days: 60,
  },
]

export const getTemplate = (key: string) => BUILT_IN_PLANS.find((p) => p.key === key)

/** Splits the plan's chapters (in canonical order) as evenly as possible across `days`. */
export function buildSchedule(books: readonly string[], days: number): ChapterRef[][] {
  const chapters = allChapters(books)
  const n = Math.max(1, Math.min(days, chapters.length))
  return Array.from({ length: n }, (_, d) =>
    chapters.slice(Math.floor((d * chapters.length) / n), Math.floor(((d + 1) * chapters.length) / n)),
  )
}

export interface PlanStatus {
  /** 0-based index of today within the plan; may be < 0 (not started) or >= length (ended). */
  dayIndex: number
  totalDays: number
  endDate: Day
  today: ChapterRef[]
  todayDone: boolean
  /** Chapters scheduled before today that are still unread. */
  behind: ChapterRef[]
  readInPlan: number
  totalInPlan: number
  finished: boolean
}

export function planStatus(
  schedule: ChapterRef[][],
  startDate: Day,
  todayDay: Day,
  isRead: (key: string) => boolean,
): PlanStatus {
  const dayIndex = diffDays(todayDay, startDate)
  const all = schedule.flat()
  const unread = (refs: ChapterRef[]) => refs.filter((r) => !isRead(chapterKey(r.code, r.chapter)))
  const todays = dayIndex >= 0 && dayIndex < schedule.length ? schedule[dayIndex] : []
  const readInPlan = all.length - unread(all).length
  return {
    dayIndex,
    totalDays: schedule.length,
    endDate: addDays(startDate, schedule.length - 1),
    today: todays,
    todayDone: todays.length > 0 && unread(todays).length === 0,
    behind: unread(schedule.slice(0, Math.max(0, Math.min(dayIndex, schedule.length))).flat()),
    readInPlan,
    totalInPlan: all.length,
    finished: readInPlan === all.length,
  }
}
