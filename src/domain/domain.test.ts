import { describe, expect, it } from 'vitest'
import { BOOKS, bookName, CATEGORIES, chapterKey, TOTAL_CHAPTERS, chaptersIn, isValidChapter } from './bible'
import { bibleComLink } from './bible-versions'
import { clearLegacyProgress, readLegacyProgress } from './legacy'
import { summarize, type ReadEntry } from './progress'
import { computeStreaks } from './streaks'
import { buildSchedule, BUILT_IN_PLANS, planStatus } from './plans'

const memStorage = (init: Record<string, string>) => {
  const m = new Map(Object.entries(init))
  return {
    get length() {
      return m.size
    },
    key: (i: number) => [...m.keys()][i] ?? null,
    getItem: (k: string) => m.get(k) ?? null,
    removeItem: (k: string) => void m.delete(k),
    map: m,
  }
}

describe('bible', () => {
  it('has 66 books, 1189 chapters split 929/260', () => {
    expect(BOOKS).toHaveLength(66)
    expect(TOTAL_CHAPTERS).toBe(1189)
    expect(chaptersIn('OT')).toBe(929)
    expect(chaptersIn('NT')).toBe(260)
  })

  it('fixes legacy data errors', () => {
    expect(bookName('ISA', 'en')).toBe('Isaiah')
    expect(bookName('PHP', 'en')).toBe('Philippians')
    expect(BOOKS.find((b) => b.code === 'JOL')).toBeDefined()
  })

  it('localizes names and validates chapters', () => {
    expect(bookName('GEN', 'zh-Hant')).toBe('創世記')
    expect(isValidChapter('JUD', 1)).toBe(true)
    expect(isValidChapter('JUD', 2)).toBe(false)
    expect(isValidChapter('XXX', 1)).toBe(false)
  })

  it('builds Bible.com links with the default RCUV version', () => {
    expect(bibleComLink('JHN', 3)).toBe('https://www.bible.com/bible/139/JHN.3.RCUV')
    expect(bibleComLink('JHN', 3, 111)).toBe('https://www.bible.com/bible/111/JHN.3.NIV')
  })
})

describe('legacy import', () => {
  it('maps old localStorage keys (incl. misspellings) and ignores unread/invalid ones', () => {
    const s = memStorage({
      Genesis_1: 'true',
      Genesis_2: 'false',
      Isiah_53: 'true',
      Phillipians_4: 'true',
      'Song of Songs_8': 'true',
      Jude_2: 'true',
      theme: 'dark',
    })
    expect(readLegacyProgress(s)).toEqual([
      { code: 'GEN', chapter: 1 },
      { code: 'ISA', chapter: 53 },
      { code: 'PHP', chapter: 4 },
      { code: 'SNG', chapter: 8 },
    ])
    clearLegacyProgress(s)
    expect([...s.map.keys()]).toEqual(['Jude_2', 'theme'])
  })
})

describe('progress', () => {
  it('summarizes overall, testament and book progress', () => {
    const reads = new Map<string, ReadEntry>()
    for (let c = 1; c <= 4; c++) reads.set(chapterKey('RUT', c), { code: 'RUT', chapter: c, readBy: null, readAt: '' })
    reads.set(chapterKey('JHN', 1), { code: 'JHN', chapter: 1, readBy: null, readAt: '' })
    const s = summarize(reads)
    expect(s.overall.read).toBe(5)
    expect(s.testament.OT.read).toBe(4)
    expect(s.testament.NT.read).toBe(1)
    expect(s.books.RUT.percent).toBe(100)
    expect(s.booksCompleted).toBe(1)
    expect(s.categories.history).toMatchObject({ read: 4, total: 249 })
    expect(s.categories.gospels.read).toBe(1)
    expect(s.categories.law.read).toBe(0)
  })

  it('assigns every book to exactly one category in canonical order', () => {
    expect(CATEGORIES.flatMap((c) => c.books)).toEqual(BOOKS.map((b) => b.code))
    expect(CATEGORIES.find((c) => c.key === 'generalLetters')?.books[0]).toBe('HEB')
  })
})

describe('streaks', () => {
  it('counts current and longest streaks', () => {
    const days = ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-10', '2026-01-11']
    expect(computeStreaks(days, '2026-01-11')).toEqual({ current: 2, longest: 3 })
    expect(computeStreaks(days, '2026-01-12')).toEqual({ current: 2, longest: 3 })
    expect(computeStreaks(days, '2026-01-13')).toEqual({ current: 0, longest: 3 })
    expect(computeStreaks([], '2026-01-13')).toEqual({ current: 0, longest: 0 })
  })

  it('handles month boundaries', () => {
    expect(computeStreaks(['2026-02-28', '2026-03-01'], '2026-03-01').current).toBe(2)
  })
})

describe('plans', () => {
  it('distributes every chapter exactly once across days', () => {
    for (const p of BUILT_IN_PLANS) {
      const s = buildSchedule(p.books, p.days)
      expect(s).toHaveLength(p.days)
      const flat = s.flat()
      expect(new Set(flat.map((r) => chapterKey(r.code, r.chapter))).size).toBe(flat.length)
      expect(Math.max(...s.map((d) => d.length)) - Math.min(...s.map((d) => d.length))).toBeLessThanOrEqual(1)
    }
  })

  it('caps days at the number of chapters', () => {
    expect(buildSchedule(['JUD'], 10)).toHaveLength(1)
  })

  it('reports today, behind and completion', () => {
    const s = buildSchedule(['RUT'], 4)
    const read = new Set(['RUT.1'])
    const st = planStatus(s, '2026-01-01', '2026-01-03', (k) => read.has(k))
    expect(st.dayIndex).toBe(2)
    expect(st.today).toEqual([{ code: 'RUT', chapter: 3 }])
    expect(st.behind).toEqual([{ code: 'RUT', chapter: 2 }])
    expect(st.todayDone).toBe(false)
    expect(st.endDate).toBe('2026-01-04')
    expect(st.finished).toBe(false)
  })
})
