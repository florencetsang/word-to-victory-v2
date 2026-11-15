import { BOOKS, chapterKey, chaptersIn, TOTAL_CHAPTERS, type Testament } from './bible'

export interface ReadEntry {
  code: string
  chapter: number
  readBy: string | null
  readAt: string
}

/** Read chapters keyed by `chapterKey(code, chapter)`. */
export type ReadMap = ReadonlyMap<string, ReadEntry>

export interface Progress {
  read: number
  total: number
  /** 0–100 */
  percent: number
}

const progress = (read: number, total: number): Progress => ({
  read,
  total,
  percent: total === 0 ? 0 : (read / total) * 100,
})

export function bookProgress(reads: ReadMap, code: string, chapters: number): Progress {
  let read = 0
  for (let c = 1; c <= chapters; c++) if (reads.has(chapterKey(code, c))) read++
  return progress(read, chapters)
}

export interface ProgressSummary {
  overall: Progress
  testament: Record<Testament, Progress>
  books: Record<string, Progress>
  booksCompleted: number
}

export function summarize(reads: ReadMap): ProgressSummary {
  const books: Record<string, Progress> = {}
  const tCount: Record<Testament, number> = { OT: 0, NT: 0 }
  let booksCompleted = 0
  for (const b of BOOKS) {
    const p = bookProgress(reads, b.code, b.chapters)
    books[b.code] = p
    tCount[b.testament] += p.read
    if (p.read === p.total) booksCompleted++
  }
  return {
    overall: progress(tCount.OT + tCount.NT, TOTAL_CHAPTERS),
    testament: { OT: progress(tCount.OT, chaptersIn('OT')), NT: progress(tCount.NT, chaptersIn('NT')) },
    books,
    booksCompleted,
  }
}
