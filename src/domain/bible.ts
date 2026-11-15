export type Testament = 'OT' | 'NT'

export interface Book {
  /** USFM / Bible.com book code, e.g. `GEN`. Used as the stable key everywhere (DB, URLs). */
  code: string
  ordinal: number
  testament: Testament
  chapters: number
  name: { en: string; 'zh-Hant': string }
}

type BookTuple = [code: string, chapters: number, en: string, zhHant: string]

const OT: BookTuple[] = [
  ['GEN', 50, 'Genesis', '創世記'],
  ['EXO', 40, 'Exodus', '出埃及記'],
  ['LEV', 27, 'Leviticus', '利未記'],
  ['NUM', 36, 'Numbers', '民數記'],
  ['DEU', 34, 'Deuteronomy', '申命記'],
  ['JOS', 24, 'Joshua', '約書亞記'],
  ['JDG', 21, 'Judges', '士師記'],
  ['RUT', 4, 'Ruth', '路得記'],
  ['1SA', 31, '1 Samuel', '撒母耳記上'],
  ['2SA', 24, '2 Samuel', '撒母耳記下'],
  ['1KI', 22, '1 Kings', '列王紀上'],
  ['2KI', 25, '2 Kings', '列王紀下'],
  ['1CH', 29, '1 Chronicles', '歷代志上'],
  ['2CH', 36, '2 Chronicles', '歷代志下'],
  ['EZR', 10, 'Ezra', '以斯拉記'],
  ['NEH', 13, 'Nehemiah', '尼希米記'],
  ['EST', 10, 'Esther', '以斯帖記'],
  ['JOB', 42, 'Job', '約伯記'],
  ['PSA', 150, 'Psalms', '詩篇'],
  ['PRO', 31, 'Proverbs', '箴言'],
  ['ECC', 12, 'Ecclesiastes', '傳道書'],
  ['SNG', 8, 'Song of Songs', '雅歌'],
  ['ISA', 66, 'Isaiah', '以賽亞書'],
  ['JER', 52, 'Jeremiah', '耶利米書'],
  ['LAM', 5, 'Lamentations', '耶利米哀歌'],
  ['EZK', 48, 'Ezekiel', '以西結書'],
  ['DAN', 12, 'Daniel', '但以理書'],
  ['HOS', 14, 'Hosea', '何西阿書'],
  ['JOL', 3, 'Joel', '約珥書'],
  ['AMO', 9, 'Amos', '阿摩司書'],
  ['OBA', 1, 'Obadiah', '俄巴底亞書'],
  ['JON', 4, 'Jonah', '約拿書'],
  ['MIC', 7, 'Micah', '彌迦書'],
  ['NAM', 3, 'Nahum', '那鴻書'],
  ['HAB', 3, 'Habakkuk', '哈巴谷書'],
  ['ZEP', 3, 'Zephaniah', '西番雅書'],
  ['HAG', 2, 'Haggai', '哈該書'],
  ['ZEC', 14, 'Zechariah', '撒迦利亞書'],
  ['MAL', 4, 'Malachi', '瑪拉基書'],
]

const NT: BookTuple[] = [
  ['MAT', 28, 'Matthew', '馬太福音'],
  ['MRK', 16, 'Mark', '馬可福音'],
  ['LUK', 24, 'Luke', '路加福音'],
  ['JHN', 21, 'John', '約翰福音'],
  ['ACT', 28, 'Acts', '使徒行傳'],
  ['ROM', 16, 'Romans', '羅馬書'],
  ['1CO', 16, '1 Corinthians', '哥林多前書'],
  ['2CO', 13, '2 Corinthians', '哥林多後書'],
  ['GAL', 6, 'Galatians', '加拉太書'],
  ['EPH', 6, 'Ephesians', '以弗所書'],
  ['PHP', 4, 'Philippians', '腓立比書'],
  ['COL', 4, 'Colossians', '歌羅西書'],
  ['1TH', 5, '1 Thessalonians', '帖撒羅尼迦前書'],
  ['2TH', 3, '2 Thessalonians', '帖撒羅尼迦後書'],
  ['1TI', 6, '1 Timothy', '提摩太前書'],
  ['2TI', 4, '2 Timothy', '提摩太後書'],
  ['TIT', 3, 'Titus', '提多書'],
  ['PHM', 1, 'Philemon', '腓利門書'],
  ['HEB', 13, 'Hebrews', '希伯來書'],
  ['JAS', 5, 'James', '雅各書'],
  ['1PE', 5, '1 Peter', '彼得前書'],
  ['2PE', 3, '2 Peter', '彼得後書'],
  ['1JN', 5, '1 John', '約翰一書'],
  ['2JN', 1, '2 John', '約翰二書'],
  ['3JN', 1, '3 John', '約翰三書'],
  ['JUD', 1, 'Jude', '猶大書'],
  ['REV', 22, 'Revelation', '啟示錄'],
]

export const BOOKS: readonly Book[] = [
  ...OT.map((b) => ({ b, testament: 'OT' as const })),
  ...NT.map((b) => ({ b, testament: 'NT' as const })),
].map(({ b: [code, chapters, en, zh], testament }, i) => ({
  code,
  ordinal: i + 1,
  testament,
  chapters,
  name: { en, 'zh-Hant': zh },
}))

export const BOOKS_BY_CODE: ReadonlyMap<string, Book> = new Map(BOOKS.map((b) => [b.code, b]))

export const chaptersIn = (testament?: Testament) =>
  BOOKS.filter((b) => !testament || b.testament === testament).reduce((s, b) => s + b.chapters, 0)

export const TOTAL_CHAPTERS = chaptersIn()

export const bookName = (code: string, lang: string): string => {
  const book = BOOKS_BY_CODE.get(code)
  if (!book) return code
  return lang.startsWith('zh') ? book.name['zh-Hant'] : book.name.en
}

/** Canonical key for a chapter, used for client-side sets/maps. */
export const chapterKey = (code: string, chapter: number) => `${code}.${chapter}`

export const isValidChapter = (code: string, chapter: number) => {
  const book = BOOKS_BY_CODE.get(code)
  return !!book && Number.isInteger(chapter) && chapter >= 1 && chapter <= book.chapters
}

export interface ChapterRef {
  code: string
  chapter: number
}

/** All chapters of the given books (or the whole Bible) in canonical order. */
export const allChapters = (codes?: readonly string[]): ChapterRef[] => {
  const books = codes ? BOOKS.filter((b) => codes.includes(b.code)) : BOOKS
  return books.flatMap((b) => Array.from({ length: b.chapters }, (_, i) => ({ code: b.code, chapter: i + 1 })))
}
