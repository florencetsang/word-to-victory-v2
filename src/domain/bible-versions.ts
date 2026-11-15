export interface BibleVersion {
  /** Bible.com (YouVersion) numeric version id. */
  id: number
  abbr: string
  label: string
}

/** Curated list of common versions. Extend as needed; `id`/`abbr` must match Bible.com. */
export const BIBLE_VERSIONS: readonly BibleVersion[] = [
  { id: 139, abbr: 'RCUV', label: '和合本修訂版 (RCUV)' },
  { id: 46, abbr: 'CUNP-神', label: '新標點和合本 神版 (CUNP-神)' },
  { id: 414, abbr: 'CUNP-上帝', label: '新標點和合本 上帝版 (CUNP-上帝)' },
  { id: 111, abbr: 'NIV', label: 'New International Version (NIV)' },
  { id: 59, abbr: 'ESV', label: 'English Standard Version (ESV)' },
  { id: 116, abbr: 'NLT', label: 'New Living Translation (NLT)' },
  { id: 1, abbr: 'KJV', label: 'King James Version (KJV)' },
]

export const DEFAULT_BIBLE_VERSION_ID = 139

export const getVersion = (id: number | null | undefined): BibleVersion =>
  BIBLE_VERSIONS.find((v) => v.id === id) ?? BIBLE_VERSIONS.find((v) => v.id === DEFAULT_BIBLE_VERSION_ID)!

export const bibleComLink = (code: string, chapter: number, versionId?: number | null) => {
  const v = getVersion(versionId)
  return `https://www.bible.com/bible/${v.id}/${code}.${chapter}.${encodeURIComponent(v.abbr)}`
}
