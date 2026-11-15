import { describe, expect, it } from 'vitest'
import en from './en'
import zhHant from './zh-Hant'

const sources = import.meta.glob<string>(['/src/**/*.{ts,tsx}', '!/src/locales/**'], {
  query: '?raw',
  import: 'default',
  eager: true,
})

type Tree = { [k: string]: string | Tree }

function has(tree: Tree, key: string) {
  const parts = key.split('.')
  const last = parts.pop()!
  let node: Tree | string | undefined = tree
  for (const p of parts) node = typeof node === 'object' ? node[p] : undefined
  return typeof node === 'object' && (last in node || `${last}_other` in node)
}

const namespaces = Object.keys(en)
const usedKeys = [
  ...new Set(
    Object.values(sources).flatMap((src) =>
      [...src.matchAll(/['"`]([a-z]+\.[a-zA-Z.]+)['"`]/g)]
        .map((m) => m[1])
        .filter((k) => namespaces.includes(k.split('.')[0])),
    ),
  ),
]

describe('translations', () => {
  it('finds translation keys in the source', () => {
    expect(usedKeys.length).toBeGreaterThan(100)
  })

  it.each([
    ['en', en],
    ['zh-Hant', zhHant],
  ])('%s defines every key used in the source', (_, messages) => {
    expect(usedKeys.filter((k) => !has(messages as unknown as Tree, k))).toEqual([])
  })
})
