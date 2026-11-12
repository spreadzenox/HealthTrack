import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const SRC = resolve('src')

/**
 * Un plugin Capacitor n'est enregistré qu'une fois : un second `registerPlugin('X')` fait écrire à Capacitor
 * « Capacitor plugin "X" already registered » dans la console (vu sur Sources, 12/11 06:35). Le module qui
 * l'enregistre l'exporte, les autres l'importent.
 */
function sources(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sources(path)
    return /\.(js|jsx)$/.test(name) && !/\.test\./.test(name) ? [path] : []
  })
}

describe('registerPlugin', () => {
  it('chaque plugin Capacitor est enregistré par un seul module', () => {
    const seen = new Map()
    for (const file of sources(SRC)) {
      for (const m of readFileSync(file, 'utf8').matchAll(/registerPlugin\(\s*['"]([^'"]+)['"]/g)) {
        seen.set(m[1], [...(seen.get(m[1]) ?? []), file.replace(SRC, 'src')])
      }
    }
    const twice = [...seen].filter(([, files]) => files.length > 1)
    expect(twice).toEqual([])
  })
})
