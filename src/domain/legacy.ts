import { BOOKS, isValidChapter, type ChapterRef } from './bible'

/**
 * The original Bible Track app stored progress in localStorage as `"<Book name>_<chapter>" = "true"`.
 * Its book list had a couple of misspellings, which are mapped here.
 */
const LEGACY_NAME_ALIASES: Record<string, string> = {
  Isiah: 'ISA',
  Phillipians: 'PHP',
}

const LEGACY_NAME_TO_CODE: ReadonlyMap<string, string> = new Map([
  ...BOOKS.map((b) => [b.name.en, b.code] as const),
  ...Object.entries(LEGACY_NAME_ALIASES),
])

type ReadableStorage = Pick<Storage, 'length' | 'key' | 'getItem'>

const legacyKeys = (storage: Pick<Storage, 'length' | 'key'>) => {
  const keys: { key: string; code: string; chapter: number }[] = []
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    const m = key ? /^(.+)_(\d+)$/.exec(key) : null
    const code = m && LEGACY_NAME_TO_CODE.get(m[1])
    if (!key || !m || !code) continue
    const chapter = Number(m[2])
    if (isValidChapter(code, chapter)) keys.push({ key, code, chapter })
  }
  return keys
}

export function readLegacyProgress(storage: ReadableStorage): ChapterRef[] {
  return legacyKeys(storage)
    .filter(({ key }) => storage.getItem(key) === 'true')
    .map(({ code, chapter }) => ({ code, chapter }))
}

/** Removes legacy keys so the import isn't offered again. */
export function clearLegacyProgress(storage: Pick<Storage, 'length' | 'key' | 'removeItem'>) {
  legacyKeys(storage).forEach(({ key }) => storage.removeItem(key))
}
